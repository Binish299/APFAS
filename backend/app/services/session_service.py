from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.domain.models import PracticeSessionDB, RecordingDB, ScoreDB, AccentFeedbackDB
from backend.app.infrastructure.repositories import SessionRepository, RecordingRepository

class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.session_repo = SessionRepository(db)
        self.rec_repo = RecordingRepository(db)

    def create_evaluation_session(self, user_id: int, session_type: str, audio_path: str,
                                  target_text: Optional[str], recognized_text: str,
                                  wer: float, cer: float, duration_sec: int,
                                  metrics_breakdown: Dict[str, float], 
                                  feedbacks_list: List[Dict[str, Any]]) -> PracticeSessionDB:
        """Create and populate a complete recording practice evaluation inside SQL DB."""
        # 1. Create practice session
        session = self.session_repo.create_session(user_id=user_id, session_type=session_type)
        
        # 2. Map ORM elements
        rec_db = RecordingDB(
            session_id=session.id,
            audio_file_path=audio_path,
            target_text=target_text,
            recognized_text=recognized_text,
            word_error_rate=wer,
            character_error_rate=cer,
            duration_seconds=duration_sec
        )

        score_db = ScoreDB(
            pronunciation_score=metrics_breakdown["pronunciation"],
            fluency_score=metrics_breakdown["fluency"],
            speaking_rate_score=metrics_breakdown["speaking_rate"],
            confidence_score=metrics_breakdown["confidence"],
            vocabulary_richness_score=metrics_breakdown["vocabulary_richness"],
            clarity_score=metrics_breakdown["clarity"],
            final_score=metrics_breakdown["overall_score"]
        )

        feedback_dbs = []
        for fb in feedbacks_list:
            feedback_dbs.append(AccentFeedbackDB(
                pattern_type=fb["pattern_type"],
                feedback_message=fb["feedback_message"],
                detected_phoneme_segment=fb.get("detected_phoneme_segment"),
                recommended_drill_url=fb.get("recommended_drill_url")
            ))

        # Save to database
        self.rec_repo.create_recording(recording=rec_db, score=score_db, feedbacks=feedback_dbs)

        # Update overall session score to match recording final score
        self.session_repo.update_overall_score(session.id, score_db.final_score)
        
        return session

    def get_user_history(self, user_id: int, query: Optional[str] = None,
                         skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch chronological list of session logs with keyword filters and pagination."""
        sessions = self.session_repo.get_sessions_by_user(user_id, query, skip=skip, limit=limit)
        history_list = []

        for s in sessions:
            for rec in s.recordings:
                record_data = {
                    "session_id": s.id,
                    "session_type": s.session_type,
                    "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "audio_file_path": rec.audio_file_path,
                    "target_text": rec.target_text,
                    "recognized_text": rec.recognized_text,
                    "word_error_rate": round(rec.word_error_rate, 2),
                    "character_error_rate": round(rec.character_error_rate, 2),
                    "duration_seconds": rec.duration_seconds,
                    "metrics": {
                        "pronunciation": rec.score.pronunciation_score,
                        "fluency": rec.score.fluency_score,
                        "speaking_rate": rec.score.speaking_rate_score,
                        "confidence": rec.score.confidence_score,
                        "vocabulary_richness": rec.score.vocabulary_richness_score,
                        "clarity": rec.score.clarity_score,
                        "overall_score": rec.score.final_score
                    },
                    "feedback": [
                        {
                            "pattern_type": fb.pattern_type,
                            "feedback_message": fb.feedback_message,
                            "detected_phoneme_segment": fb.detected_phoneme_segment
                        }
                        for fb in rec.feedbacks
                    ]
                }
                history_list.append(record_data)

        return history_list

    def get_user_history_count(self, user_id: int, query: Optional[str] = None) -> int:
        """Return total session count for pagination calculation."""
        return self.session_repo.count_sessions_by_user(user_id, query)
