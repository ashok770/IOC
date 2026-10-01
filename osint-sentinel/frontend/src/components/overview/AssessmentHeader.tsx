import React from 'react';
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
  const [justCompleted, setJustCompleted] = React.useState(false);

  React.useEffect(() => {
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
    <div className="assessment-context-card">
      <div className="assessment-meta">
        <span className="assessment-scope-tag">External Security Assessment</span>
        <div className="assessment-target-title">
          <span>{target.primary_domain}</span>
          <StatusBadge
            label={target.assessment_status}
            variant={getStatusVariant(target.assessment_status)}
          />
        </div>
        {target.name && <span className="assessment-target-org">{target.name}</span>}
        <div className="assessment-submeta-row">
          <span>Target ID: {target.id}</span>
          <span>•</span>
          <span>Last assessed: {formattedDate}</span>
        </div>
      </div>

      <div className="assessment-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={handleRun}
          disabled={isCollecting}
          title={
            justCompleted
              ? 'Assessment completed. Click to run passive collection again'
              : 'Run passive intelligence collection against target domain'
          }
        >
          {isCollecting ? (
            <>
              <span className="banner-spinner" aria-hidden="true" />
              <span>COLLECTING INTELLIGENCE...</span>
            </>
          ) : justCompleted ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>ASSESSMENT COMPLETED</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>RUN PASSIVE ASSESSMENT</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={openCreateModal}
          disabled={isCollecting}
        >
          + New Assessment
        </button>
      </div>
    </div>
  );
};
