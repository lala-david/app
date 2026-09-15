"""DB 모델. 앱의 entities(child, progress, reward)와 같은 모양을 유지한다."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.db import Base


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    consent_version: Mapped[str] = mapped_column(String(32))
    notify_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    children: Mapped[list[Child]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    subscriptions: Mapped[list[PushSubscription]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)


class Child(Base):
    __tablename__ = "children"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nickname: Mapped[str] = mapped_column(String(16))
    age_band: Mapped[str] = mapped_column(String(8))
    avatar: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    start_date: Mapped[date] = mapped_column(Date)
    run: Mapped[int] = mapped_column(Integer, default=1)
    run_start_date: Mapped[date] = mapped_column(Date)
    faith_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    evening_reminder: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped[User] = relationship(back_populates="children")
    schedules: Mapped[list[RoutineSchedule]] = relationship(back_populates="child", cascade="all, delete-orphan", passive_deletes=True)
    progress: Mapped[list[LessonProgress]] = relationship(cascade="all, delete-orphan", passive_deletes=True)
    rewards: Mapped[list[Reward]] = relationship(cascade="all, delete-orphan", passive_deletes=True)


class RoutineSchedule(Base):
    __tablename__ = "routine_schedules"
    __table_args__ = (UniqueConstraint("child_id", "routine_key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), index=True)
    routine_key: Mapped[str] = mapped_column(String(32))
    time_local: Mapped[str] = mapped_column(String(5), index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    child: Mapped[Child] = relationship(back_populates="schedules")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), primary_key=True)
    lesson_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    run: Mapped[int] = mapped_column(Integer)
    day: Mapped[int] = mapped_column(Integer)
    date: Mapped[date] = mapped_column(Date, index=True)
    routine_key: Mapped[str] = mapped_column(String(32))
    source: Mapped[str] = mapped_column(String(16), default="app")
    video_status: Mapped[str] = mapped_column(String(8), default="none")
    video_started_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    listened_min: Mapped[int] = mapped_column(Integer, default=0)
    steps: Mapped[list[str]] = mapped_column(JSON, default=list)
    quiz: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    speak: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Reward(Base):
    __tablename__ = "rewards"

    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), primary_key=True)
    reward_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16))
    image: Mapped[str] = mapped_column(String(80))
    date: Mapped[date] = mapped_column(Date)
    lesson_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    earned_at: Mapped[int] = mapped_column(BigInteger)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    endpoint: Mapped[str] = mapped_column(String(1024), unique=True)
    keys: Mapped[dict[str, str]] = mapped_column(JSON)
    user_agent: Mapped[str] = mapped_column(String(255), default="")

    user: Mapped[User] = relationship(back_populates="subscriptions")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    child_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(40), index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    at: Mapped[int] = mapped_column(BigInteger)
