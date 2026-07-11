import os
import shutil
import uuid
import asyncio
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.infrastructure.db_session import get_db
from backend.app.api.dependencies import get_current_user
from backend.app.speech_processing.whisper_transcriber import LocalWhisperTranscriber
from backend.app.speech_processing.acoustic_features import LibrosaAcousticAnalyzer
from backend.app.speech_processing.accent_diagnostics import NepaliAccentDiagnostic
from backend.app.services.feedback_service import FeedbackService
from backend.app.services.session_service import SessionService
from backend.app.domain.models import EvaluationResponse, MetricBreakdown, FeedbackItem

router = APIRouter(prefix="/speech", tags=["Speech Evaluation"])

# Initialize processors
transcriber = LocalWhisperTranscriber(model_size="small")
acoustic_analyzer = LibrosaAcousticAnalyzer()
accent_diagnostic = NepaliAccentDiagnostic()
feedback_svc = FeedbackService()

# Setup Local Audio directory in the scratch directory
AUDIO_STORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "audio_store")
os.makedirs(AUDIO_STORE_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/webm", "audio/mp3", "audio/mpeg",
    "audio/ogg", "audio/x-m4a", "audio/mp4", "audio/x-aiff", "audio/flac"
}
ALLOWED_EXTENSIONS = {".wav", ".webm", ".mp3", ".ogg", ".m4a", ".mp4", ".aiff", ".flac"}

# Magic bytes for common audio formats
AUDIO_MAGIC_BYTES = {
    b"RIFF": "wav/avi",
    b"OggS": "ogg/opus",
    b"\xff\xfb": "mp3",
    b"\xff\xf3": "mp3",
    b"\xff\xf2": "mp3",
    b"\x49\x44\x33": "mp3 (ID3)",
    b"fLaC": "flac",
    b"\x1a\x45\xdf\xa3": "webm/ebml",
}

def validate_audio_file(audio_file: UploadFile):
    ext = os.path.splitext(audio_file.filename or "")[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if audio_file.content_type and audio_file.content_type not in ALLOWED_AUDIO_TYPES:
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported media type '{audio_file.content_type}'. Please upload an audio file."
            )

    # Read first bytes for magic-byte validation
    head = audio_file.file.read(4)
    audio_file.file.seek(0)

    if not any(head.startswith(magic) for magic in AUDIO_MAGIC_BYTES):
        if ext:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' does not match actual audio content. Upload rejected."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File does not contain recognized audio headers. Please upload a valid audio file."
            )

    # Check Content-Length header if present
    content_length = audio_file.size
    if content_length is not None and content_length > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large ({content_length} bytes). Maximum allowed: {MAX_FILE_SIZE_BYTES} bytes (25 MB)."
        )

def calculate_errors(target: str, recognized: str):
    """Calculate Word Error Rate and Character Error Rate using jiwer."""
    import jiwer
    
    t_clean = jiwer.transforms.Compose([
        jiwer.transforms.ToLowerCase(),
        jiwer.transforms.RemoveMultipleSpaces(),
        jiwer.transforms.RemovePunctuation(),
        jiwer.transforms.Strip(),
    ])(target)
    
    r_clean = jiwer.transforms.Compose([
        jiwer.transforms.ToLowerCase(),
        jiwer.transforms.RemoveMultipleSpaces(),
        jiwer.transforms.RemovePunctuation(),
        jiwer.transforms.Strip(),
    ])(recognized)
    
    wer = jiwer.wer(t_clean, r_clean)
    cer = jiwer.cer(t_clean, r_clean)
    return min(wer, 1.0), min(cer, 1.0)

