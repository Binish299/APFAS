from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class AudioFeatures:
    mfccs: List[List[float]]
    pitch_mean: float
    pitch_variance: float
    tempo: float
    energy: List[float]
    silence_duration: float
    duration: float

@dataclass
class AccentIssue:
    pattern_type: str
    feedback_message: str
    detected_segment: Optional[str] = None
    confidence: float = 1.0

class ISpeechTranscriber(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe speech in an audio file to text."""
        pass

class IAcousticAnalyzer(ABC):
    @abstractmethod
    def extract_features(self, audio_path: str) -> AudioFeatures:
        """Extract spectral and temporal audio characteristics."""
        pass

class IAccentDiagnostic(ABC):
    @abstractmethod
    def analyze_accent_patterns(self, audio_features: AudioFeatures, recognized_text: str, target_text: Optional[str] = None) -> List[AccentIssue]:
        """Detect pronunciation variations and L1 English speech interference patterns from Nepali native speakers."""
        pass
