import React, { useState, useEffect } from 'react';
import { Target } from '../../types';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { useTarget } from '../../context/TargetContext';

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
  const { openCreateModal } = useTarget();
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    setJustCompleted(false);
  }, [target.id]);

  const handleRun = async () => {
    setJustCompleted(false);
    await onRunAssessment();
    setJustCompleted(true);
  };

  const getStatusVariant = (status: string): StatusBadgeVariant => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'cyan';
      case 'partial':
        return 'warning';
      case 'failed':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  const formattedDate = target.updated_at
    ? new Date(target.updated_at).toUTCString()
    : new Date(target.created_at).toUTCString();

  return (
    <header className="overview-target-header" aria-label="Target Assessment Overview">
      <div className="target-identity-block">
        <div className="target-scope-tag-row">
          <span className="target-scope-eyebrow">Security Intelligence Workspace</span>
          <span className="target-scope-sep">•</span>
          <span className="target-auth-label">Authorized External Reconnaissance</span>
          <span className="target-scope-sep">•</span>
          <span className="target-policy-pill">Zero Exploitation / Read-Only</span>
        </div>

        <div className="target-title-row">
          <div className="target-domain-wrapper">
            <span className="target-security-shield-icon" aria-hidden="true">🛡️</span>
            <h1 className="target-domain-title">{target.primary_domain}</h1>
          </div>
          <StatusBadge
            label={target.assessment_status}
            variant={getStatusVariant(target.assessment_status)}
          />
        </div>

        <div className="target-meta-row">
          {target.name && (
            <>
              <span className="target-org-name">{target.name}</span>
              <span className="target-meta-sep">•</span>
            </>
          )}
          <span className="target-timestamp">Last assessed: {formattedDate}</span>
          <span className="target-meta-sep">•</span>
          <span className="target-id-chip">Target ID: {target.id.slice(0, 8)}...</span>
        </div>
      </div>

      <div className="target-actions-block">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleRun}
          disabled={isCollecting}
          title={
            justCompleted
              ? 'Assessment completed. Click to rerun passive collection'
              : 'Execute authorized passive external reconnaissance against target'
          }
        >
          {isCollecting ? (
            <>
              <span className="banner-spinner" aria-hidden="true" />
              <span>COLLECTING TELEMETRY...</span>
            </>
          ) : justCompleted ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>TELEMETRY UPDATED</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>RUN PASSIVE SCAN</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={openCreateModal}
          disabled={isCollecting}
        >
          <span>+ Add Scope Target</span>
        </button>
      </div>
    </header>
  );
};
