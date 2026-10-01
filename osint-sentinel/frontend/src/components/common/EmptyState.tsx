import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No assessment data available',
  message = 'There are no intelligence records matching the selected target or filter criteria.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`state-box ${className}`}>
      <svg
        className="state-icon--empty"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <div className="state-title">{title}</div>
      {message && <p className="state-message">{message}</p>}
      {actionText && onAction && (
        <button type="button" className="state-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
