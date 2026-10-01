import React from 'react';
import { RiskAssessment } from '../../types';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';

interface ExposureAssessmentCardProps {
  risk: RiskAssessment | null;
  isLoading: boolean;
}

export const ExposureAssessmentCard: React.FC<ExposureAssessmentCardProps> = ({
  risk,
  isLoading,
}) => {
  const getRiskVariant = (level: string): StatusBadgeVariant => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  const scoreFormatted = risk !== null ? risk.overall_score.toFixed(1) : '--';
  const riskLevelFormatted = risk ? risk.risk_level.toUpperCase() : 'PENDING';

  return (
    <div className="exposure-score-card">
      <div className="score-card-header">
        <h2 className="score-card-title">External Exposure Assessment</h2>
        <div>
          <StatusBadge
            label={isLoading ? 'EVALUATING...' : riskLevelFormatted}
            variant={risk ? getRiskVariant(risk.risk_level) : 'neutral'}
          />
        </div>
      </div>

      <div className="score-metrics-block">
        <div className="score-display-row">
          <span className="score-value">{isLoading ? '...' : scoreFormatted}</span>
          <span className="score-max">/ 100</span>
        </div>
        <span className="score-priority-label">Investigation priority</span>
      </div>

      <p className="score-explanation">
        Internal deterministic assessment used to prioritize investigation. It is not a probability of compromise,
        vulnerability severity, CVSS score, or exploit likelihood.
      </p>
    </div>
  );
};
