import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Download, Calendar, HelpCircle, FileText } from 'lucide-react';

export const SessionHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [reportText, setReportText] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [userId, searchQuery]);

  const fetchHistory = async () => {
    try {
      const url = `http://localhost:8000/api/analytics/history?user_id=${userId}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ''}`;
      const res = await axios.get(url);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load sessions logs: ", err);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    setReportText(null);
    try {
      const res = await axios.get(`http://localhost:8000/api/analytics/download-report?user_id=${userId}`);
      setReportText(res.data.report_content);
    } catch (err) {
      console.error("Error generating weekly performance report: ", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 90) return 'badge-excellent';
    if (score >= 75) return 'badge-good';
    if (score >= 50) return 'badge-average';
    return 'badge-poor';
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '8px' }}>
            Practice Session Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review, filter, and track specific diagnostic feedback logs from your training history.
          </p>
        </div>
        <button 
          onClick={generateReport}
          disabled={isGeneratingReport}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}
        >
          <FileText size={18} /> {isGeneratingReport ? 'Compiling Report...' : 'Compile Progress Report'}
        </button>
      </div>

      {reportText && (
        <div className="glass-panel" style={{ marginBottom: '30px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} /> Generated Performance Summary Sheet
            </h3>
            <button 
              onClick={() => setReportText(null)} 
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              Hide Report
            </button>
          </div>
          <pre style={{ 
            background: 'var(--bg-primary)', 
            padding: '20px', 
            borderRadius: '8px', 
            overflowX: 'auto',
            fontSize: '0.88rem',
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-code)',
            border: '1px solid var(--glass-border)',
            whiteSpace: 'pre-wrap'
          }}>
            {reportText}
          </pre>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Search Filter input */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search matching transcripts, sentences, or speech prompts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontFamily: 'var(--font-main)',
              fontSize: '0.95rem'
            }}
          />
        </div>

        {/* Chronological sessions listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
              No matching practice logs found in your local database.
            </div>
          ) : (
            history.map((session, index) => {
              const isExpanded = expandedId === index;
              return (
                <div key={index} className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
                  
                  {/* Collapsible header */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : index)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '20px 24px',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <span className={`status-badge ${getScoreBadgeClass(session.metrics.overall_score)}`}>
                        {session.metrics.overall_score.toFixed(0)}%
                      </span>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
                          {session.session_type === 'pronunciation' ? 'Pronunciation Drill' : 'Impromptu Speaking Topic'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {session.created_at}
                          </span>
                          <span>⏳ {session.duration_seconds} seconds duration</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  {/* Expanded collapsible details sheet */}
                  {isExpanded && (
                    <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', marginTop: '20px' }}>
                        <div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Acoustic sub-metrics:
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Pronunciation Accuracy:</span>
                              <span style={{ fontWeight: 600 }}>{session.metrics.pronunciation.toFixed(0)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Speech Fluency:</span>
                              <span style={{ fontWeight: 600 }}>{session.metrics.fluency.toFixed(0)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Delivery Pacing:</span>
                              <span style={{ fontWeight: 600 }}>{session.metrics.speaking_rate.toFixed(0)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Voice Clarity:</span>
                              <span style={{ fontWeight: 600 }}>{session.metrics.clarity.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              Prompt benchmark:
                            </p>
                            <p style={{ fontSize: '0.88rem', color: 'white', fontFamily: 'var(--font-code)' }}>
                              "{session.target_text || 'Spontaneous Speech'}"
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              Whisper transcription:
                            </p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontStyle: 'italic', fontFamily: 'var(--font-code)' }}>
                              "{session.recognized_text}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Display targeted corrective accent feedback loops */}
                      {session.feedback && session.feedback.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-average)', marginBottom: '10px' }}>
                            Targeted L1 corrective diagnostics:
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {session.feedback.map((fb, fIdx) => (
                              <div 
                                key={fIdx}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  borderLeft: '3px solid var(--accent-purple)',
                                  padding: '8px 12px',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: '0.8rem',
                                  lineHeight: 1.4,
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                {fb.feedback_message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
