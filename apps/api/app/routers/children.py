from fastapi import APIRouter, HTTPException, Response, status

from ..core.security import CurrentUser, DbSession
from ..models import Character, Child, Routine, RoutineSchedule
from ..schemas import AvatarIn, ChildIn, ChildOut, ChildPatch, ScheduleItem
from ..services.seed import app_config

router = APIRouter(tags=["children"])


def owned_child(child_id: str, user: CurrentUser, db: DbSession) -> Child:
    child = db.get(Child, child_id)
    if child is None or child.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "child_not_found")
    return child


def to_out(child: Child) -> ChildOut:
    avatar = AvatarIn(kind="photo") if child.uses_photo else AvatarIn(kind="character", character=child.avatar_character)
    return ChildOut(
        id=child.id, nickname=child.nickname, age_band=child.age_band, avatar=avatar, start_date=child.start_date, run=child.run, run_start_date=child.run_start_date,
        faith_enabled=child.faith_enabled, notifications_enabled=child.notifications_enabled, evening_reminder=child.evening_reminder,
        schedules=[ScheduleItem(routine=s.routine_key, time=s.time_local, enabled=s.enabled) for s in sorted(child.schedules, key=lambda s: s.time_local)],
    )


def apply_avatar(child: Child, avatar: AvatarIn, db: DbSession) -> None:
    if avatar.kind == "character" and db.get(Character, avatar.character) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "unknown_character")
    child.uses_photo = avatar.kind == "photo"
    child.avatar_character = avatar.character if avatar.kind == "character" else None


@router.get("/children", response_model=list[ChildOut])
def list_children(user: CurrentUser) -> list[ChildOut]:
    return [to_out(child) for child in user.children]


@router.post("/children", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child(body: ChildIn, user: CurrentUser, db: DbSession) -> ChildOut:
    child = Child(user_id=user.id, nickname=body.nickname.strip(), age_band=body.age_band, start_date=body.start_date, run_start_date=body.start_date)
    apply_avatar(child, body.avatar, db)
    child.schedules = [RoutineSchedule(routine_key=s["routine"], time_local=s["time"], enabled=s["enabled"]) for s in app_config()["defaultSchedule"]]
    db.add(child)
    db.commit()
    return to_out(child)


@router.patch("/children/{child_id}", response_model=ChildOut)
def update_child(child_id: str, body: ChildPatch, user: CurrentUser, db: DbSession) -> ChildOut:
    child = owned_child(child_id, user, db)
    changes = body.model_dump(exclude_unset=True, exclude={"avatar"})
    if "nickname" in changes:
        changes["nickname"] = changes["nickname"].strip()
    for field, value in changes.items():
        setattr(child, field, value)
    if body.avatar is not None:
        apply_avatar(child, body.avatar, db)
    if child.run_start_date < child.start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "run_start_before_start")
    db.commit()
    return to_out(child)


@router.put("/children/{child_id}/schedule", status_code=status.HTTP_204_NO_CONTENT)
def replace_schedule(child_id: str, items: list[ScheduleItem], user: CurrentUser, db: DbSession) -> Response:
    child = owned_child(child_id, user, db)
    unknown = [i.routine for i in items if db.get(Routine, i.routine) is None]
    if unknown or len({i.routine for i in items}) != len(items):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"invalid_routines:{','.join(unknown)}")
    child.schedules = [RoutineSchedule(routine_key=i.routine, time_local=i.time, enabled=i.enabled) for i in items]
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
