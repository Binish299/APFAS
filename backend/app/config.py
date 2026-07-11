import os

class Settings:
    PROJECT_NAME: str = "Nepali-English Speech Trainer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Absolute paths setup
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_PATH: str = os.path.join(BASE_DIR, "database.db")
    AUDIO_STORE_PATH: str = os.path.join(BASE_DIR, "audio_store")

    # CORS — origins allowed to call the API (comma-separated in env to override)
    CORS_ORIGINS: list = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080"
        ).split(",") if o.strip()
    ]

settings = Settings()
