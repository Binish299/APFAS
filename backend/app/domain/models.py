from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# ========================================================
# SQLAlchemy ORM Models (Database Layer)
# ========================================================

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("PracticeSessionDB", back_populates="user", cascade="all, delete-orphan")

class PracticeSessionDB(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_type = Column(String(50), nullable=False) # "pronunciation" or "topic"
    created_at = Column(DateTime, default=datetime.utcnow)
    overall_score = Column(Float, default=0.0)

    user = relationship("UserDB", back_populates="sessions")
    recordings = relationship("RecordingDB", back_populates="session", cascade="all, delete-orphan")

class RecordingDB(Base):
    __tablename__ = "recordings"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False)
    audio_file_path = Column(String(500), nullable=False)
    target_text = Column(Text, nullable=True)
    recognized_text = Column(Text, nullable=False)
    word_error_rate = Column(Float, default=0.0)
    character_error_rate = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)

    session = relationship("PracticeSessionDB", back_populates="recordings")
    score = relationship("ScoreDB", uselist=False, back_populates="recording", cascade="all, delete-orphan")
    feedbacks = relationship("AccentFeedbackDB", back_populates="recording", cascade="all, delete-orphan")

class ScoreDB(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    recording_id = Column(Integer, ForeignKey("recordings.id", ondelete="CASCADE"), unique=True, nullable=False)
    pronunciation_score = Column(Float, nullable=False)
    fluency_score = Column(Float, nullable=False)
    speaking_rate_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    vocabulary_richness_score = Column(Float, nullable=False)
    clarity_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)

    recording = relationship("RecordingDB", back_populates="score")

class AccentFeedbackDB(Base):
    __tablename__ = "accent_feedback"

    id = Column(Integer, primary_key=True, index=True)
    recording_id = Column(Integer, ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False)
    pattern_type = Column(String(100), nullable=False)
    feedback_message = Column(Text, nullable=False)
    detected_phoneme_segment = Column(String(50), nullable=True)
    recommended_drill_url = Column(String(255), nullable=True)

    recording = relationship("RecordingDB", back_populates="feedbacks")


# ========================================================
# Pydantic Schemas (API Validation & Serialization)
# ========================================================

class UserRegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)

class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserResponseSchema(BaseModel):
    id: int
    username: str
    email: str
    class Config:
        orm_mode = True

class TokenSchema(BaseModel):
    id: int
    token: str
    username: str

class MetricBreakdown(BaseModel):
    pronunciation: float
    fluency: float
    speaking_rate: float
    confidence: float
    vocabulary_richness: float
    clarity: float
    overall_score: float

class FeedbackItem(BaseModel):
    pattern_type: str
    feedback_message: str
    detected_phoneme_segment: Optional[str] = None
    recommended_drill_url: Optional[str] = None

class EvaluationResponse(BaseModel):
    recording_id: int
    recognized_text: str
    word_error_rate: float
    character_error_rate: float
    metrics: MetricBreakdown
    feedback: List[FeedbackItem]
