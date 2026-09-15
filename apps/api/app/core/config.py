"""환경 변수 설정. 값은 .env 또는 실행 환경에서 읽는다."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTENT_DIR = API_ROOT.parent / "mobile" / "src" / "content"


def _list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", f"sqlite:///{API_ROOT / 'soundsfun.db'}"))
    jwt_secret: str = field(default_factory=lambda: os.getenv("JWT_SECRET", "dev-only-change-me"))
    access_minutes: int = field(default_factory=lambda: int(os.getenv("ACCESS_TOKEN_MINUTES", "15")))
    refresh_days: int = field(default_factory=lambda: int(os.getenv("REFRESH_TOKEN_DAYS", "30")))
    timezone: str = field(default_factory=lambda: os.getenv("APP_TIMEZONE", "Asia/Seoul"))
    content_dir: Path = field(default_factory=lambda: Path(os.getenv("CONTENT_DIR", str(DEFAULT_CONTENT_DIR))))
    cors_origins: list[str] = field(default_factory=lambda: _list(os.getenv("CORS_ORIGINS", "http://localhost:8081,https://lala-david.github.io")))
    vapid_public_key: str = field(default_factory=lambda: os.getenv("VAPID_PUBLIC_KEY", ""))
    vapid_private_key: str = field(default_factory=lambda: os.getenv("VAPID_PRIVATE_KEY", ""))
    vapid_subject: str = field(default_factory=lambda: os.getenv("VAPID_SUBJECT", "mailto:suny502@gmail.com"))
    run_scheduler: bool = field(default_factory=lambda: os.getenv("RUN_SCHEDULER", "1") == "1")


@lru_cache
def get_settings() -> Settings:
    return Settings()
