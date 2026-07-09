import os
import logging
from typing import Dict, Any, Optional
from backend.app.domain.interfaces import ISpeechTranscriber

logger = logging.getLogger(__name__)

FFMPEG_CANDIDATE_PATHS = [
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages",
                 "Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe",
                 "ffmpeg-8.1.1-essentials_build", "bin"),
    "C:\\ffmpeg\\bin",
    "C:\\Program Files\\ffmpeg\\bin",
]

def _ensure_ffmpeg_on_path():
    """Find ffmpeg.exe and prepend its directory to PATH if not already present."""
    for candidate in FFMPEG_CANDIDATE_PATHS:
        exe = os.path.join(candidate, "ffmpeg.exe")
        if os.path.isfile(exe):
            if candidate not in os.environ.get("PATH", ""):
                os.environ["PATH"] = candidate + os.pathsep + os.environ.get("PATH", "")
                logger.info("Found ffmpeg at %s and added to PATH.", exe)
            return True
    return False

class TranscriptionError(Exception):
    pass

class LocalWhisperTranscriber(ISpeechTranscriber):
    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self.model = None
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return
        if not _ensure_ffmpeg_on_path():
            raise TranscriptionError(
                "ffmpeg not found on system. Whisper requires ffmpeg to decode audio. "
                "Install it from https://ffmpeg.org/download.html or run: winget install FFmpeg"
            )
        logger.info("Initializing local OpenAI Whisper model (%s)...", self.model_size)
        try:
            import whisper
            self.model = whisper.load_model(self.model_size, device="cpu")
            self._initialized = True
            logger.info("Local Whisper model initialized successfully.")
        except Exception as e:
            self._initialized = True
            raise TranscriptionError(
                f"Failed to initialize Whisper model '{self.model_size}': {e}. "
                "Install with: pip install openai-whisper"
            ) from e

    def transcribe(self, audio_path: str, target_text: Optional[str] = None) -> Dict[str, Any]:
        self._lazy_init()
        try:
            result = self.model.transcribe(audio_path, language="en", fp16=False)
            text = result.get("text", "").strip()
            if not text:
                raise TranscriptionError("Whisper returned empty transcription.")
            return {
                "text": text,
                "segments": result.get("segments", []),
                "language": "en"
            }
        except TranscriptionError:
            raise
        except Exception as e:
            raise TranscriptionError(f"Whisper transcription failed: {e}") from e
