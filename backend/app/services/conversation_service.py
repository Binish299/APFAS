import os
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = (
    "You are a friendly English conversation partner and pronunciation coach "
    "for native Nepali speakers. Your role:\n"
    "- Have natural, engaging conversations on everyday topics\n"
    "- When the user makes a pronunciation or grammar error, gently correct them "
    "mid-conversation like a friend would, not a teacher\n"
    "- Keep responses concise (2-4 sentences)\n"
    "- Occasionally ask follow-up questions to keep the conversation flowing\n"
    "- Praise progress and be encouraging\n"
    "- Focus on common Nepali accent issues: TH sounds, V/W confusion, "
    "SH/S, ZH, consonant clusters, and aspiration"
)


def build_prompt(history: List[Dict], latest_text: str, error_context: Optional[str] = None) -> List[Dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history[-10:]:  # last 10 turns
        messages.append(msg)
    user_msg = latest_text
    if error_context:
        user_msg += f"\n\n[Pronunciation notes: {error_context}]"
    messages.append({"role": "user", "content": user_msg})
    return messages


class OllamaError(Exception):
    pass


def send_to_ollama(messages: List[Dict]) -> str:
    import httpx
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.7},
    }
    try:
        resp = httpx.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]
    except httpx.ConnectError:
        raise OllamaError(
            f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. "
            "Make sure Ollama is running (ollama serve) and {OLLAMA_MODEL} is pulled."
        )
    except Exception as e:
        raise OllamaError(f"Ollama request failed: {e}")
