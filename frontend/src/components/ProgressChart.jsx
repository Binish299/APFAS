import React from 'react';

export const ProgressChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        Start taking lessons to view performance trends
      </div>
    );
  }

  // Safe parameters
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = 30;

  // Max score boundary is 100
  const maxVal = 100;
  const minVal = 0;

  // Plot coordinates
  const points = data.map((item, idx) => {
    const x = padding + (idx / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    // Inverse Y as SVG origin is top-left
    const y = chartHeight - padding - ((item.score - minVal) / (maxVal - minVal)) * (chartHeight - padding * 2);
    return { x, y, score: item.score, date: item.date };
  });

  // Compile line path d attribute
  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Area under path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length-1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* Gradients definitions */}
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guide lines */}
        {[0, 25, 50, 75, 100].map((level) => {
          const y = chartHeight - padding - (level / 100) * (chartHeight - padding * 2);
          return (
            <g key={level}>
              <line 
                x1={padding} 
                y1={y} 
                x2={chartWidth - padding} 
                y2={y} 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth={1} 
              />
              <text 
                x={padding - 8} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize={9} 
                textAnchor="end"
                fontFamily="var(--font-code)"
              >
                {level}
              </text>
            </g>
          );
        })}

        {/* Dynamic shaded area */}
        {points.length > 0 && (
          <path d={areaD} fill="url(#chart-area-grad)" />
        )}

        {/* Scoring line path */}
        {points.length > 0 && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#chart-line-grad)" 
            strokeWidth={3} 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Circular nodes representing points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={4} 
              fill="var(--bg-primary)" 
              stroke="var(--accent-blue)" 
              strokeWidth={2} 
            />
            {/* Display value above last point as indicator */}
            {idx === points.length - 1 && (
              <g>
                <rect 
                  x={p.x - 18} 
                  y={p.y - 22} 
                  width={36} 
                  height={15} 
                  rx={3} 
                  fill="var(--accent-blue)" 
                />
                <text 
                  x={p.x} 
                  y={p.y - 12} 
                  fill="white" 
                  fontSize={8} 
                  fontWeight="bold" 
                  textAnchor="middle"
                  fontFamily="var(--font-code)"
                >
                  {p.score.toFixed(0)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
