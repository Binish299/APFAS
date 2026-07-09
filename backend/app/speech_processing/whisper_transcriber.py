import os
import re
import logging
import warnings
import numpy as np
from typing import Dict, Any, Optional
from backend.app.domain.interfaces import ISpeechTranscriber

warnings.filterwarnings("ignore", message="PySoundFile failed.*")
warnings.filterwarnings("ignore", message="librosa.core.audio.__audioread_load.*")
warnings.filterwarnings("ignore", message="You are using `torch.load` with `weights_only=False`.*")
warnings.filterwarnings("ignore", message="Performing inference on CPU when CUDA is available")

logger = logging.getLogger(__name__)

FFMPEG_CANDIDATE_PATHS = [
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages",
                 "Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe",
                 "ffmpeg-8.1.1-essentials_build", "bin"),
    "C:\\ffmpeg\\bin",
    "C:\\Program Files\\ffmpeg\\bin",
]

VAD_ENERGY_THRESHOLD = 0.005
MAX_CHARS_PER_SECOND = 25

def _ensure_ffmpeg_on_path():
    """Find ffmpeg.exe and prepend its directory to PATH if not already present."""
    for candidate in FFMPEG_CANDIDATE_PATHS:
        exe = os.path.join(candidate, "ffmpeg.exe")
        if os.path.isfile(exe):
            if candidate not in os.environ.get("PATH", ""):
                os.environ["PATH"] = candidate + os.pathsep + os.environ.get("PATH", "")
                logger.info("Found ffmpeg at %s and added to PATH.", exe)
            return True
    # Fallback: check if ffmpeg is on the system PATH
    import subprocess
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def estimate_audio_energy(audio_path: str) -> float:
    try:
        import librosa
        y, _ = librosa.load(audio_path, sr=16000, mono=True)
        if len(y) == 0:
            return 0.0
        rms = np.sqrt(np.mean(y ** 2))
        return float(rms)
    except Exception:
        return 1.0


def is_likely_gibberish(text: str) -> bool:
    cleaned = re.sub(r'[a-zA-Z\s\.,!?\';:()-]', '', text)
    non_eng_ratio = len(cleaned) / max(len(text), 1)
    return non_eng_ratio > 0.3


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
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = whisper.load_model(self.model_size, device=device)
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

        energy = estimate_audio_energy(audio_path)
        if energy < VAD_ENERGY_THRESHOLD:
            raise TranscriptionError("Audio energy too low — no speech detected.")

        try:
            result = self.model.transcribe(
                audio_path,
                language="en",
                fp16=False,
                no_speech_threshold=0.45,
                logprob_threshold=-0.5,
                compression_ratio_threshold=2.0,
                condition_on_previous_text=False,
            )
            text = result.get("text", "").strip()
            if not text:
                raise TranscriptionError("Whisper returned empty transcription.")

            duration = result.get("segments", [{}])[-1].get("end", 0) if result.get("segments") else 0
            if duration > 0 and len(text) > duration * MAX_CHARS_PER_SECOND:
                raise TranscriptionError("Transcription too long for audio duration — likely hallucination.")

            if is_likely_gibberish(text):
                raise TranscriptionError("Transcription contains excessive non-English content.")

            return {
                "text": text,
                "segments": result.get("segments", []),
                "language": "en"
            }
        except TranscriptionError:
            raise
        except Exception as e:
            raise TranscriptionError(f"Whisper transcription failed: {e}") from e
