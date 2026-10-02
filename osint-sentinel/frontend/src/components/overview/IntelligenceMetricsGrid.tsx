import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisSummary } from '../../types';

interface IntelligenceMetricsGridProps {
  summary: AnalysisSummary | null;
  isLoading: boolean;
}

export const IntelligenceMetricsGrid: React.FC<IntelligenceMetricsGridProps> = ({
  summary,
  isLoading,
}) => {
  const navigate = useNavigate();

  const metrics: { label: string; value?: number; to?: string }[] = [
    { label: 'Discovered Assets', value: summary?.assets, to: '/assets' },
    { label: 'Technologies', value: summary?.technologies, to: '/technologies' },
    { label: 'Evidence Items', value: summary?.evidence_items, to: '/evidence' },
    { label: 'Relationships', value: summary?.relationships, to: '/relationships' },
    { label: 'Exposure Signals', value: summary?.exposure_signals, to: '/exposures' },
    { label: 'Findings Logged', value: summary?.informational_findings },
  ];

  return (
    <div className="kpi-grid">
      {metrics.map((m) => {
        const isClickable = Boolean(m.to);
        return (
          <div
            key={m.label}
            className={`kpi-card ${isClickable ? 'kpi-card--actionable' : ''}`}
            onClick={isClickable && m.to ? () => navigate(m.to!) : undefined}
            tabIndex={isClickable ? 0 : undefined}
            role={isClickable ? 'button' : undefined}
            onKeyDown={
              isClickable && m.to
                ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(m.to!)
                : undefined
            }
            style={isClickable ? { cursor: 'pointer' } : undefined}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="kpi-label">{m.label}</span>
              {isClickable && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    color: 'var(--color-accent-cyan)',
                    letterSpacing: '0.04em',
                  }}
                >
                  VIEW →
                </span>
              )}
            </div>
            <span className="kpi-value">
              {isLoading ? '--' : m.value !== undefined ? m.value : '0'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