@router.post(
    "/evaluate-pronunciation",
    response_model=EvaluationResponse,
    summary="Evaluate read-aloud pronunciation",
    description="Transcribes an audio file of a user reading a target sentence, extracts acoustic features, detects Nepali accent patterns, and returns scored metrics with corrective feedback.",
)
async def evaluate_pronunciation(
    audio_file: UploadFile = File(...),
    target_text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 0. Validate audio format
    validate_audio_file(audio_file)

    # 1. Save uploaded file to local store
    file_id = str(uuid.uuid4())
    safe_name = "".join(c for c in audio_file.filename or "recording" if c.isalnum() or c in "._-")
    audio_path = os.path.join(AUDIO_STORE_DIR, f"{file_id}_{safe_name}")
    
    try:
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        file_size = os.path.getsize(audio_path)
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty."
            )
        if file_size > MAX_FILE_SIZE_BYTES:
            os.remove(audio_path)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file too large ({file_size} bytes). Maximum allowed: {MAX_FILE_SIZE_BYTES} bytes (25 MB)."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded audio: {str(e)}"
        )

    try:
        # 2. Run Whisper local transcription off the event loop
        transcription_result = await asyncio.wait_for(
            asyncio.to_thread(transcriber.transcribe, audio_path, target_text),
            timeout=300
        )
        recognized_text = transcription_result["text"]

        # 3. Extract Acoustic librosa parameters off the event loop
        audio_features = await asyncio.wait_for(
            asyncio.to_thread(acoustic_analyzer.extract_features, audio_path),
            timeout=120
        )

        # 4. Detect L1 interference patterns off the event loop
        accent_issues = await asyncio.wait_for(
            asyncio.to_thread(accent_diagnostic.analyze_accent_patterns, audio_features, recognized_text, target_text),
            timeout=60
        )

        # 5. Compute Error Rates (WER/CER)
        wer, cer = calculate_errors(target_text, recognized_text)

        # 6. Aggregate proficiency weights and overall score
        word_count = len(recognized_text.split())
        metrics_breakdown = feedback_svc.aggregate_metrics(
            word_error_rate=wer,
            character_error_rate=cer,
            accent_issues=accent_issues,
            audio_features=audio_features,
            word_count=word_count,
            target_text=target_text,
            recognized_text=recognized_text
        )

        # 7. Persist recording entry into database
        session_svc = SessionService(db)
        
        feedbacks_payload = []
        for issue in accent_issues:
            feedbacks_payload.append({
                "pattern_type": issue.pattern_type,
                "feedback_message": issue.feedback_message,
                "detected_phoneme_segment": issue.detected_segment,
                "recommended_drill_url": f"/drills/{issue.pattern_type}"
            })

        session = session_svc.create_evaluation_session(
            user_id=current_user["user_id"],
            session_type="pronunciation",
            audio_path=audio_path,
            target_text=target_text,
            recognized_text=recognized_text,
            wer=wer,
            cer=cer,
            duration_sec=int(audio_features.duration),
            metrics_breakdown=metrics_breakdown.__dict__,
            feedbacks_list=feedbacks_payload
        )

        # Return standardized payload matching API specifications
        return EvaluationResponse(
            recording_id=session.id,
            recognized_text=recognized_text,
            word_error_rate=wer,
            character_error_rate=cer,
            metrics=metrics_breakdown,
            feedback=[
                FeedbackItem(
                    pattern_type=x["pattern_type"],
                    feedback_message=x["feedback_message"],
                    detected_phoneme_segment=x["detected_phoneme_segment"],
                    recommended_drill_url=x["recommended_drill_url"]
                )
                for x in feedbacks_payload
            ]
        )

    except Exception as e:
        # Clean up files on hard failures
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech analysis pipeline failed: {str(e)}"
        )

@router.post(
    "/evaluate-topic",
    response_model=EvaluationResponse,
    summary="Evaluate spontaneous topic speech",
    description="Transcribes spontaneous speech on a given topic, analyzes acoustic features, assesses accent patterns, and returns scored metrics with fluency feedback.",
)
async def evaluate_topic(
    audio_file: UploadFile = File(...),
    topic_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    validate_audio_file(audio_file)

    file_id = str(uuid.uuid4())
    safe_name = "".join(c for c in audio_file.filename or "recording" if c.isalnum() or c in "._-")
    audio_path = os.path.join(AUDIO_STORE_DIR, f"{file_id}_{safe_name}")
    
    try:
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        file_size = os.path.getsize(audio_path)
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty."
            )
        if file_size > MAX_FILE_SIZE_BYTES:
            os.remove(audio_path)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file too large ({file_size} bytes). Maximum allowed: {MAX_FILE_SIZE_BYTES} bytes (25 MB)."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save topic audio: {str(e)}"
        )

    try:
        # 1. Transcribe spontaneous speech off the event loop
        transcription_result = await asyncio.wait_for(
            asyncio.to_thread(transcriber.transcribe, audio_path, None),
            timeout=300
        )
        recognized_text = transcription_result["text"]

        # 2. Extract Acoustic values off the event loop
        audio_features = await asyncio.wait_for(
            asyncio.to_thread(acoustic_analyzer.extract_features, audio_path),
            timeout=120
        )

        # 3. Assess generic accent rules off the event loop
        accent_issues = await asyncio.wait_for(
            asyncio.to_thread(accent_diagnostic.analyze_accent_patterns, audio_features, recognized_text, None),
            timeout=60
        )

        # 4. Generate scores
        word_count = len(recognized_text.split())
        metrics_breakdown = feedback_svc.aggregate_metrics(
            word_error_rate=0.0,
            character_error_rate=0.0,
            accent_issues=accent_issues,
            audio_features=audio_features,
            word_count=word_count,
            target_text=None,
            recognized_text=recognized_text
        )

        # 5. Persist to DB
        session_svc = SessionService(db)
        
        feedbacks_payload = []
        for issue in accent_issues:
            feedbacks_payload.append({
                "pattern_type": issue.pattern_type,
                "feedback_message": issue.feedback_message,
                "detected_phoneme_segment": issue.detected_segment,
                "recommended_drill_url": f"/drills/{issue.pattern_type}"
            })

        session = session_svc.create_evaluation_session(
            user_id=current_user["user_id"],
            session_type="topic_based",
            audio_path=audio_path,
            target_text=f"Topic Prompt ID: {topic_id}",
            recognized_text=recognized_text,
            wer=0.0,
            cer=0.0,
            duration_sec=int(audio_features.duration),
            metrics_breakdown=metrics_breakdown.__dict__,
            feedbacks_list=feedbacks_payload
        )

        return EvaluationResponse(
            recording_id=session.id,
            recognized_text=recognized_text,
            word_error_rate=0.0,
            character_error_rate=0.0,
            metrics=metrics_breakdown,
            feedback=[
                FeedbackItem(
                    pattern_type=x["pattern_type"],
                    feedback_message=x["feedback_message"],
                    detected_phoneme_segment=x["detected_phoneme_segment"],
                    recommended_drill_url=x["recommended_drill_url"]
                )
                for x in feedbacks_payload
            ]
        )
    except Exception as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Topic analysis pipeline failed: {str(e)}"
        )
