import React from 'react';

export const MethodologySummary: React.FC = () => {
  return (
    <div className="overview-card methodology-summary-card compact-card" style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
      <div className="methodology-compact-grid" style={{ marginTop: 'var(--space-2)' }}>
        <div className="methodology-compact-item">
          <span className="methodology-compact-icon">🌐</span>
          <div className="methodology-compact-content">
            <h4>Public Data Collection</h4>
            <p>Gathering intelligence from DNS, RDAP, CT logs, and passive HTTP.</p>
          </div>
        </div>
        <div className="methodology-compact-item">
          <span className="methodology-compact-icon">🛡️</span>
          <div className="methodology-compact-content">
            <h4>Non-Intrusive Analysis</h4>
            <p>Zero active exploitation or intrusive vulnerability scanning.</p>
          </div>
        </div>
        <div className="methodology-compact-item">
          <span className="methodology-compact-icon">🔗</span>
          <div className="methodology-compact-content">
            <h4>Evidence Correlation</h4>
            <p>Mapping relationships between discovered external assets.</p>
          </div>
        </div>
        <div className="methodology-compact-item">
          <span className="methodology-compact-icon">📊</span>
          <div className="methodology-compact-content">
            <h4>Risk Assessment</h4>
            <p>Evaluating external exposure drivers and defensive posture.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
