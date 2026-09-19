"""Web Push 발송과 매분 루틴 알림."""
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
from ..models import PushSubscription, RoutineRecord, RoutineSchedule, WeekRoutine
from .course import current_week, is_course_day, routines_for

log = logging.getLogger("soundsfun.push")


@dataclass(frozen=True)
class PushMessage:
    user_id: str
    title: str
    body: str
    url: str


def due_messages(db: Session, now_local: datetime) -> list[PushMessage]:
    """지금(분 단위)이 알림 시각이고 아직 끝내지 않은 루틴의 알림 목록."""
    week = current_week(db)
    today = now_local.date()
    messages: list[PushMessage] = []

    schedules = db.scalars(select(RoutineSchedule).where(RoutineSchedule.time_local == now_local.strftime("%H:%M"), RoutineSchedule.enabled.is_(True))).all()
    for schedule in schedules:
        child = schedule.child
        if not child.notifications_enabled or not is_course_day(week, child, today):
            continue
        routine = next((r for r in routines_for(db, week, child, today) if r.key == schedule.routine_key), None)
        if routine is None:
            continue
        done = db.scalar(select(RoutineRecord.completed_at).where(RoutineRecord.child_id == child.id, RoutineRecord.record_date == today, RoutineRecord.routine_key == routine.key))
        if done:
            continue
        content = db.get(WeekRoutine, (week.week_no, routine.key))
        messages.append(PushMessage(user_id=child.user_id, title=f"{routine.title} 시간이에요", body=f"{content.video_title} · {routine.target_minutes}분", url=f"/today?open={routine.key}"))
    return messages


def send_to_user(db: Session, message: PushMessage) -> int:
    settings = get_settings()
    if not settings.vapid_private_key:
        log.info("VAPID key missing; skip push to %s", message.user_id)
        return 0

    from pywebpush import WebPushException, webpush  # 키가 있을 때만 필요한 의존성

    sent = 0
    payload = json.dumps({"title": message.title, "body": message.body, "url": message.url}, ensure_ascii=False)
    for sub in db.scalars(select(PushSubscription).where(PushSubscription.user_id == message.user_id)).all():
        try:
            webpush(subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}, data=payload, vapid_private_key=settings.vapid_private_key, vapid_claims={"sub": settings.vapid_subject})
            sent += 1
        except WebPushException as error:
            if getattr(error.response, "status_code", None) in (404, 410):
                db.delete(sub)  # 브라우저가 구독을 버렸다
            log.warning("push failed: %s", error)
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
