import React from 'react';
import { Target } from '../../types';
import '../../styles/overview.css';

interface AssessmentHeaderProps {
  target: Target;
  onRunAssessment: () => void;
  isCollecting: boolean;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  target,
  onRunAssessment,
  isCollecting,
}) => {
  const handleRun = async () => {
    await onRunAssessment();
  };

  const renderLastAssessed = () => {
    if (!target.updated_at && !target.created_at) return 'Unknown';
    const dateStr = target.updated_at || target.created_at;
    const date = new Date(dateStr);
    
    const formatted = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let relative = '';
    if (diffDays === 0) relative = '(today)';
    else if (diffDays === 1) relative = '(1 day ago)';
    else relative = `(${diffDays} days ago)`;

    const isStale = diffMs > 24 * 60 * 60 * 1000;

    return (
      <div className="last-assessed-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="header-meta" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Last assessed: {formatted} {relative}</span>
        {isStale && <span className="stale-badge" style={{ backgroundColor: 'var(--color-status-warning)', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Data may be stale</span>}
      </div>
    );
  };

  return (
    <div className="assessment-header-light" style={{ paddingBottom: '0' }}>
      <div className="header-main-flex" style={{ borderBottom: 'none', paddingBottom: 'var(--space-2)' }}>
        <div className="header-content-left">
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Overview</h1>
          <div className="header-subtitle-row">
            {renderLastAssessed()}
          </div>

          <div className="header-compact-metadata" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="metadata-pill" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>Authorized / Passive</span>
            <span className="metadata-pill" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>Zero Exploitation / Read-Only OSINT</span>
            <span className="metadata-pill" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>DNS &bull; RDAP &bull; CT &bull; HTTP</span>
          </div>
        </div>

        <div className="header-actions" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRun}
            disabled={isCollecting}
          >
            {isCollecting ? 'COLLECTING...' : 'Run passive scan'}
          </button>
        </div>
      </div>
    </div>
  );
};
