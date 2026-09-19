"""모델에서 DDL을 뽑아 docs 에 저장한다: python scripts_export_schema.py"""
from pathlib import Path

from sqlalchemy import create_mock_engine
from sqlalchemy.schema import CreateIndex, CreateTable

from app.core.db import Base
import app.models  # noqa: F401

OUT = Path(__file__).resolve().parents[3] / "docs" / "schema"


def export(dialect_url: str, name: str) -> None:
    lines: list[str] = []
    engine = create_mock_engine(dialect_url, lambda sql, *_, **__: lines.append(str(sql.compile(dialect=engine.dialect)).strip() + ";"))
    Base.metadata.create_all(engine, checkfirst=False)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text("\n\n".join(lines) + "\n", encoding="utf-8")
    print(name, len(lines), "statements")


export("sqlite://", "schema.sqlite.sql")
export("postgresql+psycopg2://", "schema.postgresql.sql")
