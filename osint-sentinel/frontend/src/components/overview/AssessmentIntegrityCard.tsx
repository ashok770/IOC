import React from 'react';

export const AssessmentIntegrityCard: React.FC = () => {
  return (
    <footer className="methodology-provenance-strip" aria-label="Methodology and Provenance Parameters">
      <div className="provenance-item">
        <div className="provenance-item-header">
          <span className="provenance-icon" aria-hidden="true">🔒</span>
          <span className="provenance-label">Assessment Mode</span>
        </div>
        <span className="provenance-val">Authorized / Passive (Non-Intrusive)</span>
      </div>

      <div className="provenance-sep" aria-hidden="true" />

      <div className="provenance-item">
        <div className="provenance-item-header">
          <span className="provenance-icon" aria-hidden="true">📡</span>
          <span className="provenance-label">Data Sources</span>
        </div>
        <span className="provenance-val">DNS • RDAP • Certificate Transparency • HTTP Headers</span>
      </div>

      <div className="provenance-sep" aria-hidden="true" />

      <div className="provenance-item">
        <div className="provenance-item-header">
          <span className="provenance-icon" aria-hidden="true">🛡️</span>
          <span className="provenance-label">Execution Policy</span>
        </div>
        <span className="provenance-val">Zero Exploitation / Read-Only OSINT</span>
      </div>

      <div className="provenance-sep" aria-hidden="true" />

      <div className="provenance-item">
        <div className="provenance-item-header">
          <span className="provenance-icon" aria-hidden="true">⚖️</span>
          <span className="provenance-label">Provenance</span>
        </div>
        <span className="provenance-val">Deterministic / Evidenced Telemetry</span>
      </div>
    </footer>
  );
};
