import os
from typing import List, Dict, Any
from datetime import datetime, timedelta

class PerformanceReportService:
    def compile_analytics_summary(self, session_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Examine session history to extract aggregate strengths, weaknesses, and progress metrics."""
        if not session_history:
            return {
                "total_sessions": 0,
                "average_score": 0.0,
                "average_fluency": 0.0,
                "average_pronunciation": 0.0,
                "most_frequent_mistakes": [],
                "progress_trends": [],
                "current_streak": 0
            }

        total_sessions = len(session_history)
        sum_overall = 0.0
        sum_fluency = 0.0
        sum_pron = 0.0
        
        # Track counts of accent issue matches
        mistake_counts = {}
        
        # Sort history by date to find trends
        sorted_history = sorted(session_history, key=lambda x: x["created_at"])
        progress_trends = []

        for session in sorted_history:
            metrics = session["metrics"]
            sum_overall += metrics["overall_score"]
            sum_fluency += metrics["fluency"]
            sum_pron += metrics["pronunciation"]

            # Count mistake frequencies
            for fb in session.get("feedback", []):
                ptype = fb.get("pattern_type", "other")
                mistake_counts[ptype] = mistake_counts.get(ptype, 0) + 1

            # Simple trend projection: date & overall score
            progress_trends.append({
                "date": session["created_at"][:10], # YYYY-MM-DD
                "score": metrics["overall_score"]
            })

        # Map mistake frequencies to friendly descriptors
        pattern_mapping = {
            "v_w_substitution": "V / W Sound Substitution",
            "s_sh_merging": "S / SH Conflation (sheep -> seep)",
            "th_dental": "TH pronounced as stopped T/D",
            "z_j_substitution": "Z / J Buzzing sound substitution",
            "f_ph_substitution": "F pronounced as aspirated PH",
            "vowel_epenthesis": "Vowel insertion before 'S' clusters (e.g. istation)",
            "word_final_reduction": "Reduced word final stopped consonants",
            "stress_timing_flat": "Syllable-timed rhythm / flat tone speech"
        }

        frequent_mistakes = []
        for ptype, count in sorted(mistake_counts.items(), key=lambda item: item[1], reverse=True):
            frequent_mistakes.append({
                "mistake_type": pattern_mapping.get(ptype, ptype),
                "frequency": count
            })

        current_streak = self._calculate_streak(sorted_history)

        return {
            "total_sessions": total_sessions,
            "average_score": round(sum_overall / total_sessions, 1),
            "average_fluency": round(sum_fluency / total_sessions, 1),
            "average_pronunciation": round(sum_pron / total_sessions, 1),
            "most_frequent_mistakes": frequent_mistakes[:4], # Top 4 weaknesses
            "progress_trends": progress_trends,
            "current_streak": current_streak
        }

    def _calculate_streak(self, sorted_history: List[Dict[str, Any]]) -> int:
        unique_dates = sorted(
            {datetime.strptime(s["created_at"][:10], "%Y-%m-%d").date() for s in sorted_history},
            reverse=True
        )
        if not unique_dates:
            return 0

        today = datetime.utcnow().date()
        # Allow streak to start from today or yesterday
        if unique_dates[0] != today and unique_dates[0] != today - timedelta(days=1):
            return 0

        streak = 1
        for i in range(1, len(unique_dates)):
            if (unique_dates[i - 1] - unique_dates[i]).days == 1:
                streak += 1
            else:
                break
        return streak

    def generate_markdown_report_file(self, user_name: str, summary: Dict[str, Any]) -> str:
        """Construct a beautiful, printable Markdown summary report saved locally."""
        report_content = f"""# Weekly Speech Training Progress Report
**Student Name:** {user_name}  
**Date Generated:** {datetime.now().strftime("%Y-%m-%d")}  
**System Version:** Local speech coach v1.0.0 (Offline)  

---

## 1. Executive Performance Summary
* **Total Practice Sessions conducted:** {summary['total_sessions']}
* **Overall Communication Skill Index:** {summary['average_score']}/100
* **Phonetic Pronunciation Accuracy:** {summary['average_pronunciation']}/100
* **Speech Flow & Fluency Rating:** {summary['average_fluency']}/100

## 2. Identified Weak Accent Areas & Drill Targets
Here are the top phonetic patterns influenced by the Nepali accent that were detected in your sessions. Consistent practice on these areas will rapidly improve native understanding:

"""
        if not summary['most_frequent_mistakes']:
            report_content += "*No accent difficulties detected yet! Great job speaking clearly.*\n"
        else:
            for idx, mistake in enumerate(summary['most_frequent_mistakes']):
                report_content += f"{idx+1}. **{mistake['mistake_type']}**: Detected {mistake['frequency']} times. *(Action: practice focused consonant flow exercises)*\n"

        report_content += """
## 3. Recommended Spoken English Drills
* **For V/W substitution:** Place your upper teeth tightly on your lower lip and blow air to start the "V" vibration before speaking words like "valley" or "very".
* **For S/SH conflation:** Practice saying "she sells seashells by the seashore". Focus on shifting the tongue slightly backwards when pronouncing "she" and "shells".
* **For 'TH' stopping:** Stick the tip of your tongue slightly between your front teeth. Blow air continuously while voicing "this", "these", "brother".

---
*End of Report. Keep up the consistent voice-speaking exercises!*
"""
        return report_content
