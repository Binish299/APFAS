import React, { useState, useEffect } from 'react';
import { ProgressChart } from '../components/ProgressChart';
import { MetricMeter } from '../components/MetricMeter';
import { SkeletonPanel, SkeletonBar } from '../components/Skeleton';
import { BarChart3, AlertTriangle, BookOpen, Clock, Play } from 'lucide-react';
import api from '../api';

export const Dashboard = ({ navigateTo }) => {
  const [stats, setStats] = useState({
    total_sessions: 0,
    average_score: 0,
    average_fluency: 0,
    average_pronunciation: 0,
    most_frequent_mistakes: [],
    progress_trends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/analytics/summary");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics: ", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <SkeletonBar width="300px" height="36px" />
          <SkeletonBar width="160px" height="40px" />
        </div>
        <div className="grid-cols-3" style={{ marginBottom: '30px' }}>
          <SkeletonPanel height="100px" />
          <SkeletonPanel height="100px" />
          <SkeletonPanel height="100px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
          <SkeletonPanel height="320px" />
          <SkeletonPanel height="320px" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="gradient-title" style={{ fontSize: '2.25rem', marginBottom: '8px' }}>
            Acoustic Speech Coaching
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time local assessment and L1 correction specifically designed for Nepali speakers.
          </p>
        </div>
        <button 
          onClick={() => navigateTo('drill')} 
          className="btn btn-primary"
        >
          <Play size={18} fill="white" /> Start Practice Drill
        </button>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '30px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: 'rgba(15,68,77,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent-blue)'
          }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-code)' }}>
              {stats.average_score.toFixed(0)}%
            </h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Fluency & Pronunciation</span>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: 'rgba(15,68,77,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent-purple)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-code)' }}>
              {stats.total_sessions}
            </h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Practice Sessions Completed</span>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: 'rgba(16,185,129,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-excellent)'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-code)' }}>
              {stats.total_sessions * 2} min
            </h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Spoken Speaking Time</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
        {/* Left Side Progress Graph */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Historical Performance Curve</h3>
          <div style={{ 
            background: 'rgba(255,255,255,0.01)', 
            padding: '20px', 
            borderRadius: '12px',
            border: '1px solid var(--glass-border)' 
          }}>
            <ProgressChart data={stats.progress_trends} />
          </div>
        </div>

        {/* Right Side Accent Weaknesses */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-average)' }} /> Primary Accent Challenges
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.most_frequent_mistakes.length === 0 ? (
              <div style={{ 
                padding: '30px 10px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '0.9rem' 
              }}>
                Take some pronunciation tests to diagnose accent traits.
              </div>
            ) : (
              stats.most_frequent_mistakes.map((mistake, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    padding: '12px 16px',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {mistake.mistake_type}
                  </span>
                  <span className="status-badge badge-poor" style={{ fontSize: '0.75rem' }}>
                    {mistake.frequency} hits
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ 
            marginTop: 'auto',
            background: 'rgba(15,68,77,0.05)',
            border: '1px solid rgba(15,68,77,0.1)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            💡 **Nepali Accent Insight:** The labiodental sounds 'V' and dental fricatives 'TH' often substitute to soft stopped sounds ('W' or 'T/D') due to native phonetics rules. Focus drills are highly recommended.
          </div>
        </div>
      </div>
    </div>
  );
};
