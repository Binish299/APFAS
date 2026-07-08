import re
from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.app.domain.models import UserDB, PracticeSessionDB, RecordingDB, ScoreDB, AccentFeedbackDB

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[UserDB]:
        return self.db.query(UserDB).filter(UserDB.id == user_id).first()

    def get_by_username(self, username: str) -> Optional[UserDB]:
        return self.db.query(UserDB).filter(UserDB.username == username).first()

    def get_by_email(self, email: str) -> Optional[UserDB]:
        return self.db.query(UserDB).filter(UserDB.email == email).first()

    def create(self, user: UserDB) -> UserDB:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: int, session_type: str) -> PracticeSessionDB:
        session = PracticeSessionDB(user_id=user_id, session_type=session_type)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def update_overall_score(self, session_id: int, score: float) -> Optional[PracticeSessionDB]:
        session = self.db.query(PracticeSessionDB).filter(PracticeSessionDB.id == session_id).first()
        if session:
            session.overall_score = score
            self.db.commit()
            self.db.refresh(session)
        return session

    @staticmethod
    def _escape_like(pattern: str) -> str:
        """Escape SQL LIKE wildcards from user input to prevent unexpected matches."""
        escaped = re.sub(r'[%_\\]', r'\\\g<0>', pattern)
        return f"%{escaped}%"

    def get_sessions_by_user(self, user_id: int, query: Optional[str] = None,
                              skip: int = 0, limit: int = 20) -> List[PracticeSessionDB]:
        db_query = self.db.query(PracticeSessionDB).filter(PracticeSessionDB.user_id == user_id)
        if query:
            pattern = self._escape_like(query)
            db_query = db_query.join(RecordingDB).filter(
                or_(
                    RecordingDB.target_text.like(pattern),
                    RecordingDB.recognized_text.like(pattern)
                )
            )
        return db_query.order_by(PracticeSessionDB.created_at.desc()).offset(skip).limit(limit).all()

    def count_sessions_by_user(self, user_id: int, query: Optional[str] = None) -> int:
        db_query = self.db.query(PracticeSessionDB).filter(PracticeSessionDB.user_id == user_id)
        if query:
            pattern = self._escape_like(query)
            db_query = db_query.join(RecordingDB).filter(
                or_(
                    RecordingDB.target_text.like(pattern),
                    RecordingDB.recognized_text.like(pattern)
                )
            )
        return db_query.count()

    def get_session_details(self, session_id: int) -> Optional[PracticeSessionDB]:
        return self.db.query(PracticeSessionDB).filter(PracticeSessionDB.id == session_id).first()


class RecordingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_recording(self, recording: RecordingDB, score: ScoreDB, feedbacks: List[AccentFeedbackDB]) -> RecordingDB:
        self.db.add(recording)
        self.db.commit()
        self.db.refresh(recording)

        score.recording_id = recording.id
        self.db.add(score)

        for feedback in feedbacks:
            feedback.recording_id = recording.id
            self.db.add(feedback)

        self.db.commit()
        self.db.refresh(recording)
        return recording
