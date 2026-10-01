import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const SettingsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="System Settings & Guardrails"
        subtitle="Operational parameters, assessment constraints, and API configurations."
        badge={<StatusBadge label="SYSTEM" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="OPERATIONAL POLICY" variant="violet" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Authorized External Security Exposure Guardrails
        </h2>
        <p className="placeholder-desc">
          OSINT Sentinel operates strictly in passive assessment mode. All intelligence collection
          is performed via public, non-intrusive DNS, RDAP, certificate transparency, and HTTP metadata queries.
        </p>

        <div className="placeholder-meta-grid">
          <div className="placeholder-meta-item">
            <span className="placeholder-meta-label">Assessment Policy</span>
            <span className="placeholder-meta-value">Authorized Perimeter Scoping Only</span>
          </div>
          <div className="placeholder-meta-item">
            <span className="placeholder-meta-label">Execution Guardrail</span>
            <span className="placeholder-meta-value">Non-Intrusive / Zero Exploitation</span>
          </div>
          <div className="placeholder-meta-item">
            <span className="placeholder-meta-label">Data Provenance</span>
            <span className="placeholder-meta-value">Deterministic / 100% Evidenced</span>
          </div>
          <div className="placeholder-meta-item">
            <span className="placeholder-meta-label">API Version</span>
            <span className="placeholder-meta-value">v0.1.0</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
