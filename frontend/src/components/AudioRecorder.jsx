import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, AlertCircle } from 'lucide-react';

export const AudioRecorder = ({ onRecordComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

  const startTimer = () => {
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setErrorMsg(null);
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create browser MediaRecorder. WebM/WAV codec.
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Pass blob up
        if (onRecordComplete) {
          onRecordComplete(audioBlob);
        }
      };

      mediaRecorder.start(250); // Capture chunk slices every 250ms
      setIsRecording(true);
      startTimer();

    } catch (err) {
      console.error("Microphone access denied: ", err);
      setErrorMsg("Unable to access microphone. Please enable audio permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      stopStream();
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="recorder-box">
      {errorMsg ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-needs-improvement)', marginBottom: '12px' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? <Square size={26} fill="white" /> : <Mic size={28} />}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: isRecording ? 'var(--color-needs-improvement)' : 'var(--text-primary)',
            fontFamily: 'var(--font-code)' 
          }}>
            {formatTime(recordingDuration)}
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isRecording ? 'Speaking... Click again to finalize' : 'Click microphone to record your speech'}
          </p>
        </div>
      </div>

      {isRecording && (
        <div className="soundwave">
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
        </div>
      )}

      {audioUrl && !isRecording && (
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)'
        }}>
          <Volume2 size={18} style={{ color: 'var(--accent-blue)' }} />
          <audio src={audioUrl} controls style={{ height: '30px', width: '220px' }} />
        </div>
      )}
    </div>
  );
};
