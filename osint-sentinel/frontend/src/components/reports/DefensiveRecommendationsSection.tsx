import React from 'react';
import { RiskRecommendation } from '../../types';
import { PriorityTierBadge } from '../risk/PriorityTierBadge';

interface DefensiveRecommendationsSectionProps {
  recommendations: RiskRecommendation[];
}

export const DefensiveRecommendationsSection: React.FC<DefensiveRecommendationsSectionProps> = ({
  recommendations,
}) => {
  return (
    <section className="report-section" id="defensive-recommendations">
      <div className="report-section-header">
        <span className="section-number">10</span>
        <h2 className="section-title">DEFENSIVE RECOMMENDATIONS</h2>
      </div>

      <p className="report-section-desc">
        Deterministic, actionable remediation and audit guidance derived directly from observed perimeter configurations.
      </p>

      {recommendations.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">
            No additional prioritized defensive recommendations were generated from the current assessment.
          </p>
        </div>
      ) : (
        <div className="report-recommendations-list">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="report-rec-card">
              <div className="report-rec-header">
                <div className="rec-title-group">
                  <PriorityTierBadge tier={rec.priority} />
                  <h3 className="rec-title">{rec.title}</h3>
                </div>
                <span className="rec-category-badge">{rec.category}</span>
              </div>

              <div className="report-rec-body">
                <div className="rec-grid-row">
                  <span className="rec-label">ACTION:</span>
                  <span className="rec-val font-bold">{rec.action}</span>
                </div>
                <div className="rec-grid-row">
                  <span className="rec-label">RATIONALE:</span>
                  <span className="rec-val text-muted">{rec.rationale}</span>
                </div>
                {rec.recommended_investigation && (
                  <div className="rec-grid-row">
                    <span className="rec-label">GUIDANCE:</span>
                    <span className="rec-val highlight-cyan">{rec.recommended_investigation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
