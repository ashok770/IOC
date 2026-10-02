import React from 'react';
import { AssessmentLevelBadge } from './AssessmentLevelBadge';

interface ExposureScoreCardProps {
  score: number;
  level: string;
  targetDomain: string;
  assessmentDate?: string;
}

export const ExposureScoreCard: React.FC<ExposureScoreCardProps> = ({
  score,
  level,
  targetDomain,
  assessmentDate,
}) => {
  // Clamp score for scale position (0 to 100)
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="risk-score-card">
      <div className="risk-score-header">
        <div className="risk-score-headline-group">
          <span className="risk-score-eyebrow">EXTERNAL EXPOSURE ASSESSMENT</span>
          <h2 className="risk-score-title">Investigation Priority Assessment</h2>
          <span className="risk-score-target">TARGET: {targetDomain}</span>
        </div>
        <div className="risk-score-level-group">
          <span className="risk-level-label">ASSESSMENT LEVEL</span>
          <AssessmentLevelBadge level={level} size="lg" />
        </div>
      </div>

      <div className="risk-score-body">
        {/* Primary Numerical Display */}
        <div className="risk-score-value-block">
          <div className="risk-score-number-row">
            <span className="risk-score-number">{score.toFixed(1)}</span>
            <span className="risk-score-max">/ 100</span>
          </div>
          <span className="risk-score-descriptor">INVESTIGATION PRIORITY</span>
          <p className="risk-score-caption">
            Evidence-backed exposure weighting based on observed public infrastructure and defenses.
          </p>
        </div>

        {/* Horizontal Segmented Scale */}
        <div className="risk-scale-container">
          <div className="risk-scale-header">
            <span className="risk-scale-title">HEURISTIC EXPOSURE SCALE</span>
            <span className="risk-scale-current-indicator">
              POSITION: <strong>{score.toFixed(1)}</strong> / 100
            </span>
          </div>

          <div className="risk-scale-track-wrapper">
            <div className="risk-scale-segments">
              <div className={`risk-scale-segment seg-low ${clampedScore <= 24.9 ? 'active' : ''}`}>
                <span className="seg-label">LOW</span>
                <span className="seg-range">0.0 – 24.9</span>
              </div>
              <div className={`risk-scale-segment seg-med ${clampedScore >= 25.0 && clampedScore <= 49.9 ? 'active' : ''}`}>
                <span className="seg-label">MEDIUM</span>
                <span className="seg-range">25.0 – 49.9</span>
              </div>
              <div className={`risk-scale-segment seg-high ${clampedScore >= 50.0 && clampedScore <= 74.9 ? 'active' : ''}`}>
                <span className="seg-label">HIGH</span>
                <span className="seg-range">50.0 – 74.9</span>
              </div>
              <div className={`risk-scale-segment seg-crit ${clampedScore >= 75.0 ? 'active' : ''}`}>
                <span className="seg-label">CRITICAL</span>
                <span className="seg-range">75.0 – 100.0</span>
              </div>
            </div>

            {/* Score Position Marker */}
            <div
              className="risk-scale-marker"
              style={{ left: `${clampedScore}%` }}
              title={`Current score: ${score.toFixed(1)}`}
            >
              <div className="risk-marker-pin" />
              <div className="risk-marker-badge">{score.toFixed(1)}</div>
            </div>
          </div>

          <div className="risk-scale-ticks">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Score Semantics Disclaimer */}
      <div className="risk-semantics-banner">
        <svg
          className="risk-semantics-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="risk-semantics-text">
          <strong>Score Semantics:</strong> Investigation priority score derived from observed
          external exposure factors. This score is not a probability of compromise, exploit
          likelihood, CVSS score, or security guarantee. Internal project heuristics are designed
          for defensive triage and do not constitute universal industry standards.
          {assessmentDate && (
            <span className="risk-semantics-date">
              {' '}Evaluated: {new Date(assessmentDate).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
