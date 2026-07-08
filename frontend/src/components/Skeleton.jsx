import React from 'react';

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

const skeletonStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: '8px',
};

export const SkeletonBar = ({ width = '100%', height = '16px', style = {} }) => (
  <>
    <style>{shimmer}</style>
    <div style={{ ...skeletonStyle, width, height, ...style }} />
  </>
);

export const SkeletonPanel = ({ height = '200px', style = {} }) => {
  const parsed = parseInt(String(height), 10) || 200;
  return (
    <div className="glass-panel" style={{ padding: '24px', ...style }}>
      <style>{shimmer}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ ...skeletonStyle, width: '40%', height: '20px' }} />
        <div style={{ ...skeletonStyle, width: '100%', height: Math.max(parsed - 80, 40) }} />
        <div style={{ ...skeletonStyle, width: '60%', height: '14px' }} />
      </div>
    </div>
  );
};

export const SkeletonCard = () => (
  <>
    <style>{shimmer}</style>
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ ...skeletonStyle, width: '30%', height: '14px' }} />
        <div style={{ ...skeletonStyle, width: '100%', height: '14px' }} />
        <div style={{ ...skeletonStyle, width: '70%', height: '14px' }} />
      </div>
    </div>
  </>
);
