from fastapi import APIRouter, HTTPException, Response, status

from ..core.security import CurrentUser, DbSession
from ..models import Child, RoutineSchedule
from ..schemas import ChildIn, ChildOut, ChildPatch, ScheduleItem
from ..services.content import all_routines, app_config, load_week

router = APIRouter(tags=["children"])


def owned_child(child_id: str, user: CurrentUser, db: DbSession) -> Child:
    child = db.get(Child, child_id)
    if child is None or child.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "child_not_found")
    return child


def to_out(child: Child) -> ChildOut:
    return ChildOut(
        id=child.id,
        nickname=child.nickname,
        age_band=child.age_band,
        avatar=child.avatar,
        start_date=child.start_date,
        run=child.run,
        run_start_date=child.run_start_date,
        faith_enabled=child.faith_enabled,
        notifications_enabled=child.notifications_enabled,
        evening_reminder=child.evening_reminder,
        schedules=[ScheduleItem(routine=s.routine_key, time=s.time_local, enabled=s.enabled) for s in child.schedules],
    )


@router.get("/children", response_model=list[ChildOut])
def list_children(user: CurrentUser) -> list[ChildOut]:
    return [to_out(child) for child in user.children]


@router.post("/children", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child(body: ChildIn, user: CurrentUser, db: DbSession) -> ChildOut:
    if body.avatar.get("kind") == "photo":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "photo_stays_on_device")
    child = Child(user_id=user.id, run_start_date=body.start_date, **body.model_dump())
    child.schedules = [RoutineSchedule(routine_key=s["routine"], time_local=s["time"], enabled=s["enabled"]) for s in app_config()["defaultSchedule"]]
    db.add(child)
    db.commit()
    return to_out(child)


@router.patch("/children/{child_id}", response_model=ChildOut)
def update_child(child_id: str, body: ChildPatch, user: CurrentUser, db: DbSession) -> ChildOut:
    child = owned_child(child_id, user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(child, field, value)
    db.commit()
    return to_out(child)


@router.put("/children/{child_id}/schedule", status_code=status.HTTP_204_NO_CONTENT)
def replace_schedule(child_id: str, items: list[ScheduleItem], user: CurrentUser, db: DbSession) -> Response:
    child = owned_child(child_id, user, db)
    known = {r["key"] for r in all_routines(load_week(app_config()["currentWeek"]))}
    unknown = [i.routine for i in items if i.routine not in known]
    if unknown:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"unknown_routines:{','.join(unknown)}")
    child.schedules = [RoutineSchedule(routine_key=i.routine, time_local=i.time, enabled=i.enabled) for i in items]
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
