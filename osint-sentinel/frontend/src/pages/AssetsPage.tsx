import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const AssetsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Asset Intelligence"
        subtitle="Catalog and classification of discovered external perimeter assets."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="CHECKPOINT 2" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Asset Inventory & Discovery
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in the next OSINT Sentinel development checkpoint.
          It will provide filterable perimeter asset inventories (primary domains, subdomains,
          resolved IP blocks, and certificate-associated hostnames) directly linked to verified evidence.
        </p>
      </div>
    </PageContainer>
  );
};
