import React from 'react';
import { RiskAssessment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface ExposureDriversChartProps {
  risk: RiskAssessment | null;
}

export const ExposureDriversChart: React.FC<ExposureDriversChartProps> = ({ risk }) => {
  if (!risk || !risk.factors_breakdown || Object.keys(risk.factors_breakdown).length === 0) {
    return (
      <div className="overview-card exposure-drivers-card">
        <h3 className="card-title">WHY THIS ASSESSMENT?</h3>
        <p className="card-subtitle">Deterministic factors contributing to the external exposure posture.</p>
        <p className="card-empty-text">No risk assessment data available.</p>
      </div>
    );
  }

  const factors = Object.entries(risk.factors_breakdown)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      score: value,
    }))
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...factors.map(f => Math.abs(f.score)), 10);
  const primaryFactor = factors.length > 0 && factors[0].score > 0 ? factors[0].name : null;

  return (
    <div className="overview-card exposure-drivers-card">
      <h3 className="section-group-title">SCORE BREAKDOWN</h3>
      <p className="card-subtitle">Deterministic factors contributing to the external exposure posture.</p>
      {/* TODO: Confirm copy for score breakdown explanation */}
      <p className="card-subtitle" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Individual factors are weighted and summed to calculate the overall risk score.</p>
      
      <div className="horizontal-bar-chart" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {factors.map((factor, idx) => {
          const isZero = factor.score === 0;
          const isPrimary = factor.name === primaryFactor;
          
          let maxForFactor = 10;
          if (factor.name.toLowerCase().includes('critical')) maxForFactor = 25;
          const widthPct = (Math.abs(factor.score) / maxScore) * 100;
          
          // Map to a neutral/info scale using tokens
          let barColor = 'var(--color-status-info)';

          return (
            <div className="bar-row" key={idx} style={{ opacity: isZero ? 0.6 : 1, display: 'grid', gridTemplateColumns: '1fr 180px 88px', alignItems: 'center', gap: '16px' }} title={isZero ? 'No contribution detected' : ''}>
              <div className="bar-label" style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{factor.name}</span>
                {isPrimary && <div style={{ marginTop: '4px' }}><StatusBadge label="Primary contributor" variant="cyan" showDot={false} /></div>}
              </div>
              <div className="bar-track" style={{ width: '100%', height: '8px', background: 'var(--color-bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                {!isZero && (
                  <div 
                    className="bar-fill" 
                    style={{ width: `${widthPct}%`, backgroundColor: barColor, height: '100%' }}
                  />
                )}
              </div>
              <div className="bar-value" style={{ whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>
                {factor.score > 0 ? `+${factor.score.toFixed(1)}` : factor.score.toFixed(1)} <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>/ {maxForFactor}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
