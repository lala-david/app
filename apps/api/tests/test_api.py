import os
from datetime import datetime

os.environ["DATABASE_URL"] = "sqlite:///./test-soundsfun.db"
os.environ["RUN_SCHEDULER"] = "0"
os.environ["JWT_SECRET"] = "test-secret-with-enough-length-for-hs256!!"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.main import create_app  # noqa: E402
from app.services.push import due_messages  # noqa: E402

PREFIX = "/api/v1"


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(create_app()) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)


def auth_headers(client: TestClient, email: str = "parent@example.com") -> dict[str, str]:
    response = client.post(f"{PREFIX}/auth/signup", json={"email": email, "password": "password1", "consentVersion": "2026-09-16"})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def create_child(client: TestClient, headers: dict[str, str]) -> dict:
    body = {"nickname": "하늘", "ageBand": "7", "avatar": {"kind": "builder", "seed": "s", "options": {}}, "startDate": "2026-09-16"}
    response = client.post(f"{PREFIX}/children", json=body, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_signup_login_and_duplicate(client):
    auth_headers(client)
    duplicate = client.post(f"{PREFIX}/auth/signup", json={"email": "PARENT@example.com", "password": "password1", "consentVersion": "v"})
    assert duplicate.status_code == 409
    assert client.post(f"{PREFIX}/auth/login", json={"email": "parent@example.com", "password": "wrong-pass"}).status_code == 401
    tokens = client.post(f"{PREFIX}/auth/login", json={"email": "parent@example.com", "password": "password1"}).json()
    refreshed = client.post(f"{PREFIX}/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    assert refreshed.status_code == 200


def test_child_rejects_photo_and_gets_default_schedule(client):
    headers = auth_headers(client)
    photo = {"nickname": "하늘", "ageBand": "7", "avatar": {"kind": "photo"}, "startDate": "2026-09-16"}
    assert client.post(f"{PREFIX}/children", json=photo, headers=headers).status_code == 422
    child = create_child(client, headers)
    assert {s["routine"] for s in child["schedules"]} >= {"morning", "theme", "dinner", "bedtime"}


def test_progress_upsert_is_idempotent_and_keeps_earliest_completion(client):
    headers = auth_headers(client)
    child = create_child(client, headers)
    url = f"{PREFIX}/children/{child['id']}/progress/r1-d1-theme"
    record = {"run": 1, "day": 1, "date": "2026-09-16", "routine": "theme", "steps": ["video"], "listenedMin": 30, "stars": 3, "completedAt": 2000}
    assert client.put(url, json=record, headers=headers).status_code == 200
    second = client.put(url, json={**record, "steps": ["quiz"], "completedAt": 1000, "stars": 1}, headers=headers).json()
    assert second["steps"] == ["quiz", "video"]
    assert second["completedAt"] == 1000
    assert second["stars"] == 3
    mismatch = client.put(f"{PREFIX}/children/{child['id']}/progress/r1-d2-theme", json=record, headers=headers)
    assert mismatch.status_code == 422


def test_manual_check_and_summary(client):
    headers = auth_headers(client)
    child = create_child(client, headers)
    check = {"run": 1, "day": 1, "date": "2026-09-16", "routine": "dinner", "checked": True, "listenedMin": 20}
    created = client.post(f"{PREFIX}/children/{child['id']}/manual-check", json=check, headers=headers).json()
    assert created["source"] == "parentCheck"
    summary = client.get(f"{PREFIX}/children/{child['id']}/summary", params={"today": "2026-09-16"}, headers=headers).json()
    assert summary == {"todayMinutes": 20, "streak": 0, "weekDone": 1, "totalMinutes": 20}
    removed = client.post(f"{PREFIX}/children/{child['id']}/manual-check", json={**check, "checked": False}, headers=headers)
    assert removed.status_code == 200


def test_other_parent_cannot_read_child(client):
    child = create_child(client, auth_headers(client))
    stranger = auth_headers(client, "other@example.com")
    assert client.get(f"{PREFIX}/children/{child['id']}/progress", headers=stranger).status_code == 404


def test_due_messages_skip_completed_routines(client):
    headers = auth_headers(client)
    child = create_child(client, headers)
    morning = datetime(2026, 9, 16, 7, 30)
    with SessionLocal() as db:
        assert [m.url for m in due_messages(db, morning)] == ["/home?lesson=r1-d1-morning"]
    record = {"run": 1, "day": 1, "date": "2026-09-16", "routine": "morning", "listenedMin": 20, "completedAt": 1}
    client.put(f"{PREFIX}/children/{child['id']}/progress/r1-d1-morning", json=record, headers=headers)
    with SessionLocal() as db:
        assert due_messages(db, morning) == []


def test_delete_account_cascades(client):
    headers = auth_headers(client)
    create_child(client, headers)
    assert client.delete(f"{PREFIX}/me", headers=headers).status_code == 204
    assert client.post(f"{PREFIX}/auth/login", json={"email": "parent@example.com", "password": "password1"}).status_code == 401
