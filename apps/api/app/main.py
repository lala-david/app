from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.db import Base, SessionLocal, engine
from .routers import auth, children, misc, records
from .services.seed import seed_content

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_content(db)
    scheduler = None
    if get_settings().run_scheduler:
        from .services.push import start_scheduler

        scheduler = start_scheduler()
    yield
    if scheduler:
        scheduler.shutdown(wait=False)


def create_app() -> FastAPI:
    app = FastAPI(title="SoundsFun API", version="0.2.0", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["*"], allow_headers=["*"])
    for router in (auth.router, children.router, records.router, misc.router):
        app.include_router(router, prefix=API_PREFIX)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
