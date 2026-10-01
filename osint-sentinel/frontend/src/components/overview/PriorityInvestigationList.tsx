import React from 'react';
import { RiskRecommendation, ExposureSignal } from '../../types';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';

interface PriorityInvestigationListProps {
  recommendations: RiskRecommendation[];
  exposureSignals: ExposureSignal[];
  isLoading: boolean;
}

export const PriorityInvestigationList: React.FC<PriorityInvestigationListProps> = ({
  recommendations,
  exposureSignals,
  isLoading,
}) => {
  const getPriorityVariant = (priority: string): StatusBadgeVariant => {
    const p = priority.toLowerCase();
    if (p.includes('p1') || p.includes('urgent') || p.includes('critical')) return 'critical';
    if (p.includes('p2') || p.includes('high')) return 'high';
    if (p.includes('p3') || p.includes('medium')) return 'warning';
    return 'cyan';
  };

  const getPriorityClass = (priority: string): string => {
    const p = priority.toLowerCase();
    if (p.includes('p1') || p.includes('urgent')) return 'p1';
    if (p.includes('p2') || p.includes('high')) return 'p2';
    if (p.includes('p3') || p.includes('medium')) return 'p3';
    return 'p4';
  };

  const hasRecommendations = recommendations.length > 0;
  const hasSignals = exposureSignals.length > 0;

  return (
    <section className="investigation-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Priority Investigation
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Factual observations and exposure indicators prioritized for defensive investigation.
          </p>
        </div>
        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-violet)', fontWeight: 600 }}>
          EXPOSURE ≠ VULNERABILITY ≠ EXPLOIT
        </span>
      </div>

      {isLoading ? (
        <div className="state-box" style={{ minHeight: 160 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Retrieving priority investigation items...</span>
        </div>
      ) : !hasRecommendations && !hasSignals ? (
        <div className="state-box" style={{ minHeight: 140 }}>
          <span className="state-title" style={{ color: 'var(--color-text-secondary)' }}>
            No prioritized exposure signals identified
          </span>
          <p className="state-message">
            Deterministic risk evaluation and passive collection returned no prioritized exposure signals or high-urgency remediation actions for this target scope.
          </p>
        </div>
      ) : (
        <div className="investigation-list">
          {/* Surface Risk Engine Recommendations if present */}
          {recommendations.map((rec, idx) => (
            <div key={`rec-${idx}`} className={`investigation-card ${getPriorityClass(rec.priority)}`}>
              <div className="investigation-header">
                <span className="investigation-title">{rec.title}</span>
                <StatusBadge
                  label={rec.priority.replace('_', ' ')}
                  variant={getPriorityVariant(rec.priority)}
                />
              </div>

              <p className="investigation-action">
                <strong>Recommended Action:</strong> {rec.action}
              </p>

              <p className="investigation-rationale">
                <strong>Rationale:</strong> {rec.rationale}
              </p>

              <div className="investigation-footer">
                <span>Category: {rec.category.replace('_', ' ')}</span>
                {rec.evidence_id && <span>Evidence ID: {rec.evidence_id.slice(0, 8)}...</span>}
              </div>
            </div>
          ))}

          {/* If no formal recommendations exist, surface verified exposure signals */}
          {!hasRecommendations &&
            exposureSignals.map((sig) => (
              <div key={sig.id} className="investigation-card p4">
                <div className="investigation-header">
                  <span className="investigation-title">{sig.title}</span>
                  <StatusBadge label="INFO SIGNAL" variant="cyan" />
                </div>

                <p className="investigation-action">{sig.description}</p>

                <div className="investigation-footer">
                  <span>Category: {sig.category.replace('_', ' ')}</span>
                  <span>Confidence: {(sig.confidence * 100).toFixed(0)}%</span>
                  {sig.evidence_id && <span>Evidence: {sig.evidence_id.slice(0, 8)}...</span>}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
};
