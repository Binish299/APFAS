from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.infrastructure.db_session import get_db
from backend.app.services.session_service import SessionService
from backend.app.services.report_service import PerformanceReportService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

report_svc = PerformanceReportService()

@router.get("/history", response_model=List[Dict[str, Any]])
def get_session_history(
    user_id: int,
    query: Optional[str] = Query(None, description="Search target or recognized transcripts"),
    db: Session = Depends(get_db)
):
    """Retrieve chronological session logs for the dashboard, filtered by keyword search."""
    session_svc = SessionService(db)
    try:
        return session_svc.get_user_history(user_id=user_id, query=query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session history: {str(e)}"
        )

@router.get("/summary")
def get_progress_summary(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Compile aggregated progress trends, streak stats, and frequent mistakes."""
    session_svc = SessionService(db)
    try:
        history = session_svc.get_user_history(user_id=user_id)
        summary = report_svc.compile_analytics_summary(history)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile dashboard analytics: {str(e)}"
        )

@router.get("/download-report")
def download_progress_report(
    user_id: int,
    username: str = "Learner",
    db: Session = Depends(get_db)
):
    """Generate and return a beautifully structured, printable markdown weekly training report."""
    session_svc = SessionService(db)
    try:
        history = session_svc.get_user_history(user_id=user_id)
        summary = report_svc.compile_analytics_summary(history)
        report_md = report_svc.generate_markdown_report_file(user_name=username, summary=summary)
        
        # Return plain text markdown report payload
        return {
            "username": username,
            "report_content": report_md
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile printable report: {str(e)}"
        )
