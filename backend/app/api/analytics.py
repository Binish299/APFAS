from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.infrastructure.db_session import get_db
from backend.app.api.dependencies import get_current_user
from backend.app.services.session_service import SessionService
from backend.app.services.report_service import PerformanceReportService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

report_svc = PerformanceReportService()

@router.get(
    "/history",
    response_model=List[Dict[str, Any]],
    summary="Get paginated session history",
    description="Returns a chronological list of practice sessions with optional transcript search and pagination.",
)
def get_session_history(
    query: Optional[str] = Query(None, description="Search target or recognized transcripts"),
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Max records per page"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve chronological session logs for the dashboard, filtered by keyword search with pagination."""
    session_svc = SessionService(db)
    try:
        return session_svc.get_user_history(user_id=current_user["user_id"], query=query, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session history: {str(e)}"
        )

@router.get(
    "/history/count",
    summary="Count total sessions",
    description="Returns the total number of practice sessions for pagination calculation, with optional transcript search filter.",
)
def get_session_history_count(
    query: Optional[str] = Query(None, description="Search target or recognized transcripts"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Return total count of sessions for pagination calculation."""
    session_svc = SessionService(db)
    try:
        total = session_svc.get_user_history_count(user_id=current_user["user_id"], query=query)
        return {"total": total}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to count sessions: {str(e)}"
        )

@router.get(
    "/summary",
    summary="Get progress summary dashboard",
    description="Aggregates all practice sessions into a dashboard summary with average scores, progress trends, and most frequent mistakes.",
)
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Compile aggregated progress trends, streak stats, and frequent mistakes."""
    session_svc = SessionService(db)
    try:
        history = session_svc.get_user_history(user_id=current_user["user_id"])
        summary = report_svc.compile_analytics_summary(history)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile dashboard analytics: {str(e)}"
        )

@router.get(
    "/download-report",
    summary="Download markdown progress report",
    description="Generates a printable markdown report summarizing all sessions, trends, and accent insights for the authenticated user.",
)
def download_progress_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate and return a beautifully structured, printable markdown weekly training report."""
    session_svc = SessionService(db)
    try:
        user_id = current_user["user_id"]
        username = current_user["username"]
        history = session_svc.get_user_history(user_id=user_id)
        summary = report_svc.compile_analytics_summary(history)
        report_md = report_svc.generate_markdown_report_file(user_name=username, summary=summary)

        return {
            "username": username,
            "report_content": report_md
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile printable report: {str(e)}"
        )
