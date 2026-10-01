import React from 'react';

export const AssessmentIntegrityCard: React.FC = () => {
  return (
    <div className="assessment-policy-banner">
      <div className="policy-item">
        <span className="policy-label">Assessment Mode</span>
        <span className="policy-value">Authorized / Passive</span>
      </div>

      <div className="policy-item">
        <span className="policy-label">Data Sources</span>
        <span className="policy-value">DNS • RDAP • Certificate Transparency • HTTP metadata / headers</span>
      </div>

      <div className="policy-item">
        <span className="policy-label">Execution Policy</span>
        <span className="policy-value">Non-Intrusive / Zero Exploitation</span>
      </div>

      <div className="policy-item">
        <span className="policy-label">Provenance</span>
        <span className="policy-value">Deterministic / Evidenced</span>
      </div>
    </div>
  );
};
