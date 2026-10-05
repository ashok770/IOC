import React from 'react';
import { Target } from '../../types';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
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

  const getStatusVariant = (status: string): StatusBadgeVariant => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in_progress': return 'cyan';
      case 'partial': return 'warning';
      case 'failed': return 'critical';
      default: return 'neutral';
    }
  };

  const formattedDate = target.updated_at
    ? new Date(target.updated_at).toUTCString()
    : new Date(target.created_at).toUTCString();

  return (
    <div className="assessment-header-light">
      <div className="header-eyebrow-row">
        <span className="header-eyebrow">EXTERNAL EXPOSURE ASSESSMENT</span>
      </div>
      
      <div className="header-title-row">
        <h1 className="header-domain monospace">{target.primary_domain}</h1>
        <StatusBadge
          label={target.assessment_status}
          variant={getStatusVariant(target.assessment_status)}
        />
      </div>
      
      <div className="header-subtitle-row">
        {target.name && <span className="header-org">{target.name} &bull;</span>}
        <span className="header-meta">Last assessed: {formattedDate}</span>
      </div>
      <div className="header-id-row">
        <span className="header-meta monospace">Target ID: {target.id}</span>
      </div>
      
      <div className="header-details-grid">
        <div className="header-detail-item">
          <div className="detail-label">Assessment Mode</div>
          <div className="detail-value">Authorized / Passive</div>
        </div>
        <div className="header-detail-item">
          <div className="detail-label">Execution Policy</div>
          <div className="detail-value">Zero Exploitation / Read-Only OSINT</div>
        </div>
        <div className="header-detail-item">
          <div className="detail-label">Data Sources</div>
          <div className="detail-value">DNS &bull; RDAP &bull; CT &bull; HTTP</div>
        </div>
        
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={handleRun}
            disabled={isCollecting}
          >
            {isCollecting ? 'COLLECTING...' : 'RUN PASSIVE SCAN'}
          </button>
        </div>
      </div>
    </div>
  );
};
