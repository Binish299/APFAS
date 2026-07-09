import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Mic, Square, Sparkles, Loader2, RefreshCw, VolumeX } from 'lucide-react';
import api, { API_BASE } from '../api';

export const LiveConversation = () => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural');
  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const autoPlayedRef = useRef(new Set());

  useEffect(() => {
    api.get("/conversation/voices").then(res => {
      setVoices(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMsgId(null);
  }, []);

  const playAudio = useCallback((msgId, audioUrl) => {
    stopPlayback();
    const audio = new Audio(`${API_BASE}${audioUrl}&voice=${selectedVoice}`);
    audioRef.current = audio;
    audio.onended = () => setPlayingMsgId(null);
    audio.onerror = () => setPlayingMsgId(null);
    setPlayingMsgId(msgId);
    audio.play().catch(() => setPlayingMsgId(null));
  }, [selectedVoice, stopPlayback]);

  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendToConversation(audioBlob);
      };
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      setErrorMsg("Unable to access microphone. Please enable audio permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const sendToConversation = async (audioBlob) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");
    formData.append("history", JSON.stringify(history));

    try {
      const res = await api.post("/conversation/send", formData);
      const assistantId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        { role: 'user', text: res.data.user_text, id: Date.now() },
        { role: 'assistant', text: res.data.assistant_text, id: assistantId, audioUrl: res.data.assistant_audio_url }
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setErrorMsg(`${detail}`);
      console.error("Conversation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.audioUrl && !autoPlayedRef.current.has(lastMsg.id)) {
      autoPlayedRef.current.add(lastMsg.id);
      stopPlayback();
      const audio = new Audio(`${API_BASE}${lastMsg.audioUrl}&voice=${selectedVoice}`);
      audioRef.current = audio;
      audio.onended = () => setPlayingMsgId(null);
      audio.onerror = () => setPlayingMsgId(null);
      setPlayingMsgId(lastMsg.id);
      audio.play().catch(() => setPlayingMsgId(null));
    }
  }, [messages, selectedVoice, stopPlayback]);

  const clearChat = () => {
    stopPlayback();
    setMessages([]);
    autoPlayedRef.current = new Set();
    setErrorMsg(null);
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0, gap: '16px' }}>
        <div>
          <span className="eyebrow">Live Conversation</span>
          <h1 className="gradient-title" style={{ fontSize: '1.8rem' }}>
            Talk with your AI Coach
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Speak naturally — the AI will correct your pronunciation in real-time, like a real conversation partner.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '4px' }}>
          {voices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                maxWidth: '160px',
              }}
              title="TTS Voice"
            >
              {voices.map(v => (
                <option key={v} value={v}>{v.replace(/^en-/, '').replace(/Neural$/, '')}</option>
              ))}
            </select>
          )}
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
              <RefreshCw size={14} /> New
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', paddingRight: '8px' }}>
        {messages.length === 0 && !isProcessing && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
            <Sparkles size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Press the microphone to start talking</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Your AI conversation partner is ready</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                <Sparkles size={16} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: '70%',
              padding: msg.role === 'user' ? '12px 18px' : '14px 18px',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--glass-bg)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              lineHeight: 1.5,
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              <p style={{ margin: 0 }}>{msg.text}</p>
              {msg.role === 'assistant' && msg.audioUrl && (
                <button
                  onClick={() => playingMsgId === msg.id ? stopPlayback() : playAudio(msg.id, msg.audioUrl)}
                  title={playingMsgId === msg.id ? 'Stop' : 'Listen'}
                  style={{
                    marginTop: '8px',
                    background: playingMsgId === msg.id ? 'rgba(194,77,77,0.1)' : 'rgba(15,68,77,0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: playingMsgId === msg.id ? 'var(--color-needs-improvement)' : 'var(--accent-blue)',
                  }}
                >
                  {playingMsgId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {playingMsgId === msg.id ? 'Stop' : 'Listen'}
                </button>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="white" />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 4px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={16} className="spin" />
              Thinking...
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(194,77,77,0.08)', color: 'var(--color-needs-improvement)', fontSize: '0.85rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? <Square size={22} fill="white" /> : <Mic size={26} />}
        </button>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isRecording ? 'Recording... tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
};