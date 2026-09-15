import time
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..core.security import CurrentUser, DbSession
from ..models import LessonProgress
from ..schemas import LessonRecordIn, LessonRecordOut, ManualCheckIn, SummaryOut
from ..services.content import lesson_key
from ..services.progress import merge_record, summary
from .children import owned_child

router = APIRouter(tags=["progress"])


def to_out(record: LessonProgress) -> LessonRecordOut:
    return LessonRecordOut(
        key=record.lesson_key,
        run=record.run,
        day=record.day,
        date=record.date,
        routine=record.routine_key,
        source=record.source,
        video_status=record.video_status,
        video_started_at=record.video_started_at,
        listened_min=record.listened_min,
        steps=record.steps,
        quiz=record.quiz,
        speak=record.speak,
        stars=record.stars,
        completed_at=record.completed_at,
    )


@router.get("/children/{child_id}/progress", response_model=list[LessonRecordOut])
def list_progress(
    child_id: str,
    user: CurrentUser,
    db: DbSession,
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
) -> list[LessonRecordOut]:
    owned_child(child_id, user, db)
    query = select(LessonProgress).where(LessonProgress.child_id == child_id)
    if date_from:
        query = query.where(LessonProgress.date >= date_from)
    if date_to:
        query = query.where(LessonProgress.date <= date_to)
    return [to_out(r) for r in db.scalars(query.order_by(LessonProgress.date)).all()]


@router.put("/children/{child_id}/progress/{key}", response_model=LessonRecordOut)
def upsert_progress(child_id: str, key: str, body: LessonRecordIn, user: CurrentUser, db: DbSession) -> LessonRecordOut:
    owned_child(child_id, user, db)
    if key != lesson_key(body.run, body.day, body.routine):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "key_mismatch")
    record = merge_record(db.get(LessonProgress, (child_id, key)), body, child_id, key)
    db.add(record)
    db.commit()
    return to_out(record)


@router.post("/children/{child_id}/manual-check", response_model=LessonRecordOut | None)
def manual_check(child_id: str, body: ManualCheckIn, user: CurrentUser, db: DbSession) -> LessonRecordOut | None:
    owned_child(child_id, user, db)
    key = lesson_key(body.run, body.day, body.routine)
    existing = db.get(LessonProgress, (child_id, key))

    if not body.checked:
        if existing is None or existing.source != "parentCheck":
            raise HTTPException(status.HTTP_409_CONFLICT, "app_record_locked")
        db.delete(existing)
        db.commit()
        return None

    if existing and existing.completed_at:
        return to_out(existing)
    incoming = LessonRecordIn(
        run=body.run, day=body.day, date=body.date, routine=body.routine, source="parentCheck",
        video_status="manual", listened_min=body.listened_min, completed_at=int(time.time() * 1000),
    )
    record = merge_record(existing, incoming, child_id, key)
    db.add(record)
    db.commit()
    return to_out(record)


@router.get("/children/{child_id}/summary", response_model=SummaryOut)
def get_summary(child_id: str, user: CurrentUser, db: DbSession, today: date = Query(...)) -> SummaryOut:
    owned_child(child_id, user, db)
    return SummaryOut(**summary(db, child_id, today))
