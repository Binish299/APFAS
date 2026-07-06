import React, { useState } from 'react';
import axios from 'axios';
import { AudioRecorder } from '../components/AudioRecorder';
import { MetricMeter, ScoreBar } from '../components/MetricMeter';
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, Award } from 'lucide-react';

const DRILLS = [
  {
    id: 1,
    sentence: "The shepherd watched his sheep in the cold valley.",
    focus: "Consonants: 'SH' vs 'S', 'V' vs 'W', and Dental 'TH'"
  },
  {
    id: 2,
    sentence: "There are many wild zebras in the central zoo.",
    focus: "Consonants: Voiced 'Z' vs 'J', and Voiced 'TH'"
  },
  {
    id: 3,
    sentence: "Please verify the water flow in the kitchen sink.",
    focus: "Consonants: 'V' vs 'W', and 'F' vs 'PH'"
  },
  {
    id: 4,
    sentence: "The school station was located in a very special city.",
    focus: "Syllables: Vowel epenthesis in 'school', 'station', 'special'"
  }
];

export const TrainingSession = ({ userId, navigateTo }) => {
  const [selectedDrill, setSelectedDrill] = useState(DRILLS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSpeechSubmitted = async (audioBlob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");
    formData.append("target_text", selectedDrill.sentence);
    formData.append("user_id", userId);

    try {
      const res = await axios.post("http://localhost:8000/api/speech/evaluate-pronunciation", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (err) {
      console.error("Analysis pipeline error: ", err);
      setErrorMsg("Failed to complete pronunciation analysis. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigateTo('dashboard')} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
        
        {/* Left Side Drill Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-purple)' }} /> Pronunciation Prompts
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DRILLS.map((drill) => (
                <div 
                  key={drill.id}
                  onClick={() => {
                    setSelectedDrill(drill);
                    setResult(null);
                    setErrorMsg(null);
                  }}
                  className="glass-panel interactive-card"
                  style={{
                    padding: '16px',
                    border: selectedDrill.id === drill.id ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                    background: selectedDrill.id === drill.id ? 'rgba(59,130,246,0.06)' : 'var(--glass-bg)'
                  }}
                >
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drill #{drill.id}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                    {drill.focus}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Recording & Evaluation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel">
            <h2 className="gradient-title" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
              Sentence Pronunciation Challenge
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Read the following sentence aloud clearly. Maintain consistent breathing and phrasing:
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'white',
              lineHeight: 1.4,
              marginBottom: '24px',
              fontFamily: 'var(--font-main)',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              "{selectedDrill.sentence}"
            </div>

            <AudioRecorder 
              onRecordComplete={handleSpeechSubmitted}
              isProcessing={isProcessing}
            />

            {isProcessing && (
              <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--accent-blue)',
                  borderRadius: '50%',
                  animation: 'pulse-recording 1s linear infinite'
                }} />
                Running Local Whisper models and phonetic diagnostics...
              </div>
            )}

            {errorMsg && (
              <div className="glass-panel" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-needs-improvement)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Renders dynamic scoring matrices once available */}
          {result && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} style={{ color: 'var(--color-average)' }} />
                <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Session Assessment Scoresheet</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'center' }}>
                <div>
                  <MetricMeter value={result.metrics.overall_score} label="Aggregated Final Score" />
                </div>
                <div>
                  <ScoreBar label="Pronunciation Accuracy" score={result.metrics.pronunciation} weight="30%" />
                  <ScoreBar label="Phrasing & Fluency" score={result.metrics.fluency} weight="20%" />
                  <ScoreBar label="Conversational Speed" score={result.metrics.speaking_rate} weight="15%" />
                  <ScoreBar label="Acoustic Clarity" score={result.metrics.clarity} weight="10%" />
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--glass-border)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                lineHeight: 1.4
              }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Transcription Output:</p>
                <p style={{ color: 'white', fontStyle: 'italic', fontFamily: 'var(--font-code)' }}>
                  "{result.recognized_text}"
                </p>
              </div>

              {result.feedback && result.feedback.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--color-average)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> Targeted Pronunciation Coaching:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.feedback.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'rgba(139,92,246,0.04)',
                          borderLeft: '4px solid var(--accent-purple)',
                          borderTop: '1px solid rgba(255,255,255,0.02)',
                          borderRight: '1px solid rgba(255,255,255,0.02)',
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                          padding: '14px 16px',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '0.88rem',
                          lineHeight: 1.4,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {item.feedback_message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
