from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from ..core.config import get_settings
from ..core.security import CurrentUser, DbSession
from ..models import Event, PushSubscription, Week
from ..schemas import EventIn, PushSubscriptionIn, PushUnsubscribeIn
from ..services.push import PushMessage, send_to_user

router = APIRouter()


@router.get("/content/weeks/{week_no}", tags=["content"])
def get_week(week_no: int, db: DbSession) -> dict:
    """테이블에 정규화해 둔 주차 콘텐츠를 앱이 쓰는 모양으로 묶어 준다."""
    week = db.get(Week, week_no)
    if week is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "week_not_found")
    routines = sorted(week.routines, key=lambda wr: wr.routine.order_no)
    return {
        "week": week.week_no, "theme": week.theme, "headline": week.headline, "subline": week.subline, "days": week.days, "playlistId": week.playlist_id,
        "routines": [
            {
                "key": wr.routine_key, "order": wr.routine.order_no, "title": wr.routine.title, "shortTitle": wr.routine.short_title, "titleEn": wr.routine.title_en,
                "targetMinutes": wr.routine.target_minutes, "tone": wr.routine.tone, "character": wr.routine.character_key, "requiresFaith": wr.routine.requires_faith,
                "guide": wr.guide, "sentence": wr.sentence,
                "video": {"videoId": wr.video_id, "playlistId": wr.video_playlist_id, "title": wr.video_title, "channel": wr.video_channel, "durationSec": wr.duration_sec},
            }
            for wr in routines
        ],
        "activity": {
            "title": week.activity_title,
            "words": [w.word_id for w in week.words],
            "focusWords": [w.word_id for w in week.words if w.is_focus],
            "sentences": [{"text": s.text, "answer": s.answer_word_id} for s in week.sentences],
        },
    }


@router.get("/push/public-key", tags=["push"])
def public_key() -> dict[str, str]:
    return {"publicKey": get_settings().vapid_public_key}


@router.post("/push/subscriptions", tags=["push"], status_code=status.HTTP_201_CREATED)
def subscribe(body: PushSubscriptionIn, user: CurrentUser, db: DbSession) -> Response:
    sub = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint))
    if sub is None:
        sub = PushSubscription(endpoint=body.endpoint)
        db.add(sub)
    sub.user_id, sub.p256dh, sub.auth, sub.user_agent = user.id, body.keys.p256dh, body.keys.auth, body.user_agent[:255]
    db.commit()
    return Response(status_code=status.HTTP_201_CREATED)


@router.delete("/push/subscriptions", tags=["push"], status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(body: PushUnsubscribeIn, user: CurrentUser, db: DbSession) -> Response:
    sub = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint, PushSubscription.user_id == user.id))
    if sub:
        db.delete(sub)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/push/test", tags=["push"], status_code=status.HTTP_202_ACCEPTED)
def push_test(user: CurrentUser, db: DbSession) -> dict[str, int]:
    return {"sent": send_to_user(db, PushMessage(user_id=user.id, title="알림이 잘 와요", body="소리 놀이 시간마다 이렇게 알려드릴게요", url="/settings"))}


@router.post("/events", tags=["events"], status_code=status.HTTP_202_ACCEPTED)
def ingest_events(events: list[EventIn], user: CurrentUser, db: DbSession) -> dict[str, int]:
    own = {c.id for c in user.children}
    db.add_all(Event(user_id=user.id, child_id=e.child_id if e.child_id in own else None, name=e.name, payload=e.payload, occurred_at=e.at) for e in events)
    db.commit()
    return {"accepted": len(events)}
