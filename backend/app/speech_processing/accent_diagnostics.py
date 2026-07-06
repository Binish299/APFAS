import re
from typing import List, Optional
from backend.app.domain.interfaces import IAccentDiagnostic, AudioFeatures, AccentIssue

class NepaliAccentDiagnostic(IAccentDiagnostic):
    def analyze_accent_patterns(self, audio_features: AudioFeatures, recognized_text: str, target_text: Optional[str] = None) -> List[AccentIssue]:
        """Examine transcription characteristics to trace native Nepali L1 linguistic interference.
        
        Args:
            audio_features: Extracted Librosa temporal/spectral features.
            recognized_text: Transcription produced by the Whisper transcriber.
            target_text: Expected benchmark text, if any.
        """
        issues = []
        rec_clean = recognized_text.lower()
        
        # 1. Consonant substitution: V ↔ W
        # e.g., target word contains 'v' but recognized contains 'w' (or vice-versa)
        if target_text:
            tar_words = [w.strip(".,!?\"()").lower() for w in target_text.split()]
            rec_words = [w.strip(".,!?\"()").lower() for w in recognized_text.split()]
            
            # Map word-to-word changes
            for tw, rw in zip(tar_words, rec_words):
                # V/W Substitution check
                if "v" in tw and rw.replace("v", "w") == tw.replace("v", "w") and "w" in rw:
                    issues.append(AccentIssue(
                        pattern_type="v_w_substitution",
                        feedback_message=f"Possible substitution between V and W detected: You pronounced '{tw}' as '{rw}'. Keep your lower teeth touching your upper lip to make the English 'V' sound.",
                        detected_segment="v",
                        confidence=0.9
                    ))
                elif "w" in tw and rw.replace("w", "v") == tw.replace("w", "v") and "v" in rw:
                    issues.append(AccentIssue(
                        pattern_type="v_w_substitution",
                        feedback_message=f"Possible substitution between V and W detected: You pronounced '{tw}' as '{rw}'. The English 'W' sound requires rounding your lips without teeth contact.",
                        detected_segment="w",
                        confidence=0.85
                    ))

                # SH / S Substitution check (sheep -> seep, shell -> sell, cushion -> cusion)
                if "sh" in tw and "s" in rw and "sh" not in rw:
                    issues.append(AccentIssue(
                        pattern_type="s_sh_merging",
                        feedback_message=f"S/SH substitution detected: '{tw}' was pronounced as '{rw}'. To make the 'SH' (ʃ) sound, pull your tongue slightly back and round your lips.",
                        detected_segment="sh",
                        confidence=0.9
                    ))
                elif "s" in tw and "sh" in rw and "s" not in rw:
                    issues.append(AccentIssue(
                        pattern_type="s_sh_merging",
                        feedback_message=f"Possible substitution of 's' with 'sh' detected in '{tw}'. Keep your lips relaxed for the 'S' sound.",
                        detected_segment="s",
                        confidence=0.8

                    ))

                # TH ↔ T / D Substitution check (this -> dis, thin -> tin, brother -> broder)
                if tw.startswith("th") and not rw.startswith("th"):
                    if rw.startswith("d") or rw.startswith("t"):
                        issues.append(AccentIssue(
                            pattern_type="th_dental",
                            feedback_message=f"TH pronunciation may need improvement: You pronounced '{tw}' as '{rw}'. Place the tip of your tongue gently between your front teeth and blow air to create the 'TH' friction.",
                            detected_segment="th",
                            confidence=0.88
                        ))
                elif "th" in tw and "th" not in rw:
                    if "d" in rw or "t" in rw:
                        issues.append(AccentIssue(
                            pattern_type="th_dental",
                            feedback_message=f"The 'th' sound in '{tw}' was substituted with '{rw}'. Practice blowing continuous air through your teeth.",
                            detected_segment="th",
                            confidence=0.8

                        ))

                # Z ↔ J Substitution check (zip -> jip, zero -> jero)
                if "z" in tw and "j" in rw:
                    issues.append(AccentIssue(
                        pattern_type="z_j_substitution",
                        feedback_message=f"Z/J substitution detected: '{tw}' was pronounced as '{rw}'. The 'Z' sound is a buzzing vibration like a bee, whereas 'J' is a short, stopped sound.",
                        detected_segment="z",
                        confidence=0.95
                    ))

                # F ↔ PH Plosive Substitution check (fan -> phan)
                if tw.startswith("f") and rw.startswith("ph"):
                    issues.append(AccentIssue(
                        pattern_type="f_ph_substitution",
                        feedback_message=f"F sound replaced by aspirated PH plosive: You pronounced '{tw}' as '{rw}'. Let air escape continuously between your upper teeth and lower lip without blocking it completely.",
                        detected_segment="f",
                        confidence=0.9
                    ))

                # Vowel Epenthesis (station -> istation, school -> ischool)
                if (tw.startswith("st") or tw.startswith("sc") or tw.startswith("sp")) and (rw.startswith("is") or rw.startswith("es")):
                    issues.append(AccentIssue(
                        pattern_type="vowel_epenthesis",
                        feedback_message=f"Epenthetic vowel sound detected before consonant cluster in '{rw}'. Practice starting the word immediately with the 'S' hiss (e.g. 's-tation') rather than inserting an initial 'i' or 'e' vowel sound.",
                        detected_segment="s",
                        confidence=0.92
                    ))

                # Reduced final consonant endings (past -> pas, want -> wan)
                if len(tw) >= 3 and tw[-1] in ["t", "d", "k", "p"] and len(rw) < len(tw) and rw == tw[:-1]:
                    issues.append(AccentIssue(
                        pattern_type="word_final_reduction",
                        feedback_message=f"Final consonant sound may be reduced: '{tw}' was pronounced as '{rw}'. Be sure to clearly pronounce the final stopped consonant sound.",
                        detected_segment=tw[-1],
                        confidence=0.85
                    ))

        # 2. General string searches (if target text is not explicitly provided, e.g. spontaneous speaking topics)
        else:
            # Look for common spelling substitutions in the raw transcription string
            if "wery" in rec_clean or "walley" in rec_clean or "witamin" in rec_clean:
                issues.append(AccentIssue(
                    pattern_type="v_w_substitution",
                    feedback_message="Possible substitution detected between V and W sounds. Remember to touch your upper teeth to your lower lip for the 'V' sound.",
                    detected_segment="v",
                    confidence=0.8
                ))
            if "sepherd" in rec_clean or " sip " in rec_clean or " seet " in rec_clean:
                issues.append(AccentIssue(
                    pattern_type="s_sh_merging",
                    feedback_message="S and SH sound substitution: 'sh' sound in words like 'sheep' or 'shepherd' pronounced close to 's'.",
                    detected_segment="sh",
                    confidence=0.85
                ))
            if " dis " in rec_clean or " dat " in rec_clean or " fader " in rec_clean:
                issues.append(AccentIssue(
                    pattern_type="th_dental",
                    feedback_message="TH pronunciation may need improvement. Place the tip of your tongue between your teeth for words like 'the', 'this', and 'father'.",
                    detected_segment="th",
                    confidence=0.8
                ))
            if "istation" in rec_clean or "ischool" in rec_clean or "ispecial" in rec_clean:
                issues.append(AccentIssue(
                    pattern_type="vowel_epenthesis",
                    feedback_message="Vowel epenthesis detected: Insertion of 'i' or 'e' sounds before initial 's' clusters like 'station' or 'school'.",
                    detected_segment="s",
                    confidence=0.9
                ))

        # 3. Acoustic speaking pattern rules (tempo / duration checks)
        # Syllable timing vs. Stress timing (Equal tempo spikes / monotone pitch)
        if audio_features.pitch_variance < 15.0 and audio_features.duration > 3.0:
            issues.append(AccentIssue(
                pattern_type="stress_timing_flat",
                feedback_message="Stress placement and rhythm differ from standard English: Monotone pitch variation was detected. English is stress-timed, meaning you should vary your pitch and highlight key content words while speaking unstressed words quickly.",
                confidence=0.75
            ))

        return issues
