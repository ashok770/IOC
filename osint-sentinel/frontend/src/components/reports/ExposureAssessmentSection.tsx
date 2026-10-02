import React from 'react';
import { RiskAssessment } from '../../types';
import { AssessmentLevelBadge } from '../risk/AssessmentLevelBadge';

interface ExposureAssessmentSectionProps {
  riskAssessment: RiskAssessment | null;
}

const FACTOR_MAX_SCORES: Record<string, number> = {
  perimeter_exposure: 35.0,
  email_defense_posture: 30.0,
  technology_disclosure: 20.0,
  external_dependencies: 8.0,
};

const FACTOR_TITLES: Record<string, string> = {
  perimeter_exposure: 'Perimeter Exposure',
  email_defense_posture: 'Email Defenses',
  technology_disclosure: 'Technology Stack',
  external_dependencies: 'External Dependencies',
};

export const ExposureAssessmentSection: React.FC<ExposureAssessmentSectionProps> = ({
  riskAssessment,
}) => {
  if (!riskAssessment) {
    return (
      <section className="report-section" id="exposure-assessment">
        <div className="report-section-header">
          <span className="section-number">08</span>
          <h2 className="section-title">EXTERNAL EXPOSURE ASSESSMENT</h2>
        </div>
        <div className="report-empty-block">
          <p className="report-empty-text">No risk assessment evaluated for this target scope.</p>
        </div>
      </section>
    );
  }

  const factors = riskAssessment.factors_breakdown || {};
  const factorKeys = Object.keys(factors);

  return (
    <section className="report-section" id="exposure-assessment">
      <div className="report-section-header">
        <span className="section-number">08</span>
        <h2 className="section-title">EXTERNAL EXPOSURE ASSESSMENT</h2>
      </div>

      {/* Primary Score Row */}
      <div className="report-risk-overview-card">
        <div className="risk-overview-main">
          <span className="risk-overview-eyebrow">EXTERNAL EXPOSURE ASSESSMENT</span>
          <div className="risk-overview-score-group">
            <span className="risk-overview-score monospace">
              {riskAssessment.overall_score.toFixed(1)}
            </span>
            <span className="risk-overview-max monospace">/ 100</span>
          </div>
          <span className="risk-overview-priority-label">INVESTIGATION PRIORITY</span>
        </div>

        <div className="risk-overview-level-block">
          <span className="overview-level-title">HEURISTIC TIER</span>
          <AssessmentLevelBadge level={riskAssessment.risk_level} size="lg" />
          <span className="overview-level-note">
            Defensive triage categorization
          </span>
        </div>
      </div>

      {/* Factor Breakdown */}
      <h3 className="report-subsection-title">FACTOR BREAKDOWN</h3>
      <div className="report-factors-grid">
        {factorKeys.map((key) => {
          const score = factors[key] ?? 0;
          const maxScore = FACTOR_MAX_SCORES[key] || 25.0;
          const title = FACTOR_TITLES[key] || key.replace(/_/g, ' ').toUpperCase();
          const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

          return (
            <div key={key} className="report-factor-item">
              <div className="report-factor-header">
                <span className="factor-name">{title}</span>
                <span className="factor-score monospace">
                  {score.toFixed(1)} / {maxScore.toFixed(0)}
                </span>
              </div>
              <div className="report-factor-bar">
                <div
                  className={`report-factor-fill ${
                    score > 0 ? 'fill-active' : 'fill-zero'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="factor-status-sub">
                {score > 0
                  ? `Observed exposure factor (+${score.toFixed(1)} pts)`
                  : 'No exposure factor observed (0.0 pts)'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Score Disclaimer */}
      <div className="report-disclaimer-card">
        <svg
          className="disclaimer-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" cy="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="disclaimer-text">
          <strong>Score Semantics & Governance:</strong> Investigation priority score derived from observed
          external exposure factors. This score is not a probability of compromise, exploit likelihood, CVSS score,
          or security guarantee. Assessment levels and weighting are internal project heuristics for analyst
          prioritization and do not represent universal industry standards.
        </p>
      </div>
    </section>
  );
};
