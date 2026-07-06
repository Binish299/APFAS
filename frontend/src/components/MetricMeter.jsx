import React from 'react';

export const MetricMeter = ({ value, label, size = 140 }) => {
  // Value limits
  const score = Math.min(Math.max(value || 0, 0), 100);
  
  // Calculate SVG stroke offset
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine accent color HSL based on category range
  let color = 'var(--color-needs-improvement)';
  if (score >= 90) color = 'var(--color-excellent)';
  else if (score >= 75) color = 'var(--color-good)';
  else if (score >= 50) color = 'var(--color-average)';

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="score-circle" style={{ width: size, height: size }}>
        <svg className="score-circle-svg" width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          <circle 
            className="circle-bg" 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
          />
          <circle 
            className="circle-progress" 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className="circle-value" style={{ textShadow: `0 0 15px rgba(255,255,255,0.08)` }}>
          {score.toFixed(0)}
        </span>
      </div>
      {label && (
        <div style={{ 
          fontSize: '0.95rem', 
          fontWeight: 600, 
          color: 'var(--text-secondary)',
          marginTop: '8px'
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

export const ScoreBar = ({ label, score, weight }) => {
  const rounded = Math.round(score || 0);
  
  let colorClass = 'var(--color-needs-improvement)';
  if (rounded >= 90) colorClass = 'var(--color-excellent)';
  else if (rounded >= 75) colorClass = 'var(--color-good)';
  else if (rounded >= 50) colorClass = 'var(--color-average)';

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          {label} {weight && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({weight})</span>}
        </span>
        <span style={{ fontWeight: 600, color: colorClass }}>{rounded}%</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '4px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${rounded}%`, 
          height: '100%', 
          background: colorClass,
          borderRadius: '4px',
          transition: 'width 0.8s ease-out'
        }} />
      </div>
    </div>
  );
};
