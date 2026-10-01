import React from 'react';
import { AnalysisSummary } from '../../types';

interface IntelligenceMetricsGridProps {
  summary: AnalysisSummary | null;
  isLoading: boolean;
}

export const IntelligenceMetricsGrid: React.FC<IntelligenceMetricsGridProps> = ({
  summary,
  isLoading,
}) => {
  const metrics = [
    { label: 'Discovered Assets', value: summary?.assets },
    { label: 'Technologies', value: summary?.technologies },
    { label: 'Evidence Items', value: summary?.evidence_items },
    { label: 'Relationships', value: summary?.relationships },
    { label: 'Exposure Signals', value: summary?.exposure_signals },
    { label: 'Findings Logged', value: summary?.informational_findings },
  ];

  return (
    <div className="kpi-grid">
      {metrics.map((m) => (
        <div key={m.label} className="kpi-card">
          <span className="kpi-label">{m.label}</span>
          <span className="kpi-value">
            {isLoading ? '--' : m.value !== undefined ? m.value : '0'}
          </span>
        </div>
      ))}
    </div>
  );
};
