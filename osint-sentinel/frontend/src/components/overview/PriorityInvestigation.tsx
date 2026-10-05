import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal } from '../../types';

interface PriorityInvestigationProps {
  signals: ExposureSignal[];
}

export const PriorityInvestigation: React.FC<PriorityInvestigationProps> = ({ signals }) => {
  const navigate = useNavigate();

  if (signals.length === 0) {
    return (
      <div className="overview-card priority-investigation-card">
        <h3 className="card-title">Priority Investigation</h3>
        <p className="card-empty-text">No prioritized exposure signals identified.</p>
      </div>
    );
  }

  // Display top 3 signals by severity
  const sorted = [...signals].sort((a, b) => {
    const severities: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    const sevA = severities[a.severity.toLowerCase()] ?? 0;
    const sevB = severities[b.severity.toLowerCase()] ?? 0;
    return sevB - sevA;
  });
  
  const displaySignals = sorted.slice(0, 3);

  return (
    <div className="overview-card priority-investigation-card">
      <h3 className="card-title">Priority Investigation</h3>
      <div className="investigation-list">
        {displaySignals.map(sig => (
          <div key={sig.id} className="investigation-row" onClick={() => navigate('/exposure')}>
            <div className="investigation-header">
              <span className={`investigation-severity sev-${sig.severity}`}>{sig.severity.toUpperCase()}</span>
              <span className="investigation-type">{sig.signal_type.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div className="investigation-body">
              <h4 className="investigation-title">{sig.title}</h4>
              <p className="investigation-desc">{sig.description}</p>
            </div>
            <div className="investigation-footer">
              <span className="investigation-meta">Confidence: {Math.round(sig.confidence * 100)}%</span>
              <span className="investigation-meta">Evidence: {sig.evidence_id ? '1 artifact' : '0 artifacts'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
