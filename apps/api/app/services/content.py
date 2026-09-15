"""앱과 같은 콘텐츠 JSON(apps/mobile/src/content)을 읽는다. 한 벌만 관리하기 위해서다."""
from __future__ import annotations

import json
from datetime import date
from functools import lru_cache
from typing import Any

from ..core.config import get_settings


@lru_cache
def load_week(week: int) -> dict[str, Any]:
    path = get_settings().content_dir / "weeks" / f"week{week}.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache
def app_config() -> dict[str, Any]:
    return json.loads((get_settings().content_dir / "app-config.json").read_text(encoding="utf-8"))


def all_routines(week: dict[str, Any]) -> list[dict[str, Any]]:
    return [*week["routines"], *week["weekendExtras"]]


def routine_by_key(week: dict[str, Any], key: str) -> dict[str, Any] | None:
    return next((r for r in all_routines(week) if r["key"] == key), None)


def routines_for_date(week: dict[str, Any], day: date, faith_enabled: bool) -> list[dict[str, Any]]:
    weekend = day.weekday() >= 5
    extras = week["weekendExtras"] if faith_enabled and weekend else []
    return sorted([*week["routines"], *extras], key=lambda r: r["order"])


def lesson_key(run: int, day: int, routine: str) -> str:
    return f"r{run}-d{day}-{routine}"
