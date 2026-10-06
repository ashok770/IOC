import React from 'react';

interface AssessmentGaugeProps {
  score: number | null;
  level: string;
}

export const AssessmentGauge: React.FC<AssessmentGaugeProps> = ({ score, level }) => {
  const normalizedScore = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  
  // Gauge variables
  const radius = 100;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half circle
  const dashoffset = circumference - (normalizedScore / 100) * circumference;

  const getLevelColor = (lvl: string) => {
    switch (lvl.toLowerCase()) {
      case 'low': return 'var(--color-status-success)';
      case 'medium': return 'var(--color-status-warning)';
      case 'high': return 'var(--color-status-high)';
      case 'critical': return 'var(--color-status-critical)';
      default: return 'var(--color-border-strong)';
    }
  };

  const color = getLevelColor(level);

  // Ticks for quartiles (25, 50, 75)
  const ticks = [25, 50, 75].map(val => {
    const angle = Math.PI - (val / 100) * Math.PI;
    const x1 = Math.cos(angle) * (radius - strokeWidth/2);
    const y1 = -Math.sin(angle) * (radius - strokeWidth/2);
    const x2 = Math.cos(angle) * (radius + strokeWidth/2);
    const y2 = -Math.sin(angle) * (radius + strokeWidth/2);
    return <line key={val} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-bg-surface)" strokeWidth="2" />;
  });

  const ariaLabel = score !== null 
    ? `Exposure score ${score.toFixed(1)} out of 100, rated ${level}`
    : 'Exposure score pending';

  return (
    <div className="assessment-gauge-container" aria-label={ariaLabel} role="img" style={{ width: '220px', position: 'relative' }}>
      <svg 
        className="assessment-gauge-svg" 
        viewBox="-160 -140 320 160" 
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Background track */}
        <path
          d={`M -${radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Foreground track */}
        <path
          d={`M -${radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
          fill="none"
          stroke={score !== null ? color : 'var(--color-border-strong)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={score !== null ? dashoffset : circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />

        {/* Ticks */}
        {ticks}

        {/* Tick labels */}
        <text x="-80" y="-80" fontSize="10" fill="var(--color-text-muted)" textAnchor="middle" transform="rotate(-45 -80 -80)">LOW</text>
        <text x="0" y="-115" fontSize="10" fill="var(--color-text-muted)" textAnchor="middle">MED</text>
        <text x="80" y="-80" fontSize="10" fill="var(--color-text-muted)" textAnchor="middle" transform="rotate(45 80 -80)">HIGH</text>

        {/* 0 and 100 labels - moved further out */}
        <text x="-120" y="0" fontSize="12" fill="var(--color-text-muted)" textAnchor="end" dominantBaseline="middle" fontFamily="inherit">0</text>
        <text x="120" y="0" fontSize="12" fill="var(--color-text-muted)" textAnchor="start" dominantBaseline="middle" fontFamily="inherit">100</text>
      </svg>
      <div className="gauge-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: '0', left: '0', width: '100%', paddingBottom: '10px' }}>
        <div className="gauge-score" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{score !== null ? score.toFixed(1) : '--'}</div>
        <div className="severity-pill" style={{ backgroundColor: color, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
          {level.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
