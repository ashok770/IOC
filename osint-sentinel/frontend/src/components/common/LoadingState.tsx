import React from 'react';

interface LoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading assessment data...',
  message = 'Retrieving intelligence records from backend service.',
  className = '',
}) => {
  return (
    <div className={`state-box ${className}`} role="status" aria-live="polite">
      <div className="state-spinner" aria-hidden="true" />
      <div className="state-title">{title}</div>
      {message && <p className="state-message">{message}</p>}
    </div>
  );
};
