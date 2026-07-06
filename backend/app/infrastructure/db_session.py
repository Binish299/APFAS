import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.domain.models import Base

# Setup database directory inside the scratch path
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "..", "..", "database.db")
DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} # SQLite constraint relief for multi-threading
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all tables in SQLite database if they do not exist."""
    # Ensure database folder exists
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency injection helper for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
