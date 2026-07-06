import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export const TopicCard = ({ topicData, onSelect, isActive }) => {
  if (!topicData) return null;

  return (
    <div 
      onClick={onSelect}
      className={`glass-panel interactive-card`}
      style={{
        border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
        background: isActive ? 'rgba(59,130,246,0.06)' : 'var(--glass-bg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: isActive ? 'var(--accent-blue)' : 'var(--accent-purple)'
        }}>
          {topicData.topic}
        </span>
        <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
      </div>

      <p style={{ 
        fontSize: '0.95rem', 
        fontWeight: 500, 
        color: 'var(--text-primary)',
        lineHeight: 1.4
      }}>
        {topicData.prompt}
      </p>

      {topicData.suggested_keywords && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {topicData.suggested_keywords.map((kw, idx) => (
            <span 
              key={idx} 
              style={{
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                padding: '2px 8px',
                color: 'var(--text-secondary)'
              }}
            >
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
