import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const RiskPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Risk Assessment & Prioritization"
        subtitle="Deterministic external exposure scoring and analyst triage queues."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Deterministic Exposure Scoring & Asset Prioritization
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will provide explainable
          0–100 exposure scoring, category breakdowns, prioritized asset triage (P1 Urgent to P4 Low),
          and concrete remediation recommendations with zero CVE speculation or CVSS inflation.
        </p>
      </div>
    </PageContainer>
  );
};
