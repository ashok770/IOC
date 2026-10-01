import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const ExposurePage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Exposure Signals"
        subtitle="Factual security-relevant observations and configuration indicators."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Exposure Signals & Attack Surface Telemetry
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will provide explainable
          detection of remote-access entrypoints, development/staging environments, and external
          dependencies with direct evidence links and zero speculative vulnerability scores.
        </p>
      </div>
    </PageContainer>
  );
};
