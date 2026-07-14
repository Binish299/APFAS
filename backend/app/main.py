import os
import time
import asyncio
import logging
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from backend.app.config import settings
from backend.app.infrastructure.db_session import init_db, SessionLocal
from backend.app.logging_config import setup_logging
from backend.app.api import auth, speech, topics, analytics, conversation

logger = logging.getLogger(__name__)

AUDIO_CLEANUP_INTERVAL = 86400
AUDIO_MAX_AGE_SECONDS = 7 * 86400

TIMEOUT_EXCEPTIONS = (asyncio.TimeoutError, TimeoutError)

def cleanup_old_audio_loop():
    while True:
        try:
            now = time.time()
            audio_dir = settings.AUDIO_STORE_PATH
            if os.path.isdir(audio_dir):
                removed = 0
                for fname in os.listdir(audio_dir):
                    fpath = os.path.join(audio_dir, fname)
                    if os.path.isfile(fpath) and now - os.path.getmtime(fpath) > AUDIO_MAX_AGE_SECONDS:
                        os.remove(fpath)
                        removed += 1
                if removed:
                    logger.info("Removed %d stale audio files.", removed)
        except Exception as e:
            logger.error("Error during audio cleanup: %s", e)
        time.sleep(AUDIO_CLEANUP_INTERVAL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting Nepali-English Speech Trainer backend...")
    logger.info("Initializing SQLite database schema...")
    init_db()
    logger.info("SQLite schema operational.")
    cleanup_thread = threading.Thread(target=cleanup_old_audio_loop, daemon=True)
    cleanup_thread.start()
    logger.info("Audio cleanup background task started (7-day retention).")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Offline-ready voice-based speech coach tailored for native Nepali speakers learning English pronunciation.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ─────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    logger.info(
        "%s %s → %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed * 1000,
    )
    return response

# ── Global exception handlers ──────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, TIMEOUT_EXCEPTIONS):
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timed out. Please try again."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

# ── Health check ───────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
    }

# ── API routers ────────────────────────────────────────────────────────

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(speech.router, prefix=settings.API_V1_STR)
app.include_router(topics.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(conversation.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "offline-ready"
    }
