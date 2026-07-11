# Nepali-English Speech Trainer

An offline, voice-based speech coach tailored for Nepali speakers learning English. Features real-time pronunciation assessment, accent diagnostics, and a live conversation partner powered by local LLMs.

## Features

- **Pronunciation Drills** — Read target sentences aloud and get scored on accuracy, fluency, clarity, and speaking rate with corrective feedback
- **Impromptu Speaking Topics** — Practice spontaneous speech on random topics with scoring and accent diagnostics
- **Live Conversation** — Hands-free voice conversation with an AI partner using VAD-based recording, Whisper transcription, local LLM (Ollama), and Edge-TTS natural voice output
- **Session History** — Review past practice sessions with detailed metrics and feedback
- **Dashboard** — Track progress across metrics (pronunciation, fluency, clarity, prosody)
- **Accent Diagnostics** — Detects common Nepali accent patterns (TH sounds, V/W confusion, SH/S, consonant clusters, aspiration)

## Tech Stack

### Backend
- **FastAPI** — API framework
- **Whisper** (local, model: `small`) — Speech-to-text transcription
- **Librosa** — Acoustic feature extraction
- **SQLite** — Database
- **Ollama** (`gemma4:e2b-it-qat`) — Local LLM for conversation responses
- **Edge-TTS** — Natural voice synthesis (JennyNeural, AriaNeural, etc.)
- **ffmpeg** — Audio format conversion

### Frontend
- **React** — UI framework
- **Vite** — Dev server and build tool
- **Axios** — HTTP client
- **Web Audio API / MediaRecorder** — Audio recording with VAD (Voice Activity Detection)

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- [Ollama](https://ollama.com) with a compatible model (e.g., `gemma4:e2b-it-qat`)
- ffmpeg (in PATH)

### Setup

1. **Clone the repo**
   ```
   git clone <repo-url>
   cd nepal-english-speech-trainer
   ```

2. **Backend setup**
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment variables**
   ```
   copy .env.example .env
   ```
   Edit `.env` to configure your JWT secret, Ollama URL, and model.

4. **Frontend setup**
   ```
   cd frontend
   npm install
   ```

5. **Start Ollama**
   ```
   ollama serve
   ```
   Ensure your model is pulled: `ollama pull gemma4:e2b-it-qat`

6. **Start backend**
   ```
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

7. **Start frontend** (in a separate terminal)
   ```
   cd frontend
   npm run dev
   ```

8. Open http://localhost:3000 in your browser.

## API Endpoints

### Speech Evaluation
- `POST /api/speech/evaluate-pronunciation` — Evaluate read-aloud pronunciation
- `POST /api/speech/evaluate-topic` — Evaluate spontaneous topic speech

### Live Conversation
- `POST /api/conversation/send` — Send voice message, get AI response
- `GET /api/conversation/voices` — List available Edge-TTS voices
- `GET /api/conversation/tts` — Synthesize speech from text

### Analytics
- `GET /api/analytics/progress` — Get user progress data
- `GET /api/analytics/sessions` — List session history
- `GET /api/analytics/report` — Generate detailed report

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT token

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── conversation.py
│   │   │   ├── speech.py
│   │   │   ├── auth.py
│   │   │   └── analytics.py
│   │   ├── services/          # Business logic
│   │   │   ├── conversation_service.py
│   │   │   ├── feedback_service.py
│   │   │   └── session_service.py
│   │   ├── speech_processing/ # ML models
│   │   │   ├── whisper_transcriber.py
│   │   │   ├── acoustic_features.py
│   │   │   └── accent_diagnostics.py
│   │   ├── domain/            # ORM models
│   │   ├── infrastructure/    # DB session & repos
│   │   └── config.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Shared components
│   │   ├── api.js             # Axios instance
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Development Notes

- Work on the `notmain` branch and merge to `main` when stable
- CORS origins are configurable via the `CORS_ORIGINS` env var (default: `localhost:3000,localhost:5173,localhost:8080`)
- Whisper model size can be changed in `speech.py` and `conversation.py`
- Conversation history window is limited to the last 6 messages
- VAD parameters (silence hold, threshold) are tuned in the frontend `LiveConversation.jsx`
