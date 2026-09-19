import time
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..core.security import CurrentUser, DbSession
from ..models import ActivityRecord, QuizAnswer, Routine, RoutineRecord, SpeakAttempt, Week, Word
from ..schemas import ActivityIn, ActivityOut, ParentCheckIn, QuizAnswerIn, ReportOut, RoutineRate, RoutineRecordIn, RoutineRecordOut, SpeakAttemptIn
from ..services.course import current_week, done_records, is_course_day, routines_for, streak_days, week_dates
from ..services.seed import app_config
from .children import owned_child

router = APIRouter(tags=["records"])


def _record_out(record: RoutineRecord) -> RoutineRecordOut:
    return RoutineRecordOut(date=record.record_date, routine=record.routine_key, running_since=record.running_since, accumulated_sec=record.accumulated_sec, listened_min=record.listened_min, completion=record.completion, completed_at=record.completed_at)


def _find(db: DbSession, child_id: str, day: date, routine: str) -> RoutineRecord | None:
    return db.scalar(select(RoutineRecord).where(RoutineRecord.child_id == child_id, RoutineRecord.record_date == day, RoutineRecord.routine_key == routine))


@router.get("/children/{child_id}/records", response_model=list[RoutineRecordOut])
def list_records(child_id: str, user: CurrentUser, db: DbSession, date_from: date | None = Query(default=None, alias="from"), date_to: date | None = Query(default=None, alias="to")) -> list[RoutineRecordOut]:
    owned_child(child_id, user, db)
    query = select(RoutineRecord).where(RoutineRecord.child_id == child_id)
    if date_from:
        query = query.where(RoutineRecord.record_date >= date_from)
    if date_to:
        query = query.where(RoutineRecord.record_date <= date_to)
    return [_record_out(r) for r in db.scalars(query.order_by(RoutineRecord.record_date, RoutineRecord.routine_key))]


@router.put("/children/{child_id}/records/{day}/{routine}", response_model=RoutineRecordOut)
def upsert_record(child_id: str, day: date, routine: str, body: RoutineRecordIn, user: CurrentUser, db: DbSession) -> RoutineRecordOut:
    """기기 기록을 올린다. 같은 요청을 여러 번 보내도 결과가 같고, 이미 끝난 기록은 되돌리지 않는다."""
    owned_child(child_id, user, db)
    if db.get(Routine, routine) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "routine_not_found")

    record = _find(db, child_id, day, routine) or RoutineRecord(child_id=child_id, record_date=day, routine_key=routine)
    record.accumulated_sec = max(record.accumulated_sec or 0, body.accumulated_sec)
    record.listened_min = max(record.listened_min or 0, body.listened_min)
    if record.completed_at is None and body.completed_at is not None:
        record.completion, record.completed_at = body.completion, body.completed_at
    record.running_since = None if record.completed_at is not None else body.running_since
    db.add(record)
    db.commit()
    return _record_out(record)


@router.post("/children/{child_id}/records/{day}/{routine}/parent-check", response_model=RoutineRecordOut | None)
def parent_check(child_id: str, day: date, routine: str, body: ParentCheckIn, user: CurrentUser, db: DbSession) -> RoutineRecordOut | None:
    """부모 탭의 표시·해제. 앱에서 완료한 기록은 지울 수 없다."""
    owned_child(child_id, user, db)
    target = db.get(Routine, routine)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "routine_not_found")
    if day > date.today():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "future_date")

    record = _find(db, child_id, day, routine)
    if not body.checked:
        if record is None:
            return None
        if record.completion != "parent":
            raise HTTPException(status.HTTP_409_CONFLICT, "app_record_locked")
        db.delete(record)
        db.commit()
        return None

    if record is None:
        record = RoutineRecord(child_id=child_id, record_date=day, routine_key=routine)
    if record.completed_at is None:
        record.running_since = None
        record.listened_min = target.target_minutes
        record.completion, record.completed_at = "parent", int(time.time() * 1000)
    db.add(record)
    db.commit()
    return _record_out(record)


def _require_word(db: DbSession, word_id: str | None) -> None:
    if word_id is not None and db.get(Word, word_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"unknown_word:{word_id}")


@router.put("/children/{child_id}/activities/{week_no}/{day}", response_model=ActivityOut)
def upsert_activity(child_id: str, week_no: int, day: date, body: ActivityIn, user: CurrentUser, db: DbSession) -> ActivityOut:
    owned_child(child_id, user, db)
    if db.get(Week, week_no) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "week_not_found")
    for answer in body.quiz:
        if (answer.type == "match") != (answer.word is None):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "word_must_match_question_type")
        _require_word(db, answer.word)
    for attempt in body.speak:
        _require_word(db, attempt.word)

    activity = db.scalar(select(ActivityRecord).where(ActivityRecord.child_id == child_id, ActivityRecord.week_no == week_no, ActivityRecord.record_date == day))
    if activity is None:
        activity = ActivityRecord(child_id=child_id, week_no=week_no, record_date=day)
        db.add(activity)
    activity.stars, activity.completed_at = body.stars, body.completed_at
    # 같은 문항을 다시 넣기 전에 옛 행을 먼저 지워야 유니크 제약에 걸리지 않는다
    activity.answers, activity.attempts = [], []
    db.flush()
    activity.answers =[QuizAnswer(question_id=a.question_id, question_type=a.type, word_id=a.word, correct=a.correct, response_ms=a.ms) for a in body.quiz]
    activity.attempts = [SpeakAttempt(word_id=s.word, mode=s.mode, heard=s.heard, score=s.score, result=s.result) for s in body.speak]
    db.commit()

    return ActivityOut(
        week=week_no, date=day, stars=activity.stars, completed_at=activity.completed_at,
        quiz=[QuizAnswerIn(question_id=a.question_id, type=a.question_type, word=a.word_id, correct=a.correct, ms=a.response_ms) for a in activity.answers],
        speak=[SpeakAttemptIn(word=s.word_id, mode=s.mode, heard=s.heard, score=s.score, result=s.result) for s in activity.attempts],
    )


@router.get("/children/{child_id}/report", response_model=ReportOut)
def report(child_id: str, user: CurrentUser, db: DbSession, today: date = Query(...)) -> ReportOut:
    """부모 탭의 요약 네 칸, 루틴별 완료, 모은 스티커."""
    child = owned_child(child_id, user, db)
    week = current_week(db)
    records = done_records(db, child_id)
    done_keys = {(r.record_date, r.routine_key) for r in records}

    dates = [d for d in week_dates(today) if d >= child.start_date]
    cells = [(d, r.key) for d in dates for r in routines_for(db, week, child, d)]
    elapsed = [d for d in dates if d <= today and is_course_day(week, child, d)]
    core = [r for r in routines_for(db, week, child, today) if not r.requires_faith]
    characters = {r.key: r.character_key for r in db.scalars(select(Routine))}

    return ReportOut(
        today_minutes=sum(r.listened_min for r in records if r.record_date == today),
        today_target=app_config()["dailyTargetMinutes"],
        streak=streak_days(records, today),
        week_done=sum(1 for cell in cells if cell in done_keys),
        week_total=len(cells),
        total_minutes=sum(r.listened_min for r in records),
        routine_rates=[RoutineRate(routine=r.key, done=sum(1 for d in elapsed if (d, r.key) in done_keys), total=len(elapsed)) for r in core],
        stickers=[characters[r.routine_key] for r in records],
    )
