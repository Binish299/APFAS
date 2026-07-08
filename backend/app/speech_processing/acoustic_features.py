import os
import logging
import numpy as np
from typing import List
from backend.app.domain.interfaces import IAcousticAnalyzer, AudioFeatures

logger = logging.getLogger(__name__)

class FeatureExtractionError(Exception):
    pass

class LibrosaAcousticAnalyzer(IAcousticAnalyzer):
    def extract_features(self, audio_path: str) -> AudioFeatures:
        if not os.path.exists(audio_path):
            raise FeatureExtractionError(f"Audio file not found: {audio_path}")

        try:
            import librosa
            y, sr = librosa.load(audio_path, sr=16000, mono=True)
            duration = librosa.get_duration(y=y, sr=sr)

            if len(y) == 0:
                raise FeatureExtractionError("Loaded audio file is empty.")

            mfcc_matrix = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfccs = mfcc_matrix.tolist()

            try:
                f0 = librosa.yin(y, fmin=50, fmax=300, sr=sr)
                valid_f0 = f0[np.isfinite(f0) & (f0 > 0)]
                if len(valid_f0) > 0:
                    pitch_mean = float(np.mean(valid_f0))
                    pitch_variance = float(np.var(valid_f0))
                else:
                    pitch_mean = 120.0
                    pitch_variance = 5.0
            except Exception as e:
                raise FeatureExtractionError(f"Pitch extraction failed: {e}") from e

            rms = librosa.feature.rms(y=y)
            energy_list = rms[0].tolist()

            frame_duration = 512 / 16000
            threshold = 0.02
            silent_frames = 0
            silence_duration = 0.0

            for val in rms[0]:
                if val < threshold:
                    silent_frames += 1
                else:
                    if silent_frames * frame_duration >= 0.25:
                        silence_duration += (silent_frames * frame_duration)
                    silent_frames = 0

            if silent_frames * frame_duration >= 0.25:
                silence_duration += (silent_frames * frame_duration)

            try:
                onset_env = librosa.onset.onset_strength(y=y, sr=sr)
                tempo_arr = librosa.feature.tempo(onset_envelope=onset_env, sr=sr)
                tempo = float(tempo_arr[0])
            except Exception as e:
                raise FeatureExtractionError(f"Tempo extraction failed: {e}") from e

            return AudioFeatures(
                mfccs=mfccs,
                pitch_mean=pitch_mean,
                pitch_variance=pitch_variance,
                tempo=tempo,
                energy=energy_list,
                silence_duration=round(silence_duration, 2),
                duration=round(duration, 2)
            )

        except FeatureExtractionError:
            raise
        except ImportError as e:
            raise FeatureExtractionError(
                "librosa or soundfile not installed. Install with: pip install librosa soundfile"
            ) from e
        except Exception as e:
            raise FeatureExtractionError(f"Acoustic feature extraction failed: {e}") from e
