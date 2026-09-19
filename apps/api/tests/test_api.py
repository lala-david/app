import os
from datetime import date, datetime, timedelta

os.environ["DATABASE_URL"] = "sqlite:///./test-soundsfun.db"
os.environ["RUN_SCHEDULER"] = "0"
os.environ["JWT_SECRET"] = "test-secret-with-enough-length-for-hs256!!"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.exc import IntegrityError  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import Child, QuizAnswer, Routine, RoutineRecord, RoutineSchedule, User, Week, WeekWord  # noqa: E402
from app.services.push import due_messages  # noqa: E402
from app.services.seed import seed_content  # noqa: E402

API = "/api/v1"
TODAY = date.today()


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(create_app()) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)


def auth(client: TestClient, email: str = "parent@example.com") -> dict[str, str]:
    response = client.post(f"{API}/auth/signup", json={"email": email, "password": "password1", "consentVersion": "2026-09-19"})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def make_child(client: TestClient, headers, start: date = TODAY, **extra) -> dict:
    body = {"nickname": "하이", "ageBand": "7", "avatar": {"kind": "character", "character": "chick"}, "startDate": start.isoformat(), **extra}
    response = client.post(f"{API}/children", json=body, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ── 콘텐츠 시드 ──
def test_seed_is_idempotent_and_matches_the_design(client):
    with SessionLocal() as db:
        seed_content(db)
        seed_content(db)
        assert [r.title for r in db.query(Routine).order_by(Routine.order_no)][:4] == ["아침 노래", "오늘의 주제", "저녁 노래", "잠자리 이야기"]
        assert db.get(Week, 1).theme == "Colors"
        assert db.query(WeekWord).filter_by(week_no=1, is_focus=True).count() == 4
    week = client.get(f"{API}/content/weeks/1").json()
    assert [r["character"] for r in week["routines"]][:4] == ["chick", "crocodile", "cat", "rabbit"]
    assert week["routines"][1]["video"]["videoId"] == "v-BvRlsbUiU"
    assert week["activity"]["focusWords"] == ["red", "yellow", "green", "blue"]


# ── 계정 ──
def test_signup_login_refresh_and_duplicate(client):
    auth(client)
    assert client.post(f"{API}/auth/signup", json={"email": "PARENT@example.com", "password": "password1", "consentVersion": "v"}).status_code == 409
    assert client.post(f"{API}/auth/login", json={"email": "parent@example.com", "password": "nope-nope"}).status_code == 401
    tokens = client.post(f"{API}/auth/login", json={"email": "parent@example.com", "password": "password1"}).json()
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": tokens["refreshToken"]}).status_code == 200


# ── 아이 ──
def test_child_avatar_rules_and_default_schedule(client):
    headers = auth(client)
    assert client.post(f"{API}/children", json={"nickname": "하이", "ageBand": "7", "avatar": {"kind": "character"}, "startDate": TODAY.isoformat()}, headers=headers).status_code == 422
    assert client.post(f"{API}/children", json={"nickname": "하이", "ageBand": "7", "avatar": {"kind": "character", "character": "dragon"}, "startDate": TODAY.isoformat()}, headers=headers).status_code == 422
    child = make_child(client, headers)
    assert {s["routine"] for s in child["schedules"]} >= {"morning", "theme", "dinner", "bedtime"}
    photo = client.patch(f"{API}/children/{child['id']}", json={"avatar": {"kind": "photo"}}, headers=headers).json()
    assert photo["avatar"] == {"kind": "photo", "character": None}


def test_schedule_validation(client):
    headers = auth(client)
    child = make_child(client, headers)
    url = f"{API}/children/{child['id']}/schedule"
    assert client.put(url, json=[{"routine": "morning", "time": "25:00"}], headers=headers).status_code == 422
    assert client.put(url, json=[{"routine": "nap", "time": "07:30"}], headers=headers).status_code == 422
    assert client.put(url, json=[{"routine": "morning", "time": "07:00"}, {"routine": "morning", "time": "08:00"}], headers=headers).status_code == 422
    assert client.put(url, json=[{"routine": "morning", "time": "06:50", "enabled": True}], headers=headers).status_code == 204


# ── 루틴 기록 ──
def test_record_upsert_is_idempotent_and_never_uncompletes(client):
    headers = auth(client)
    child = make_child(client, headers)
    url = f"{API}/children/{child['id']}/records/{TODAY}/theme"
    done = {"accumulatedSec": 1800, "listenedMin": 30, "completion": "timer", "completedAt": 2000}
    assert client.put(url, json=done, headers=headers).status_code == 200
    again = client.put(url, json={"accumulatedSec": 60, "listenedMin": 1, "runningSince": 5}, headers=headers).json()
    assert again["completion"] == "timer" and again["completedAt"] == 2000 and again["listenedMin"] == 30 and again["runningSince"] is None
    assert client.put(url, json={"completion": "timer"}, headers=headers).status_code == 422
    assert client.put(f"{API}/children/{child['id']}/records/{TODAY}/nap", json=done, headers=headers).status_code == 404
    assert len(client.get(f"{API}/children/{child['id']}/records", headers=headers).json()) == 1


def test_parent_check_marks_and_clears_but_cannot_remove_app_records(client):
    headers = auth(client)
    child = make_child(client, headers)
    base = f"{API}/children/{child['id']}/records/{TODAY}"
    checked = client.post(f"{base}/dinner/parent-check", json={"checked": True}, headers=headers).json()
    assert checked["completion"] == "parent" and checked["listenedMin"] == 20
    assert client.post(f"{base}/dinner/parent-check", json={"checked": False}, headers=headers).status_code == 200
    client.put(f"{base}/morning", json={"listenedMin": 20, "completion": "manual", "completedAt": 1}, headers=headers)
    assert client.post(f"{base}/morning/parent-check", json={"checked": False}, headers=headers).status_code == 409
    tomorrow = TODAY + timedelta(days=1)
    assert client.post(f"{API}/children/{child['id']}/records/{tomorrow}/morning/parent-check", json={"checked": True}, headers=headers).status_code == 422


# ── 소리활동 ──
def test_activity_upsert_replaces_answers_and_validates_words(client):
    headers = auth(client)
    child = make_child(client, headers)
    url = f"{API}/children/{child['id']}/activities/1/{TODAY}"
    body = {"quiz": [{"questionId": "q1", "type": "pickImage", "word": "red", "correct": True, "ms": 900}, {"questionId": "q4", "type": "match", "correct": False}], "speak": [{"word": "red", "heard": "red", "score": 1, "result": "pass"}], "stars": 2, "completedAt": 5}
    first = client.put(url, json=body, headers=headers)
    assert first.status_code == 200, first.text
    assert len(client.put(url, json=body, headers=headers).json()["quiz"]) == 2
    with SessionLocal() as db:
        assert db.query(QuizAnswer).count() == 2
    assert client.put(url, json={"quiz": [{"questionId": "q1", "type": "pickImage", "word": "dragon", "correct": True}]}, headers=headers).status_code == 422
    assert client.put(url, json={"quiz": [{"questionId": "q1", "type": "match", "word": "red", "correct": True}]}, headers=headers).status_code == 422


# ── 리포트 ──
def test_report_matches_the_parent_screen(client):
    headers = auth(client)
    child = make_child(client, headers, start=TODAY - timedelta(days=1))
    base = f"{API}/children/{child['id']}/records"
    client.put(f"{base}/{TODAY - timedelta(days=1)}/morning", json={"listenedMin": 20, "completion": "timer", "completedAt": 1}, headers=headers)
    client.put(f"{base}/{TODAY}/theme", json={"listenedMin": 30, "completion": "manual", "completedAt": 2}, headers=headers)
    report = client.get(f"{API}/children/{child['id']}/report", params={"today": TODAY.isoformat()}, headers=headers).json()
    assert report["todayMinutes"] == 30 and report["todayTarget"] == 90 and report["totalMinutes"] == 50 and report["streak"] == 2
    assert report["stickers"] == ["chick", "crocodile"]
    assert {r["routine"] for r in report["routineRates"]} == {"morning", "theme", "dinner", "bedtime"}


# ── 권한·탈퇴 ──
def test_other_parent_cannot_touch_a_child(client):
    child = make_child(client, auth(client))
    stranger = auth(client, "other@example.com")
    assert client.get(f"{API}/children/{child['id']}/records", headers=stranger).status_code == 404
    assert client.put(f"{API}/children/{child['id']}/records/{TODAY}/morning", json={}, headers=stranger).status_code == 404


def test_delete_account_cascades_everything(client):
    headers = auth(client)
    child = make_child(client, headers)
    client.put(f"{API}/children/{child['id']}/records/{TODAY}/morning", json={"listenedMin": 20, "completion": "timer", "completedAt": 1}, headers=headers)
    assert client.delete(f"{API}/me", headers=headers).status_code == 204
    with SessionLocal() as db:
        assert db.query(User).count() == 0 and db.query(Child).count() == 0 and db.query(RoutineRecord).count() == 0 and db.query(RoutineSchedule).count() == 0


# ── 알림 ──
def test_due_messages_skip_finished_routines(client):
    headers = auth(client)
    child = make_child(client, headers)
    morning = datetime.combine(TODAY, datetime.min.time()).replace(hour=7, minute=30)
    with SessionLocal() as db:
        assert [m.url for m in due_messages(db, morning)] == ["/today?open=morning"]
    client.put(f"{API}/children/{child['id']}/records/{TODAY}/morning", json={"listenedMin": 20, "completion": "timer", "completedAt": 1}, headers=headers)
    with SessionLocal() as db:
        assert due_messages(db, morning) == []


# ── DB 무결성: API를 거치지 않고 잘못된 값을 넣어도 DB가 막는다 ──
@pytest.mark.parametrize(
    "make",
    [
        lambda c: RoutineRecord(child_id=c, record_date=TODAY, routine_key="morning", completion="timer", completed_at=None),
        lambda c: RoutineRecord(child_id=c, record_date=TODAY, routine_key="morning", completion="later", completed_at=1),
        lambda c: RoutineRecord(child_id=c, record_date=TODAY, routine_key="morning", accumulated_sec=-5),
        lambda c: RoutineRecord(child_id=c, record_date=TODAY, routine_key="nap"),
        lambda c: RoutineRecord(child_id="no-such-child", record_date=TODAY, routine_key="morning"),
        lambda c: RoutineSchedule(child_id=c, routine_key="snack", time_local="07:30"),
        lambda c: Child(user_id="no-such-user", nickname="하이", age_band="7", avatar_character="chick", start_date=TODAY, run_start_date=TODAY),
    ],
    ids=["completion-without-time", "unknown-completion", "negative-seconds", "unknown-routine", "orphan-record", "unknown-schedule-routine", "orphan-child"],
)
def test_database_rejects_invalid_rows(client, make):
    child = make_child(client, auth(client))
    with SessionLocal() as db, pytest.raises(IntegrityError):
        db.add(make(child["id"]))
        db.commit()


def test_database_enforces_unique_day_routine_and_child_rules(client):
    child = make_child(client, auth(client))
    with SessionLocal() as db, pytest.raises(IntegrityError):
        db.add_all([RoutineRecord(child_id=child["id"], record_date=TODAY, routine_key="morning"), RoutineRecord(child_id=child["id"], record_date=TODAY, routine_key="morning")])
        db.commit()
    with SessionLocal() as db, pytest.raises(IntegrityError):
        user_id = db.query(User).first().id
        db.add(Child(user_id=user_id, nickname="  ", age_band="7", avatar_character="chick", start_date=TODAY, run_start_date=TODAY))
        db.commit()
    with SessionLocal() as db, pytest.raises(IntegrityError):
        user_id = db.query(User).first().id
        db.add(Child(user_id=user_id, nickname="하이", age_band="12", avatar_character="chick", start_date=TODAY, run_start_date=TODAY))
        db.commit()
