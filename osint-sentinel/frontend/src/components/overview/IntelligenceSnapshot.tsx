import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisSummary } from '../../types';

interface IntelligenceSnapshotProps {
  summary: AnalysisSummary | null;
  isLoading: boolean;
}

export const IntelligenceSnapshot: React.FC<IntelligenceSnapshotProps> = ({
  summary,
  isLoading,
}) => {
  const navigate = useNavigate();

  const snapshotItems: {
    label: string;
    value?: number;
    to: string;
    sublabel: string;
    icon: string;
    accentColor: string;
  }[] = [
    {
      label: 'Assessed Assets',
      value: summary?.assets,
      to: '/assets',
      sublabel: 'Perimeter entities',
      icon: '🌐',
      accentColor: '#00c8e5',
    },
    {
      label: 'Evidence Artifacts',
      value: summary?.evidence_items,
      to: '/evidence',
      sublabel: 'Observable proofs',
      icon: '📜',
      accentColor: '#3b82f6',
    },
    {
      label: 'Technologies',
      value: summary?.technologies,
      to: '/technologies',
      sublabel: 'Detected stacks',
      icon: '⚙️',
      accentColor: '#7c5cfc',
    },
    {
      label: 'Exposure Signals',
      value: summary?.exposure_signals,
      to: '/exposure',
      sublabel: 'Prioritized vectors',
      icon: '⚡',
      accentColor: '#f59e0b',
    },
    {
      label: 'Relationships',
      value: summary?.relationships,
      to: '/relationships',
      sublabel: 'Entity associations',
      icon: '🔗',
      accentColor: '#10b981',
    },
  ];

  return (
    <div className="intelligence-snapshot-strip" aria-label="Intelligence Snapshot">
      <div className="snapshot-strip-eyebrow">
        <div className="snapshot-title-group">
          <span className="snapshot-live-pulse" />
          <span>Intelligence Telemetry Snapshot</span>
        </div>
        <span className="snapshot-timestamp-tag">Verified Telemetry Baseline</span>
      </div>

      <div className="snapshot-cells-grid">
        {snapshotItems.map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && <div className="snapshot-strip-divider" aria-hidden="true" />}
            <button
              type="button"
              className="snapshot-cell-action"
              onClick={() => navigate(item.to)}
              title={`Explore ${item.label} (${item.value ?? 0})`}
            >
              <div className="snapshot-cell-header">
                <span className="snapshot-item-icon" aria-hidden="true">{item.icon}</span>
                <span className="snapshot-cell-num">
                  {isLoading ? '...' : (item.value ?? 0)}
                </span>
                <span className="snapshot-cell-arrow" aria-hidden="true">→</span>
              </div>
              <span className="snapshot-cell-label">{item.label}</span>
              <span className="snapshot-cell-sublabel">{item.sublabel}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
