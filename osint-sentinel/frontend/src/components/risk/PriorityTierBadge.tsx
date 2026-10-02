import React from 'react';

export type PriorityTier = 'p1_urgent' | 'p2_high' | 'p3_medium' | 'p4_low' | string;

interface PriorityTierBadgeProps {
  tier: PriorityTier;
  className?: string;
  showIcon?: boolean;
}

export const PriorityTierBadge: React.FC<PriorityTierBadgeProps> = ({
  tier,
  className = '',
  showIcon = true,
}) => {
  const normalized = tier.toLowerCase();

  let label = 'P4 LOW';
  let badgeClass = 'risk-tier-p4';

  if (normalized === 'p1_urgent' || normalized === 'p1' || normalized === 'urgent') {
    label = 'P1 URGENT';
    badgeClass = 'risk-tier-p1';
  } else if (normalized === 'p2_high' || normalized === 'p2' || normalized === 'high') {
    label = 'P2 HIGH';
    badgeClass = 'risk-tier-p2';
  } else if (normalized === 'p3_medium' || normalized === 'p3' || normalized === 'medium') {
    label = 'P3 MEDIUM';
    badgeClass = 'risk-tier-p3';
  } else if (normalized === 'p4_low' || normalized === 'p4' || normalized === 'low') {
    label = 'P4 LOW';
    badgeClass = 'risk-tier-p4';
  }

  return (
    <span className={`risk-tier-badge ${badgeClass} ${className}`}>
      {showIcon && <span className="risk-tier-dot" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
