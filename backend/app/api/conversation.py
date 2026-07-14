import os
import shutil
import uuid
import asyncio
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.api.dependencies import get_current_user
from backend.app.infrastructure.db_session import get_db
from backend.app.speech_processing.whisper_transcriber import LocalWhisperTranscriber, TranscriptionError
from backend.app.speech_processing.acoustic_features import LibrosaAcousticAnalyzer
from backend.app.speech_processing.accent_diagnostics import NepaliAccentDiagnostic
from backend.app.services.conversation_service import send_to_ollama, build_prompt, OllamaError

router = APIRouter(prefix="/conversation", tags=["Live Conversation"])

transcriber = LocalWhisperTranscriber(model_size="base")

AUDIO_STORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "audio_store")
os.makedirs(AUDIO_STORE_DIR, exist_ok=True)

ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/webm", "audio/mp3", "audio/mpeg",
    "audio/ogg", "audio/x-m4a", "audio/mp4", "audio/x-aiff", "audio/flac"
}
ALLOWED_EXTENSIONS = {".wav", ".webm", ".mp3", ".ogg", ".m4a", ".mp4", ".aiff", ".flac"}
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
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatResponse(BaseModel):
    user_text: str
    assistant_text: str


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
    head = audio_file.file.read(4)
    audio_file.file.seek(0)
    if not any(head.startswith(magic) for magic in AUDIO_MAGIC_BYTES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File does not contain recognized audio headers. Please upload a valid audio file."
        )
    content_length = audio_file.size
    if content_length is not None and content_length > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large ({content_length} bytes). Maximum allowed: {MAX_FILE_SIZE_BYTES} bytes (25 MB)."
        )


@router.post(
    "/send",
    response_model=ChatResponse,
    summary="Send a voice message in a live conversation",
    description="Transcribes the uploaded audio, sends it to the local LLM with conversation history, and returns both the transcription and the AI response.",
)
async def conversation_send(
    audio_file: UploadFile = File(...),
    history: str = Form("[]"),
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
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")
        if file_size > MAX_FILE_SIZE_BYTES:
            os.remove(audio_path)
            raise HTTPException(status_code=413, detail=f"Audio file too large ({file_size} bytes).")

        # Transcribe
        try:
            transcription_result = await asyncio.wait_for(
                asyncio.to_thread(transcriber.transcribe, audio_path, None),
                timeout=300
            )
            recognized_text = transcription_result["text"]
            if not recognized_text.strip():
                return ChatResponse(user_text="", assistant_text="I didn't catch that. Could you please speak again?")
        except TranscriptionError:
            return ChatResponse(user_text="", assistant_text="I didn't catch that. Could you please speak again?")

        # Parse history
        import json
        try:
            history_messages = json.loads(history)
        except (json.JSONDecodeError, TypeError):
            history_messages = []

        # Build prompt and call Ollama
        messages = build_prompt(history_messages, recognized_text)
        assistant_text = await asyncio.wait_for(
            asyncio.to_thread(send_to_ollama, messages),
            timeout=120
        )

        return ChatResponse(user_text=recognized_text, assistant_text=assistant_text)

    except OllamaError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversation pipeline failed: {str(e)}")
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)
