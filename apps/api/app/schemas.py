"""요청·응답 스키마. JSON 필드는 앱과 같은 camelCase."""
from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from pydantic.alias_generators import to_camel

AgeBand = Literal["6", "7", "8", "9-10"]
CompletionKind = Literal["timer", "manual", "parent"]
QuestionType = Literal["pickImage", "pickWord", "match", "sentenceColor"]
SpeakResult = Literal["pass", "passAfterRetry", "passByParent", "given", "skipped"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ── 계정 ──
class SignUpIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    consent_version: str = Field(min_length=1, max_length=32)
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


# ── 아이 ──
class AvatarIn(CamelModel):
    """사진은 기기에만 저장하므로 서버에는 ‘사진을 쓴다’는 사실만 온다."""

    kind: Literal["character", "photo"]
    character: str | None = None

    @model_validator(mode="after")
    def character_required(self) -> AvatarIn:
        if self.kind == "character" and not self.character:
            raise ValueError("character is required when kind is 'character'")
        return self


class ScheduleItem(CamelModel):
    routine: str
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    enabled: bool = True


class ChildIn(CamelModel):
    nickname: str = Field(min_length=1, max_length=16)
    age_band: AgeBand
    avatar: AvatarIn
    start_date: date


class ChildPatch(CamelModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=16)
    age_band: AgeBand | None = None
    avatar: AvatarIn | None = None
    run: int | None = Field(default=None, ge=1)
    run_start_date: date | None = None
    faith_enabled: bool | None = None
    notifications_enabled: bool | None = None
    evening_reminder: bool | None = None


class ChildOut(CamelModel):
    id: str
    nickname: str
    age_band: str
    avatar: AvatarIn
    start_date: date
    run: int
    run_start_date: date
    faith_enabled: bool
    notifications_enabled: bool
    evening_reminder: bool
    schedules: list[ScheduleItem]


# ── 루틴 기록 ──
class RoutineRecordIn(CamelModel):
    """기기에서 올리는 하루의 루틴 기록 (멱등 PUT)."""

    running_since: int | None = None
    accumulated_sec: int = Field(default=0, ge=0)
    listened_min: int = Field(default=0, ge=0)
    completion: CompletionKind | None = None
    completed_at: int | None = None

    @model_validator(mode="after")
    def completion_pair(self) -> RoutineRecordIn:
        if (self.completion is None) != (self.completed_at is None):
            raise ValueError("completion and completedAt must be given together")
        return self


class RoutineRecordOut(RoutineRecordIn):
    date: date
    routine: str


class ParentCheckIn(CamelModel):
    checked: bool


# ── 소리활동 ──
class QuizAnswerIn(CamelModel):
    question_id: str = Field(max_length=8)
    type: QuestionType
    word: str | None = None
    correct: bool
    ms: int = Field(default=0, ge=0)


class SpeakAttemptIn(CamelModel):
    word: str
    mode: Literal["word", "sentence"] = "word"
    heard: str = Field(default="", max_length=64)
    score: float = Field(default=0, ge=0, le=1)
    result: SpeakResult


class ActivityIn(CamelModel):
    quiz: list[QuizAnswerIn] = []
    speak: list[SpeakAttemptIn] = []
    stars: int = Field(default=0, ge=0)
    completed_at: int | None = None


class ActivityOut(ActivityIn):
    week: int
    date: date


# ── 리포트 ──
class RoutineRate(CamelModel):
    routine: str
    done: int
    total: int


class ReportOut(CamelModel):
    today_minutes: int
    today_target: int
    streak: int
    week_done: int
    week_total: int
    total_minutes: int
    routine_rates: list[RoutineRate]
    stickers: list[str]


# ── 알림·로그 ──
class PushKeys(CamelModel):
    p256dh: str
    auth: str


class PushSubscriptionIn(CamelModel):
    endpoint: str = Field(max_length=1024)
    keys: PushKeys
    user_agent: str = ""


class PushUnsubscribeIn(CamelModel):
    endpoint: str


class EventIn(CamelModel):
    name: str = Field(max_length=40)
    child_id: str | None = None
    payload: dict[str, Any] = {}
    at: int
