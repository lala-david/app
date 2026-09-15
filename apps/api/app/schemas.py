"""요청·응답 스키마. JSON 필드는 앱과 같은 camelCase를 쓴다."""
from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ── auth ──────────────────────────────────────────────
class SignUpIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    consent_version: str
    notify_consent: bool = True


class LogInIn(CamelModel):
    email: EmailStr
    password: str


class RefreshIn(CamelModel):
    refresh_token: str


class TokensOut(CamelModel):
    access_token: str
    refresh_token: str
    user_id: str


# ── child ─────────────────────────────────────────────
AgeBand = Literal["6", "7", "8", "9-10"]


class ScheduleItem(CamelModel):
    routine: str
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    enabled: bool = True


class ChildIn(CamelModel):
    nickname: str = Field(min_length=1, max_length=16)
    age_band: AgeBand
    avatar: dict[str, Any] = Field(default_factory=dict, description="builder 옵션만. 사진은 기기에만 저장")
    start_date: date
    faith_enabled: bool = False
    notifications_enabled: bool = True
    evening_reminder: bool = True


class ChildPatch(CamelModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=16)
    age_band: AgeBand | None = None
    avatar: dict[str, Any] | None = None
    run: int | None = Field(default=None, ge=1)
    run_start_date: date | None = None
    faith_enabled: bool | None = None
    notifications_enabled: bool | None = None
    evening_reminder: bool | None = None


class ChildOut(CamelModel):
    id: str
    nickname: str
    age_band: str
    avatar: dict[str, Any]
    start_date: date
    run: int
    run_start_date: date
    faith_enabled: bool
    notifications_enabled: bool
    evening_reminder: bool
    schedules: list[ScheduleItem] = []


# ── progress ──────────────────────────────────────────
class LessonRecordIn(CamelModel):
    run: int = Field(ge=1)
    day: int = Field(ge=1)
    date: date
    routine: str
    source: Literal["app", "parentCheck"] = "app"
    video_status: Literal["none", "auto", "manual"] = "none"
    video_started_at: int | None = None
    listened_min: int = Field(default=0, ge=0)
    steps: list[Literal["video", "quiz", "speak"]] = []
    quiz: list[dict[str, Any]] = []
    speak: list[dict[str, Any]] = []
    stars: int = Field(default=0, ge=0)
    completed_at: int | None = None


class LessonRecordOut(LessonRecordIn):
    key: str


class ManualCheckIn(CamelModel):
    run: int = Field(ge=1)
    day: int = Field(ge=1)
    date: date
    routine: str
    checked: bool
    listened_min: int = Field(default=20, ge=0)


class SummaryOut(CamelModel):
    today_minutes: int
    streak: int
    week_done: int
    total_minutes: int


# ── push & events ─────────────────────────────────────
class PushKeys(CamelModel):
    p256dh: str
    auth: str


class PushSubscriptionIn(CamelModel):
    endpoint: str
    keys: PushKeys
    user_agent: str = ""


class PushUnsubscribeIn(CamelModel):
    endpoint: str


class EventIn(CamelModel):
    name: str = Field(max_length=40)
    child_id: str | None = None
    payload: dict[str, Any] = {}
    at: int
