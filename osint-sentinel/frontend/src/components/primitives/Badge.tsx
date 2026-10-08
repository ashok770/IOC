import React from 'react';
import './badge.css';

export type StatusType = 'success' | 'attention' | 'warning' | 'critical' | 'neutral' | 'intelligence';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  showDot = true,
  className = '',
  id,
}) => {
  return (
    <span id={id} className={`ds-badge ds-badge-${status} ${className}`.trim()}>
      {showDot && <span className="ds-badge-dot" />}
      <span>{children}</span>
    </span>
  );
};

export const PillBadge: React.FC<StatusBadgeProps> = (props) => (
  <StatusBadge {...props} />
);

interface TechnicalTagProps {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
  id?: string;
}

export const TechnicalTag: React.FC<TechnicalTagProps> = ({
  children,
  dark = false,
  className = '',
  id,
}) => {
  return (
    <code id={id} className={`ds-tech-tag ${dark ? 'ds-tech-tag-dark' : ''} ${className}`.trim()}>
      {children}
    </code>
  );
};
