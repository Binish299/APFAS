import os

class Settings:
    PROJECT_NAME: str = "Nepali-English Speech Trainer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Absolute paths setup
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_PATH: str = os.path.join(BASE_DIR, "database.db")
    AUDIO_STORE_PATH: str = os.path.join(BASE_DIR, "audio_store")

settings = Settings()
