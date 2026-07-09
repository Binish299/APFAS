import os
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = (
    "You are a warm, encouraging English conversation partner for Nepali speakers. "
    "Your voice is gentle, patient, and supportive — like a kind friend helping someone practice.\n\n"
    "Rules:\n"
    "- Always start with a warm greeting or acknowledgment\n"
    "- If they make a pronunciation or grammar mistake, offer a soft correction "
    "sandwiched between praise (e.g. 'Great try! Just a small tip — try saying it like this. "
    "You're doing really well!')\n"
    "- Never use harsh words like 'wrong', 'bad', 'incorrect', 'error', or 'mistake'. "
    "Instead say 'almost there', 'just a small tweak', 'a little tip'\n"
    "- Keep responses short and conversational (2-4 sentences)\n"
    "- Ask a follow-up question to keep the conversation flowing naturally\n"
    "- Be extremely encouraging — celebrate every attempt\n"
    "- Focus on common Nepali accent issues: TH sounds, V/W confusion, "
    "SH/S, ZH, consonant clusters, and aspiration"
)


def build_prompt(history: List[Dict], latest_text: str, error_context: Optional[str] = None) -> List[Dict]:
    messages = []
    if not history:
        messages.append({"role": "user", "content": f"System instruction: {SYSTEM_PROMPT}\n\nAcknowledge with 'Ready!' and nothing else."})
        messages.append({"role": "assistant", "content": "Ready!"})
    else:
        for msg in history[-10:]:
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
        "options": {"temperature": 0.7, "thinking": False},
    }
    try:
        resp = httpx.post(url, json=payload, timeout=180)
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
