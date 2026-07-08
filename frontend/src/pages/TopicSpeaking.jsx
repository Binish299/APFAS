import React, { useState, useEffect } from 'react';
import { TopicCard } from '../components/TopicCard';
import { AudioRecorder } from '../components/AudioRecorder';
import { MetricMeter, ScoreBar } from '../components/MetricMeter';
import { SkeletonCard } from '../components/Skeleton';
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, Award, Compass, Timer } from 'lucide-react';
import api from '../api';

export const TopicSpeaking = ({ navigateTo }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [durationLimit, setDurationLimit] = useState(60); // Default 1 min (60 seconds)
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics/list");
      setTopics(res.data);
      if (res.data.length > 0) {
        setSelectedTopic(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load speaking topics: ", err);
      setErrorMsg("Failed to load impromptu speaking prompts from local API.");
    }
  };

  const handleSpeechSubmitted = async (audioBlob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "topic_recording.wav");
    formData.append("topic_id", selectedTopic.id);
    formData.append("duration_limit_seconds", durationLimit);

    try {
      const res = await api.post("/speech/evaluate-topic", formData);
      setResult(res.data);
    } catch (err) {
      console.error("Analysis pipeline error: ", err);
      const detail = err.response?.data?.detail || err.message;
      setErrorMsg(`Analysis failed (${err.response?.status || 'network'}): ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigateTo('dashboard')} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '30px' }}>
        
        {/* Left Side Topic Prompts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} style={{ color: 'var(--accent-blue)' }} /> Impromptu Speaking Prompts
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {topics.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                topics.map((t) => (
                  <TopicCard 
                    key={t.id}
                    topicData={t}
                    isActive={selectedTopic?.id === t.id}
                    onSelect={() => {
                      setSelectedTopic(t);
                      setResult(null);
                      setErrorMsg(null);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="glass-panel">
            <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={18} style={{ color: 'var(--color-average)' }} /> Practice Speaking Threshold
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Specify the intended duration threshold. The engine will evaluate rate pacing according to this:
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: '1 Minute Drill', val: 60 },
                { label: '2 Minutes Drill', val: 120 },
                { label: '3 Minutes Drill', val: 180 }
              ].map((dur) => (
                <button
                  key={dur.val}
                  onClick={() => setDurationLimit(dur.val)}
                  className="btn"
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    background: durationLimit === dur.val ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                    border: durationLimit === dur.val ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                    color: durationLimit === dur.val ? 'var(--accent-blue)' : 'var(--text-secondary)'
                  }}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Recording & Detailed Spontaneous Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedTopic && (
            <div className="glass-panel">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
                Active Topic Prompts
              </span>
              <h2 className="gradient-title" style={{ fontSize: '1.5rem', marginTop: '4px', marginBottom: '12px' }}>
                {selectedTopic.topic}
              </h2>
              <p style={{ color: 'white', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.4, marginBottom: '24px', fontStyle: 'italic' }}>
                "{selectedTopic.prompt}"
              </p>

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
                  Analyzing lexical diversity and silence patterns...
                </div>
              )}

              {errorMsg && (
                <div className="glass-panel" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-needs-improvement)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Renders Spontaneous Analysis Metrics Sheets */}
          {result && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} style={{ color: 'var(--color-average)' }} />
                <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Spontaneous Assessment Result</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'center' }}>
                <div>
                  <MetricMeter value={result.metrics.overall_score} label="Overall Communication Rating" />
                </div>
                <div>
                  <ScoreBar label="Vocab Diversity & Richness" score={result.metrics.vocabulary_richness} weight="10%" />
                  <ScoreBar label="Delivery Pacing & Tempo" score={result.metrics.speaking_rate} weight="15%" />
                  <ScoreBar label="Fluency & continuous Phrasing" score={result.metrics.fluency} weight="20%" />
                  <ScoreBar label="Confidence Rating" score={result.metrics.confidence} weight="15%" />
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
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Decoded Transcribed Speech:</p>
                <p style={{ color: 'white', fontStyle: 'italic', fontFamily: 'var(--font-code)' }}>
                  "{result.recognized_text}"
                </p>
              </div>

              {result.feedback && result.feedback.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--color-average)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> Spontaneous Speech Coaching Suggestions:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.feedback.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'rgba(139,92,246,0.04)',
                          borderLeft: '4px solid var(--accent-purple)',
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
