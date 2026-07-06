from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.infrastructure.db_session import init_db
from backend.app.api import auth, speech, topics, analytics

# Bootstrapping local SQLite database structures
print("[DB Initialization] Checking and bootstrapping SQLite database schema...")
init_db()
print("[DB Initialization] SQLite schema operational.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Offline-ready voice-based speech coach tailored for native Nepali speakers learning English pronunciation."
)

# CORS Policy configuration (allowing local React UI to make requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Open for dev ease in local setups
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mounting API namespaces
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(speech.router, prefix=settings.API_V1_STR)
app.include_router(topics.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "offline-ready"
    }
