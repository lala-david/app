"""voice.manifest.json 을 읽어 edge-tts로 mp3를 만든다. 이미 있는 파일은 건너뛴다.

    python src/generate_voice.py           # 전체
    python src/generate_voice.py --force   # 덮어쓰기
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = json.loads((ROOT / "voice.manifest.json").read_text(encoding="utf-8"))
OUT = (ROOT / MANIFEST["outputRoot"]).resolve()
FORCE = "--force" in sys.argv
CONCURRENCY = 4


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def collect_jobs() -> list[dict]:
    jobs: list[dict] = []
    words = MANIFEST["sources"]["words"]
    for word in json.loads((ROOT / words["file"]).read_text(encoding="utf-8")).values():
        jobs.append({"id": f"{words['folder']}/{word['id']}", "voice": words["voice"], "text": word["id"]})

    sentences = MANIFEST["sources"]["sentences"]
    week = json.loads((ROOT / sentences["file"]).read_text(encoding="utf-8"))
    for routine in week["routines"]:
        for sentence in routine.get("sentences", []):
            jobs.append({"id": sentence["audio"], "voice": sentences["voice"], "text": sentence["text"]})

    jobs.extend(MANIFEST["lines"])
    return jobs


async def synthesize(job: dict, gate: asyncio.Semaphore) -> str:
    target = OUT / f"{job['id']}.mp3"
    if target.exists() and not FORCE:
        return f"skip {job['id']}"
    voice = MANIFEST["voices"][job["voice"]]
    target.parent.mkdir(parents=True, exist_ok=True)
    async with gate:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(job["text"], voice["voice"], rate=voice["rate"], pitch=voice["pitch"]).save(str(target))
                return f"done {job['id']}"
            except Exception as error:  # 네트워크 일시 오류 재시도
                if attempt == 2:
                    return f"FAIL {job['id']}: {error}"
                await asyncio.sleep(2 * (attempt + 1))
    return f"FAIL {job['id']}"


async def main() -> None:
    gate = asyncio.Semaphore(CONCURRENCY)
    jobs = collect_jobs()
    print(f"{len(jobs)} voice clips -> {OUT}")
    for line in await asyncio.gather(*(synthesize(job, gate) for job in jobs)):
        print(" ", line)


if __name__ == "__main__":
    asyncio.run(main())
