"""앱과 같은 콘텐츠 JSON(apps/mobile/src/content)을 읽어 참조 테이블을 채운다.

콘텐츠 원본은 JSON 한 벌이다. 서버는 시작할 때 그것을 테이블로 옮기며, 여러 번 실행해도 결과가 같다(멱등).
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..models import Character, Routine, Week, WeekRoutine, WeekSentence, WeekWord, Word

CHARACTER_NAMES = {"chick": "병아리", "crocodile": "악어", "cat": "고양이", "rabbit": "토끼"}


def _read(name: str) -> dict[str, Any]:
    return json.loads((get_settings().content_dir / name).read_text(encoding="utf-8"))


@lru_cache
def app_config() -> dict[str, Any]:
    return _read("app-config.json")


def _upsert(db: Session, model, key: Any, values: dict[str, Any]):
    row = db.get(model, key)
    if row is None:
        row = model(**values)
        db.add(row)
    else:
        for field, value in values.items():
            setattr(row, field, value)
    return row


def seed_content(db: Session) -> None:
    for key in app_config()["characters"]:
        _upsert(db, Character, key, {"key": key, "name_ko": CHARACTER_NAMES.get(key, key)})

    for word in _read("words.json").values():
        _upsert(db, Word, word["id"], {"id": word["id"], "ko": word["ko"], "word_group": word["group"], "swatch": word.get("swatch")})
    db.flush()

    week_file = _read(f"weeks/week{app_config()['currentWeek']}.json")
    week_no = week_file["week"]
    activity = week_file["activity"]
    _upsert(db, Week, week_no, {
        "week_no": week_no, "theme": week_file["theme"], "headline": week_file["headline"], "subline": week_file["subline"],
        "activity_title": activity["title"], "playlist_id": week_file["playlistId"], "days": week_file["days"],
    })

    for item in [*week_file["routines"], *week_file["weekendExtras"]]:
        _upsert(db, Routine, item["key"], {
            "key": item["key"], "order_no": item["order"], "title": item["title"], "short_title": item["shortTitle"], "title_en": item["titleEn"],
            "target_minutes": item["targetMinutes"], "tone": item["tone"], "character_key": item["character"], "requires_faith": item.get("requiresFaith", False),
        })
        video = item["video"]
        _upsert(db, WeekRoutine, (week_no, item["key"]), {
            "week_no": week_no, "routine_key": item["key"], "guide": item["guide"], "sentence": item["sentence"],
            "video_id": video.get("videoId"), "video_playlist_id": video.get("playlistId"), "video_title": video["title"],
            "video_channel": video["channel"], "duration_sec": video.get("durationSec"),
        })

    for position, word_id in enumerate(activity["words"], start=1):
        _upsert(db, WeekWord, (week_no, word_id), {"week_no": week_no, "word_id": word_id, "position": position, "is_focus": word_id in activity["focusWords"]})

    existing = {s.text for s in db.query(WeekSentence).filter(WeekSentence.week_no == week_no)}
    for sentence in activity["sentences"]:
        if sentence["text"] not in existing:
            db.add(WeekSentence(week_no=week_no, text=sentence["text"], answer_word_id=sentence["answer"]))

    db.commit()
