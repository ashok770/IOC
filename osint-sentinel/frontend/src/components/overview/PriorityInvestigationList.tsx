import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const getPriorityVariant = (priority: string): StatusBadgeVariant => {
    const p = priority.toLowerCase();
    if (p.includes('p1') || p.includes('urgent') || p.includes('critical')) return 'critical';
    if (p.includes('p2') || p.includes('high')) return 'high';
    if (p.includes('p3') || p.includes('medium')) return 'warning';
    return 'cyan';
  };

  const hasRecommendations = recommendations.length > 0;
  const hasSignals = exposureSignals.length > 0;

  return (
    <div className="priority-investigation-wrapper" aria-label="Priority Investigation Triage">
      <div className="investigation-section-header">
        <div>
          <div className="investigation-title-row">
            <span className="investigation-header-icon" aria-hidden="true">🛡️</span>
            <h2 className="investigation-main-title">Priority Investigation Triage</h2>
          </div>
          <p className="investigation-main-subtitle">
            Observable exposure indicators and defensive posture findings prioritized for analyst verification
          </p>
        </div>

        <div className="investigation-header-actions">
          <span className="discipline-banner-tag">
            EXPOSURE ≠ VULNERABILITY ≠ EXPLOIT
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/exposure')}
            title="Open Exposure Intelligence module"
          >
            <span>VIEW ALL SIGNALS</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="state-box" style={{ minHeight: 200 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Retrieving priority investigation items...</span>
        </div>
      ) : !hasRecommendations && !hasSignals ? (
        <div className="state-box" style={{ minHeight: 160 }}>
          <span className="state-title" style={{ color: 'var(--color-text-secondary)' }}>
            No prioritized exposure signals identified
          </span>
          <p className="state-message">
            Deterministic risk evaluation and passive collection returned no prioritized exposure signals for this target scope.
          </p>
        </div>
      ) : (
        <div className="investigation-cards-stack">
          {/* Surface Risk Engine Recommendations if present */}
          {recommendations.map((rec, idx) => (
            <div key={`rec-${idx}`} className="priority-finding-card">
              <div className="finding-card-top-row">
                <div className="finding-title-group">
                  <div className="finding-tags-row">
                    <span className="finding-category-tag">{rec.category.replace('_', ' ')}</span>
                    <span className="finding-rule-type">Risk Engine</span>
                  </div>
                  <h3 className="finding-headline">{rec.title}</h3>
                </div>
                <StatusBadge
                  label={rec.priority.replace('_', ' ')}
                  variant={getPriorityVariant(rec.priority)}
                />
              </div>

              <div className="finding-details-quad">
                {/* 1. What was observed */}
                <div className="detail-quad-col">
                  <div className="quad-label-row">
                    <span className="quad-indicator-dot" />
                    <span className="detail-quad-label">WHAT WAS OBSERVED</span>
                  </div>
                  <p className="detail-quad-text">{rec.rationale}</p>
                </div>

                {/* 2. Why it matters */}
                <div className="detail-quad-col">
                  <div className="quad-label-row">
                    <span className="quad-indicator-dot quad-dot--action" />
                    <span className="detail-quad-label">DEFENSIVE ACTION & IMPLICATION</span>
                  </div>
                  <p className="detail-quad-text">{rec.action}</p>
                </div>
              </div>

              <div className="finding-card-bottom-row">
                <div className="finding-meta-item">
                  <span className="finding-meta-label">CONFIDENCE:</span>
                  <div className="confidence-meter-mini">
                    <div className="confidence-meter-track">
                      <div className="confidence-meter-fill" style={{ width: '100%' }} />
                    </div>
                    <span className="finding-meta-val">Verified Deterministic Rule</span>
                  </div>
                </div>

                {rec.evidence_id && (
                  <div className="finding-meta-item">
                    <span className="finding-meta-label">SUPPORTING EVIDENCE:</span>
                    <button
                      type="button"
                      className="finding-evidence-link"
                      onClick={() => navigate('/evidence')}
                      title="View supporting evidence artifact"
                    >
                      <span className="evidence-link-id">{rec.evidence_id.slice(0, 10)}...</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* If no formal recommendations exist, surface verified exposure signals */}
          {!hasRecommendations &&
            exposureSignals.map((sig) => (
              <div key={sig.id} className="priority-finding-card">
                <div className="finding-card-top-row">
                  <div className="finding-title-group">
                    <div className="finding-tags-row">
                      <span className="finding-category-tag">{sig.category.replace('_', ' ')}</span>
                      <span className="finding-rule-type">Public Observation</span>
                    </div>
                    <h3 className="finding-headline">{sig.title}</h3>
                  </div>
                  <StatusBadge label="EXPOSURE SIGNAL" variant="cyan" />
                </div>

                <div className="finding-details-quad">
                  {/* 1. What was observed */}
                  <div className="detail-quad-col">
                    <div className="quad-label-row">
                      <span className="quad-indicator-dot" />
                      <span className="detail-quad-label">WHAT WAS OBSERVED</span>
                    </div>
                    <p className="detail-quad-text">{sig.description}</p>
                  </div>

                  {/* 2. Why it matters */}
                  <div className="detail-quad-col">
                    <div className="quad-label-row">
                      <span className="quad-indicator-dot quad-dot--action" />
                      <span className="detail-quad-label">DEFENSIVE IMPLICATION</span>
                    </div>
                    <p className="detail-quad-text">
                      Publicly observable configuration or software signature reveals technology stack characteristics.
                    </p>
                  </div>
                </div>

                <div className="finding-card-bottom-row">
                  <div className="finding-meta-item">
                    <span className="finding-meta-label">CONFIDENCE:</span>
                    <div className="confidence-meter-mini">
                      <div className="confidence-meter-track">
                        <div
                          className="confidence-meter-fill"
                          style={{ width: `${Math.round(sig.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="finding-meta-val">{(sig.confidence * 100).toFixed(0)}% verified</span>
                    </div>
                  </div>

                  {sig.evidence_id && (
                    <div className="finding-meta-item">
                      <span className="finding-meta-label">SUPPORTING EVIDENCE:</span>
                      <button
                        type="button"
                        className="finding-evidence-link"
                        onClick={() => navigate('/evidence')}
                        title="View supporting evidence artifact"
                      >
                        <span className="evidence-link-id">{sig.evidence_id.slice(0, 10)}...</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
