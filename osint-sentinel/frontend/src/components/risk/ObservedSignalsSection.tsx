import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal, RiskRecommendation, Asset } from '../../types';
import { PriorityTierBadge } from './PriorityTierBadge';

interface ObservedSignalsSectionProps {
  signals: ExposureSignal[];
  recommendations: RiskRecommendation[];
  assetMap: Map<string, Asset>;
}

export const ObservedSignalsSection: React.FC<ObservedSignalsSectionProps> = ({
  signals,
  recommendations,
  assetMap,
}) => {
  const navigate = useNavigate();

  return (
    <div className="risk-signals-section">
      {/* Recommendations if returned by backend */}
      {recommendations.length > 0 && (
        <div className="risk-recommendations-block">
          <div className="risk-section-header">
            <div>
              <h3 className="risk-section-title">INVESTIGATION RECOMMENDATIONS</h3>
              <p className="risk-section-subtitle">
                Deterministic remediation and analyst triage guidance derived from observed exposure factors.
              </p>
            </div>
          </div>

          <div className="risk-recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="risk-rec-card">
                <div className="risk-rec-header">
                  <div className="risk-rec-title-group">
                    <PriorityTierBadge tier={rec.priority} />
                    <span className="risk-rec-title">{rec.title}</span>
                  </div>
                  <span className="risk-rec-category">{rec.category}</span>
                </div>

                <div className="risk-rec-body">
                  <div className="risk-rec-row">
                    <span className="rec-row-label">RECOMMENDED ACTION</span>
                    <span className="rec-row-value">{rec.action}</span>
                  </div>
                  <div className="risk-rec-row">
                    <span className="rec-row-label">TECHNICAL RATIONALE</span>
                    <span className="rec-row-value text-muted">{rec.rationale}</span>
                  </div>
                  {rec.recommended_investigation && (
                    <div className="risk-rec-row">
                      <span className="rec-row-label">INVESTIGATION GUIDANCE</span>
                      <span className="rec-row-value highlight-cyan">
                        {rec.recommended_investigation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observed Exposure Signals */}
      <div className="risk-exposure-signals-block">
        <div className="risk-section-header">
          <div>
            <h3 className="risk-section-title">OBSERVED EXPOSURE SIGNALS</h3>
            <p className="risk-section-subtitle">
              Publicly observable exposure indicators contributing to perimeter weighting.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/exposure')}
          >
            OPEN EXPOSURE INTELLIGENCE →
          </button>
        </div>

        {signals.length === 0 ? (
          <div className="risk-signals-empty">
            <svg
              className="risk-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <p className="risk-empty-text">
              No active exposure signals (remote access portals, pre-production hostnames) observed
              for this target scope.
            </p>
          </div>
        ) : (
          <div className="risk-signals-grid">
            {signals.map((sig) => {
              const asset = sig.asset_id ? assetMap.get(sig.asset_id) : null;
              const assetLabel = asset ? asset.value : sig.asset_id || 'Target Scope';

              return (
                <div key={sig.id} className="risk-signal-card">
                  <div className="risk-signal-header">
                    <span className="risk-signal-type-badge">{sig.signal_type}</span>
                    <span className="risk-signal-confidence">
                      CONF: {(sig.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h4 className="risk-signal-title">{sig.title}</h4>
                  <p className="risk-signal-description">{sig.description}</p>

                  <div className="risk-signal-footer">
                    <div className="risk-signal-asset">
                      <span className="signal-asset-label">ASSET:</span>
                      <span className="signal-asset-val monospace">{assetLabel}</span>
                    </div>

                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => navigate('/exposure')}
                    >
                      Investigate Signal →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
