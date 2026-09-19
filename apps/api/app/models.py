"""관계형 스키마.

설계 원칙
- 3정규형: 콘텐츠(주차·루틴·영상·단어)와 사용자 기록을 나누고, 반복되는 값은 참조 테이블로 뺀다.
- 무결성은 DB가 지킨다: 외래키(ON DELETE), 유니크, CHECK 제약을 모델에 선언한다.
- 자연키가 분명한 참조 데이터(루틴·캐릭터·단어)는 그 키를 PK로, 사용자 데이터는 UUID를 PK로 쓴다.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, BigInteger, Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Index, Integer, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.db import Base

AGE_BANDS = ("6", "7", "8", "9-10")
COMPLETION_KINDS = ("timer", "manual", "parent")
QUESTION_TYPES = ("pickImage", "pickWord", "match", "sentenceColor")
SPEAK_RESULTS = ("pass", "passAfterRetry", "passByParent", "given", "skipped")
WORD_GROUPS = ("color", "thing", "routine")


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


# ───────────────────────── 참조·콘텐츠 ─────────────────────────


class Character(Base):
    """디자인 캐릭터 4종 (병아리·악어·고양이·토끼)."""

    __tablename__ = "characters"

    key: Mapped[str] = mapped_column(String(16), primary_key=True)
    name_ko: Mapped[str] = mapped_column(String(16), nullable=False)


class Routine(Base):
    """하루 루틴의 종류. 주차가 바뀌어도 변하지 않는 속성만 둔다."""

    __tablename__ = "routines"
    __table_args__ = (
        CheckConstraint("target_minutes > 0", name="ck_routines_target_positive"),
        CheckConstraint("order_no > 0", name="ck_routines_order_positive"),
    )

    key: Mapped[str] = mapped_column(String(16), primary_key=True)
    order_no: Mapped[int] = mapped_column(SmallInteger, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(32), nullable=False)
    short_title: Mapped[str] = mapped_column(String(16), nullable=False)
    title_en: Mapped[str] = mapped_column(String(32), nullable=False)
    target_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    tone: Mapped[str] = mapped_column(String(16), nullable=False)
    character_key: Mapped[str] = mapped_column(ForeignKey("characters.key", ondelete="RESTRICT"), nullable=False)
    requires_faith: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Week(Base):
    __tablename__ = "weeks"
    __table_args__ = (
        CheckConstraint("week_no BETWEEN 1 AND 48", name="ck_weeks_no_range"),
        CheckConstraint("days BETWEEN 1 AND 7", name="ck_weeks_days_range"),
    )

    week_no: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    theme: Mapped[str] = mapped_column(String(32), nullable=False)
    headline: Mapped[str] = mapped_column(String(64), nullable=False)
    subline: Mapped[str] = mapped_column(String(64), nullable=False)
    activity_title: Mapped[str] = mapped_column(String(64), nullable=False)
    playlist_id: Mapped[str] = mapped_column(String(64), nullable=False)
    days: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=7)

    routines: Mapped[list[WeekRoutine]] = relationship(back_populates="week", cascade="all, delete-orphan", order_by="WeekRoutine.routine_key")
    words: Mapped[list[WeekWord]] = relationship(back_populates="week", cascade="all, delete-orphan", order_by="WeekWord.position")
    sentences: Mapped[list[WeekSentence]] = relationship(back_populates="week", cascade="all, delete-orphan")


class WeekRoutine(Base):
    """주차별 루틴 내용: 그 주에 트는 영상, 안내 문구, 오늘의 한 문장."""

    __tablename__ = "week_routines"
    __table_args__ = (
        CheckConstraint("video_id IS NOT NULL OR video_playlist_id IS NOT NULL", name="ck_week_routines_has_video"),
        CheckConstraint("duration_sec IS NULL OR duration_sec > 0", name="ck_week_routines_duration_positive"),
    )

    week_no: Mapped[int] = mapped_column(ForeignKey("weeks.week_no", ondelete="CASCADE"), primary_key=True)
    routine_key: Mapped[str] = mapped_column(ForeignKey("routines.key", ondelete="RESTRICT"), primary_key=True)
    guide: Mapped[str] = mapped_column(String(128), nullable=False)
    sentence: Mapped[str] = mapped_column(String(128), nullable=False)
    video_id: Mapped[str | None] = mapped_column(String(16))
    video_playlist_id: Mapped[str | None] = mapped_column(String(64))
    video_title: Mapped[str] = mapped_column(String(128), nullable=False)
    video_channel: Mapped[str] = mapped_column(String(64), nullable=False)
    duration_sec: Mapped[int | None] = mapped_column(Integer)

    week: Mapped[Week] = relationship(back_populates="routines")
    routine: Mapped[Routine] = relationship()


class Word(Base):
    __tablename__ = "words"
    __table_args__ = (CheckConstraint(_in("word_group", WORD_GROUPS), name="ck_words_group"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    ko: Mapped[str] = mapped_column(String(32), nullable=False)
    word_group: Mapped[str] = mapped_column(String(16), nullable=False)
    swatch: Mapped[str | None] = mapped_column(String(7))


class WeekWord(Base):
    """그 주 소리활동에 쓰는 단어. is_focus 는 따라 말하기 대상."""

    __tablename__ = "week_words"
    __table_args__ = (UniqueConstraint("week_no", "position", name="uq_week_words_position"), CheckConstraint("position > 0", name="ck_week_words_position_positive"))

    week_no: Mapped[int] = mapped_column(ForeignKey("weeks.week_no", ondelete="CASCADE"), primary_key=True)
    word_id: Mapped[str] = mapped_column(ForeignKey("words.id", ondelete="RESTRICT"), primary_key=True)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_focus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    week: Mapped[Week] = relationship(back_populates="words")
    word: Mapped[Word] = relationship()


class WeekSentence(Base):
    __tablename__ = "week_sentences"
    __table_args__ = (UniqueConstraint("week_no", "text", name="uq_week_sentences_text"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    week_no: Mapped[int] = mapped_column(ForeignKey("weeks.week_no", ondelete="CASCADE"), nullable=False, index=True)
    text: Mapped[str] = mapped_column(String(128), nullable=False)
    answer_word_id: Mapped[str] = mapped_column(ForeignKey("words.id", ondelete="RESTRICT"), nullable=False)

    week: Mapped[Week] = relationship(back_populates="sentences")


# ───────────────────────── 사용자 ─────────────────────────


class User(Base):
    """보호자 계정."""

    __tablename__ = "users"
    __table_args__ = (CheckConstraint("email = lower(email)", name="ck_users_email_lowercase"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    consent_version: Mapped[str] = mapped_column(String(32), nullable=False)
    notify_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    children: Mapped[list[Child]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    subscriptions: Mapped[list[PushSubscription]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)


class Child(Base):
    """아이 프로필. 실명·생년월일·사진은 서버에 두지 않는다 (사진은 기기에만 저장)."""

    __tablename__ = "children"
    __table_args__ = (
        CheckConstraint(_in("age_band", AGE_BANDS), name="ck_children_age_band"),
        CheckConstraint("length(trim(nickname)) > 0", name="ck_children_nickname_not_blank"),
        CheckConstraint("run >= 1", name="ck_children_run_positive"),
        CheckConstraint("run_start_date >= start_date", name="ck_children_run_after_start"),
        # 사진을 고른 아이는 avatar_character 가 비어 있다
        CheckConstraint("uses_photo OR avatar_character IS NOT NULL", name="ck_children_has_avatar"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname: Mapped[str] = mapped_column(String(16), nullable=False)
    age_band: Mapped[str] = mapped_column(String(8), nullable=False)
    uses_photo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    avatar_character: Mapped[str | None] = mapped_column(ForeignKey("characters.key", ondelete="RESTRICT"))
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    run: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    run_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    faith_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    evening_reminder: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship(back_populates="children")
    schedules: Mapped[list[RoutineSchedule]] = relationship(back_populates="child", cascade="all, delete-orphan", passive_deletes=True)


class RoutineSchedule(Base):
    """아이별 루틴 알림 시각."""

    __tablename__ = "routine_schedules"
    __table_args__ = (
        # HH:MM 24시간 형식. 정규식 문법이 DB마다 달라 방언별로 선언한다
        CheckConstraint("time_local GLOB '[0-2][0-9]:[0-5][0-9]' AND time_local < '24:00'", name="ck_routine_schedules_time").ddl_if(dialect="sqlite"),
        CheckConstraint("time_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'", name="ck_routine_schedules_time_pg").ddl_if(dialect="postgresql"),
        Index("ix_routine_schedules_time", "time_local"),
    )

    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), primary_key=True)
    routine_key: Mapped[str] = mapped_column(ForeignKey("routines.key", ondelete="RESTRICT"), primary_key=True)
    time_local: Mapped[str] = mapped_column(String(5), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    child: Mapped[Child] = relationship(back_populates="schedules")


# ───────────────────────── 기록 ─────────────────────────


class RoutineRecord(Base):
    """하루의 루틴 하나. (아이, 날짜, 루틴) 에 한 줄만 있다."""

    __tablename__ = "routine_records"
    __table_args__ = (
        UniqueConstraint("child_id", "record_date", "routine_key", name="uq_routine_records_day_routine"),
        CheckConstraint("completion IS NULL OR " + _in("completion", COMPLETION_KINDS), name="ck_routine_records_completion"),
        # 완료 종류와 완료 시각은 함께 있거나 함께 없다
        CheckConstraint("(completion IS NULL) = (completed_at IS NULL)", name="ck_routine_records_completion_pair"),
        CheckConstraint("accumulated_sec >= 0 AND listened_min >= 0", name="ck_routine_records_non_negative"),
        # 끝난 루틴은 타이머가 돌고 있지 않다
        CheckConstraint("completed_at IS NULL OR running_since IS NULL", name="ck_routine_records_stopped_when_done"),
        Index("ix_routine_records_child_date", "child_id", "record_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    routine_key: Mapped[str] = mapped_column(ForeignKey("routines.key", ondelete="RESTRICT"), nullable=False)
    running_since: Mapped[int | None] = mapped_column(BigInteger)
    accumulated_sec: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    listened_min: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    completion: Mapped[str | None] = mapped_column(String(8))
    completed_at: Mapped[int | None] = mapped_column(BigInteger)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class ActivityRecord(Base):
    """이번 주 소리활동(단어 맞추기·말하기) 한 번."""

    __tablename__ = "activity_records"
    __table_args__ = (
        UniqueConstraint("child_id", "week_no", "record_date", name="uq_activity_records_day"),
        CheckConstraint("stars >= 0", name="ck_activity_records_stars"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), nullable=False, index=True)
    week_no: Mapped[int] = mapped_column(ForeignKey("weeks.week_no", ondelete="RESTRICT"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    stars: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    completed_at: Mapped[int | None] = mapped_column(BigInteger)

    answers: Mapped[list[QuizAnswer]] = relationship(back_populates="activity", cascade="all, delete-orphan", passive_deletes=True)
    attempts: Mapped[list[SpeakAttempt]] = relationship(back_populates="activity", cascade="all, delete-orphan", passive_deletes=True)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    __table_args__ = (
        UniqueConstraint("activity_id", "question_id", name="uq_quiz_answers_question"),
        CheckConstraint(_in("question_type", QUESTION_TYPES), name="ck_quiz_answers_type"),
        CheckConstraint("response_ms >= 0", name="ck_quiz_answers_ms"),
        # 짝 맞추기는 단어 여러 개를 다루므로 word_id 가 없다
        CheckConstraint("(question_type = 'match') = (word_id IS NULL)", name="ck_quiz_answers_word_by_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    activity_id: Mapped[str] = mapped_column(ForeignKey("activity_records.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[str] = mapped_column(String(8), nullable=False)
    question_type: Mapped[str] = mapped_column(String(16), nullable=False)
    word_id: Mapped[str | None] = mapped_column(ForeignKey("words.id", ondelete="RESTRICT"))
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    response_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    activity: Mapped[ActivityRecord] = relationship(back_populates="answers")


class SpeakAttempt(Base):
    __tablename__ = "speak_attempts"
    __table_args__ = (
        UniqueConstraint("activity_id", "word_id", name="uq_speak_attempts_word"),
        CheckConstraint(_in("result", SPEAK_RESULTS), name="ck_speak_attempts_result"),
        CheckConstraint("score BETWEEN 0 AND 1", name="ck_speak_attempts_score"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    activity_id: Mapped[str] = mapped_column(ForeignKey("activity_records.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id: Mapped[str] = mapped_column(ForeignKey("words.id", ondelete="RESTRICT"), nullable=False)
    heard: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    result: Mapped[str] = mapped_column(String(16), nullable=False)

    activity: Mapped[ActivityRecord] = relationship(back_populates="attempts")


# ───────────────────────── 알림·로그 ─────────────────────────


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint: Mapped[str] = mapped_column(String(1024), unique=True, nullable=False)
    p256dh: Mapped[str] = mapped_column(String(255), nullable=False)
    auth: Mapped[str] = mapped_column(String(255), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship(back_populates="subscriptions")


class Event(Base):
    """파일럿 지표용 이벤트 로그. 아이가 지워져도 익명 기록은 남도록 child_id 는 SET NULL."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id: Mapped[str | None] = mapped_column(ForeignKey("children.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    occurred_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
