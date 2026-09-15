"""진행 기록 병합과 요약. 앱 entities/progress/lib/progress.ts 와 같은 규칙."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import LessonProgress
from ..schemas import LessonRecordIn


def merge_record(existing: LessonProgress | None, incoming: LessonRecordIn, child_id: str, key: str) -> LessonProgress:
    """기기가 보낸 기록을 반영한다. 완료 시각은 더 이른 쪽, 단계는 합집합, 별은 큰 쪽을 남긴다 (멱등)."""
    record = existing or LessonProgress(child_id=child_id, lesson_key=key)
    record.run = incoming.run
    record.day = incoming.day
    record.date = incoming.date
    record.routine_key = incoming.routine
    record.source = incoming.source if not (existing and existing.completed_at and existing.source == "app") else "app"
    record.video_status = incoming.video_status if incoming.video_status != "none" else (existing.video_status if existing else "none")
    record.video_started_at = incoming.video_started_at
    record.listened_min = max(incoming.listened_min, existing.listened_min if existing else 0)
    record.steps = sorted(set((existing.steps if existing else []) + list(incoming.steps)))
    record.quiz = incoming.quiz or (existing.quiz if existing else [])
    record.speak = incoming.speak or (existing.speak if existing else [])
    record.stars = max(incoming.stars, existing.stars if existing else 0)
    completed = [t for t in (existing.completed_at if existing else None, incoming.completed_at) if t is not None]
    record.completed_at = min(completed) if completed else None
    return record


def streak_days(db: Session, child_id: str, today: date) -> int:
    rows = db.scalars(
        select(LessonProgress.date).where(
            LessonProgress.child_id == child_id,
            LessonProgress.completed_at.is_not(None),
            LessonProgress.source == "app",
        )
    ).all()
    active = set(rows)
    cursor = today if today in active else today - timedelta(days=1)
    count = 0
    while cursor in active:
        count += 1
        cursor -= timedelta(days=1)
    return count


def summary(db: Session, child_id: str, today: date) -> dict[str, int]:
    records = db.scalars(select(LessonProgress).where(LessonProgress.child_id == child_id)).all()
    week_start = today - timedelta(days=today.weekday())
    return {
        "today_minutes": sum(r.listened_min for r in records if r.date == today),
        "streak": streak_days(db, child_id, today),
        "week_done": sum(1 for r in records if r.completed_at and week_start <= r.date <= today),
        "total_minutes": sum(r.listened_min for r in records),
    }
