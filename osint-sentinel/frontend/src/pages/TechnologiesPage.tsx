import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const TechnologiesPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Technology Intelligence"
        subtitle="Deterministic identification of web servers, frameworks, CMSs, and edge infrastructure."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Modular Technology Detection Layer
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will catalog observable
          technologies across discovered perimeter assets with strict version extraction rules
          and confidence metrics based exclusively on verified HTTP headers and HTML markers.
        </p>
      </div>
    </PageContainer>
  );
};
