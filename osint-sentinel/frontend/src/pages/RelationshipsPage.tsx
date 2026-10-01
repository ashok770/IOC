import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const RelationshipsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Semantic Relationships"
        subtitle="Directed graph topology linking targets, assets, and external infrastructure."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Semantic Attack Surface Graph
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will visualize verified directed
          relationships (resolves_to, supported_by, contains, certificate_associated_with) between
          assets without making unevidenced ownership assertions.
        </p>
      </div>
    </PageContainer>
  );
};
