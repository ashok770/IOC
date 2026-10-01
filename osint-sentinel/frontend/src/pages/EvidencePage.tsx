import React from 'react';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';

export const EvidencePage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Evidence & Provenance"
        subtitle="Immutable raw audit records, timestamps, and public collection artifacts."
        badge={<StatusBadge label="PLANNED MODULE" variant="neutral" />}
      />

      <div className="placeholder-card">
        <StatusBadge label="FUTURE CHECKPOINT" variant="cyan" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Raw Evidence & Audit Trail Explorer
        </h2>
        <p className="placeholder-desc">
          This module will be implemented in a future checkpoint. It will provide raw JSON inspection,
          collector source provenance (DNS, RDAP, crt.sh, HTTP headers), and complete evidentiary
          lineage for all findings.
        </p>
      </div>
    </PageContainer>
  );
};
