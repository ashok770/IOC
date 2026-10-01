import React from 'react';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'high'
  | 'critical'
  | 'neutral'
  | 'cyan'
  | 'violet';

interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  className = '',
  showDot = true,
}) => {
  return (
    <span className={`status-badge status-badge--${variant} ${className}`}>
      {showDot && <span className="status-badge-dot" aria-hidden="true" />}
      {label}
    </span>
  );
};
