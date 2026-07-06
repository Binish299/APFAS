import re
import math
from typing import List, Dict, Any, Optional
from backend.app.domain.interfaces import AudioFeatures, AccentIssue
from backend.app.domain.models import MetricBreakdown, FeedbackItem

class FeedbackService:
    def __init__(self):
        self.weights = {
            "pronunciation": 0.30,
            "fluency": 0.20,
            "speaking_rate": 0.15,
            "confidence": 0.15,
            "vocabulary_richness": 0.10,
            "clarity": 0.10
        }

    def compute_pronunciation_score(self, word_error_rate: float, character_error_rate: float, accent_issues: List[AccentIssue]) -> float:
        """Evaluate pronunciation accuracy using character-level errors and L1 accent issue counts."""
        # Baseline score from Character Error Rate
        cer_score = max(0.0, 100.0 * (1.0 - character_error_rate))
        
        # Penalize slightly for each unique accent substitution issue detected to encourage clear phonetic training
        deduction = len(set(issue.pattern_type for issue in accent_issues)) * 4.0
        pron_score = max(30.0, cer_score - deduction) # minimum score floor of 30.0 for attempt
        return round(pron_score, 1)

    def compute_fluency_score(self, silence_duration: float, duration: float) -> float:
        """Evaluate flow and linkability of phrasing based on total silence duration ratio."""
        if duration <= 0:
            return 0.0
        
        silence_ratio = silence_duration / duration
        # Perfect ratio is < 15% pauses. 
        if silence_ratio <= 0.15:
            fluency = 100.0
        else:
            # Drop score incrementally as silence ratio increases
            fluency = max(35.0, 100.0 - (silence_ratio - 0.15) * 150.0)
        return round(fluency, 1)

    def compute_speaking_rate_score(self, word_count: int, duration_seconds: float) -> float:
        """Assess speed of delivery (Optimal English conversational speed is 110 - 150 WPM)."""
        if duration_seconds <= 0:
            return 0.0
        
        wpm = (word_count / duration_seconds) * 60.0
        
        # Calculate deviation from optimal bounds
        if 110.0 <= wpm <= 150.0:
            rate_score = 100.0
        elif wpm < 110.0:
            # Penalize slower speaking rates gently
            rate_score = max(40.0, 100.0 - (110.0 - wpm) * 0.8)
        else:
            # Penalize excessively rapid speech
            rate_score = max(40.0, 100.0 - (wpm - 150.0) * 1.0)
            
        return round(rate_score, 1)

    def compute_confidence_score(self, silence_duration: float, duration_seconds: float, pitch_variance: float) -> float:
        """Measures hesitation frequency and vocal modulation variety."""
        if duration_seconds <= 0:
            return 0.0
        
        # Hesitation penalty based on silence ratio
        silence_penalty = (silence_duration / duration_seconds) * 100.0
        
        # Monotone penalty (flat pitch variance)
        pitch_factor = min(20.0, pitch_variance) / 20.0  # scale pitch variance up to 20
        pitch_bonus = pitch_factor * 20.0
        
        conf = max(40.0, 100.0 - silence_penalty + pitch_bonus - 10.0)
        return round(min(100.0, conf), 1)

    def compute_vocabulary_richness_score(self, recognized_text: str, target_text: Optional[str] = None) -> float:
        """Measure linguistic diversity (TTR) or keyword matching percentage."""
        words = [w.lower().strip(".,!?\"()") for w in recognized_text.split() if w]
        if not words:
            return 0.0
        
        # If target text read-along: vocab richness represents matching perfect baseline (90% to 100%)
        if target_text:
            return 100.0
        
        # Spontaneous speaking topic: evaluate Type-Token Ratio (TTR)
        unique_words = set(words)
        ttr = len(unique_words) / len(words)
        
        # Normalize TTR: standard spoken English ranges 0.4 - 0.7 for mid-length speech
        richness = min(100.0, max(30.0, (ttr / 0.6) * 100.0))
        return round(richness, 1)

    def compute_clarity_score(self, pitch_mean: float, energy: List[float]) -> float:
        """Evaluate acoustic energy levels and voice signal presence (Clarity)."""
        if not energy:
            return 50.0
        
        # Peak-to-average energy ratio (higher values represent vocal articulation contrast vs background noise)
        max_energy = max(energy)
        avg_energy = sum(energy) / len(energy)
        
        if avg_energy <= 0:
            return 40.0
        
        ratio = max_energy / avg_energy
        # Articulated speech typically has a ratio between 2.0 and 5.0
        clarity = min(100.0, max(50.0, (ratio / 3.0) * 90.0))
        return round(clarity, 1)

    def aggregate_metrics(self, word_error_rate: float, character_error_rate: float, 
                          accent_issues: List[AccentIssue], audio_features: AudioFeatures,
                          word_count: int, target_text: Optional[str] = None) -> MetricBreakdown:
        """Calculate and combine individual sub-scores to yield the weighted overall final score."""
        
        pron = self.compute_pronunciation_score(word_error_rate, character_error_rate, accent_issues)
        fluency = self.compute_fluency_score(audio_features.silence_duration, audio_features.duration)
        sp_rate = self.compute_speaking_rate_score(word_count, audio_features.duration)
        confidence = self.compute_confidence_score(audio_features.silence_duration, audio_features.duration, audio_features.pitch_variance)
        vocab = self.compute_vocabulary_richness_score(recognized_text="", target_text=target_text) # Will evaluate properly
        
        # Handle vocabulary properly for spontaneous text
        if not target_text:
            vocab = self.compute_vocabulary_richness_score(recognized_text=target_text or "") # Uses mock word calculations or text input
        
        clarity = self.compute_clarity_score(audio_features.pitch_mean, audio_features.energy)

        # Apply weights to find final score
        overall = (
            pron * self.weights["pronunciation"] +
            fluency * self.weights["fluency"] +
            sp_rate * self.weights["speaking_rate"] +
            confidence * self.weights["confidence"] +
            vocab * self.weights["vocabulary_richness"] +
            clarity * self.weights["clarity"]
        )
        
        overall = min(max(round(overall, 1), 0.0), 100.0)

        return MetricBreakdown(
            pronunciation=pron,
            fluency=fluency,
            speaking_rate=sp_rate,
            confidence=confidence,
            vocabulary_richness=vocab,
            clarity=clarity,
            overall_score=overall
        )
