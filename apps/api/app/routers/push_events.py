from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from ..core.config import get_settings
from ..core.security import CurrentUser, DbSession
from ..models import Event, PushSubscription
from ..schemas import EventIn, PushSubscriptionIn, PushUnsubscribeIn
from ..services.content import load_week
from ..services.push import PushMessage, send_to_user

router = APIRouter()


@router.get("/push/public-key", tags=["push"])
def public_key() -> dict[str, str]:
    return {"publicKey": get_settings().vapid_public_key}


@router.post("/push/subscriptions", tags=["push"], status_code=status.HTTP_201_CREATED)
def subscribe(body: PushSubscriptionIn, user: CurrentUser, db: DbSession) -> Response:
    existing = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint))
    if existing:
        existing.user_id, existing.keys = user.id, body.keys.model_dump()
    else:
        db.add(PushSubscription(user_id=user.id, endpoint=body.endpoint, keys=body.keys.model_dump(), user_agent=body.user_agent[:255]))
    db.commit()
    return Response(status_code=status.HTTP_201_CREATED)


@router.delete("/push/subscriptions", tags=["push"], status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(body: PushUnsubscribeIn, user: CurrentUser, db: DbSession) -> Response:
    subscription = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == body.endpoint, PushSubscription.user_id == user.id))
    if subscription:
        db.delete(subscription)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/push/test", tags=["push"], status_code=status.HTTP_202_ACCEPTED)
def push_test(user: CurrentUser, db: DbSession) -> dict[str, int]:
    sent = send_to_user(db, PushMessage(user_id=user.id, title="알림이 잘 와요", body="루틴 시간마다 이렇게 알려드릴게요", url="/settings"))
    return {"sent": sent}


@router.post("/events", tags=["events"], status_code=status.HTTP_202_ACCEPTED)
def ingest_events(events: list[EventIn], user: CurrentUser, db: DbSession) -> dict[str, int]:
    child_ids = {c.id for c in user.children}
    rows = [Event(user_id=user.id, child_id=e.child_id if e.child_id in child_ids else None, name=e.name, payload=e.payload, at=e.at) for e in events]
    db.add_all(rows)
    db.commit()
    return {"accepted": len(rows)}


@router.get("/content/weeks/{week}", tags=["content"])
def get_week(week: int) -> dict:
    try:
        return load_week(week)
    except FileNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "week_not_found") from error
