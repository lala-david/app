"""코스 규칙. 앱의 entities/course, entities/progress 와 같은 규칙을 서버에서도 지킨다."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Child, Routine, RoutineRecord, Week, WeekRoutine
from .seed import app_config


def current_week(db: Session) -> Week:
    week = db.get(Week, app_config()["currentWeek"])
    if week is None:
        raise LookupError("current week is not seeded")
    return week


def is_course_day(week: Week, child: Child, day: date) -> bool:
    index = (day - child.run_start_date).days + 1
    return 1 <= index <= week.days


def routines_for(db: Session, week: Week, child: Child, day: date) -> list[Routine]:
    """그날 할 루틴. 주말 신앙 콘텐츠는 부모가 켰을 때만 붙는다."""
    weekend = day.weekday() >= 5
    rows = db.scalars(
        select(Routine).join(WeekRoutine, WeekRoutine.routine_key == Routine.key).where(WeekRoutine.week_no == week.week_no).order_by(Routine.order_no)
    ).all()
    return [r for r in rows if not r.requires_faith or (child.faith_enabled and weekend)]


def done_records(db: Session, child_id: str) -> list[RoutineRecord]:
    return list(db.scalars(select(RoutineRecord).where(RoutineRecord.child_id == child_id, RoutineRecord.completed_at.is_not(None)).order_by(RoutineRecord.completed_at)))


def streak_days(records: list[RoutineRecord], today: date) -> int:
    active = {r.record_date for r in records}
    cursor = today if today in active else today - timedelta(days=1)
    count = 0
    while cursor in active:
        count += 1
        cursor -= timedelta(days=1)
    return count


def week_dates(today: date) -> list[date]:
    monday = today - timedelta(days=today.weekday())
    return [monday + timedelta(days=i) for i in range(7)]
