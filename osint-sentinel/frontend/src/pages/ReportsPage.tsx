import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const ReportsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Assessment Reports"
        subtitle="Downloadable executive exposure summaries and technical audit logs."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Executive Reporting & Assessment Export
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will generate structured,
          auditable assessment summaries suitable for defensive security leaders and compliance reviews.
        </p>
      </div>
    </PageContainer>
  );
};
