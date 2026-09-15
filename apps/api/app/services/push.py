"""Web Push 발송과 매분 루틴 알림 스케줄."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..core.db import SessionLocal
from ..models import Child, LessonProgress, PushSubscription, RoutineSchedule
from .content import app_config, lesson_key, load_week, routines_for_date

log = logging.getLogger("soundsfun.push")


@dataclass(frozen=True)
class PushMessage:
    user_id: str
    title: str
    body: str
    url: str


def due_messages(db: Session, now_local: datetime) -> list[PushMessage]:
    """지금(분 단위)이 루틴 시각이고, 아직 끝내지 않은 루틴의 알림 목록."""
    week = load_week(app_config()["currentWeek"])
    today = now_local.date()
    hhmm = now_local.strftime("%H:%M")
    messages: list[PushMessage] = []

    schedules = db.scalars(select(RoutineSchedule).where(RoutineSchedule.time_local == hhmm, RoutineSchedule.enabled.is_(True))).all()
    for schedule in schedules:
        child: Child = schedule.child
        if not child.notifications_enabled:
            continue
        day = (today - child.run_start_date).days + 1
        if not 1 <= day <= week["days"]:
            continue
        routine = next((r for r in routines_for_date(week, today, child.faith_enabled) if r["key"] == schedule.routine_key), None)
        if routine is None:
            continue
        key = lesson_key(child.run, day, routine["key"])
        done = db.scalar(select(LessonProgress.completed_at).where(LessonProgress.child_id == child.id, LessonProgress.lesson_key == key))
        if done:
            continue
        messages.append(
            PushMessage(
                user_id=child.user_id,
                title=f"{routine['titleKo']} 시간이에요",
                body=f"{routine['video']['title']} · {routine['targetMinutes']}분",
                url=f"/home?lesson={key}",
            )
        )
    return messages


def send_to_user(db: Session, message: PushMessage) -> int:
    settings = get_settings()
    if not settings.vapid_private_key:
        log.info("VAPID key missing; skip push to %s", message.user_id)
        return 0

    from pywebpush import WebPushException, webpush  # 선택 의존성: 키가 있을 때만 불러온다

    sent = 0
    payload = json.dumps({"title": message.title, "body": message.body, "url": message.url}, ensure_ascii=False)
    for subscription in db.scalars(select(PushSubscription).where(PushSubscription.user_id == message.user_id)).all():
        try:
            webpush(
                subscription_info={"endpoint": subscription.endpoint, "keys": subscription.keys},
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
            )
            sent += 1
        except WebPushException as error:
            status = getattr(error.response, "status_code", None)
            if status in (404, 410):
                db.delete(subscription)
            log.warning("push failed %s: %s", status, error)
    db.commit()
    return sent


def run_due_notifications() -> None:
    now_local = datetime.now(ZoneInfo(get_settings().timezone))
    with SessionLocal() as db:
        for message in due_messages(db, now_local):
            send_to_user(db, message)


def start_scheduler():
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(timezone=get_settings().timezone)
    scheduler.add_job(run_due_notifications, "cron", minute="*", id="routine-notifications", replace_existing=True)
    scheduler.start()
    return scheduler
