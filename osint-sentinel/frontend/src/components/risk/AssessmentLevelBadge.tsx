import React from 'react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | string;

interface AssessmentLevelBadgeProps {
  level: RiskLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AssessmentLevelBadge: React.FC<AssessmentLevelBadgeProps> = ({
  level,
  className = '',
  size = 'md',
}) => {
  const normalized = level.toLowerCase();

  let label = 'LOW';
  let badgeClass = 'risk-level-low';

  if (normalized === 'critical') {
    label = 'CRITICAL';
    badgeClass = 'risk-level-critical';
  } else if (normalized === 'high') {
    label = 'HIGH';
    badgeClass = 'risk-level-high';
  } else if (normalized === 'medium') {
    label = 'MEDIUM';
    badgeClass = 'risk-level-medium';
  } else {
    label = 'LOW';
    badgeClass = 'risk-level-low';
  }

  return (
    <span className={`risk-level-badge ${badgeClass} risk-level-${size} ${className}`}>
      <span className="risk-level-indicator" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
