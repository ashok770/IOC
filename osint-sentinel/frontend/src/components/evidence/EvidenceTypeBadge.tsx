import React from 'react';

interface EvidenceTypeBadgeProps {
  type: string;
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  dns_record: { label: 'DNS Record', className: 'evidence-type-badge--dns' },
  rdap_registration: { label: 'RDAP Registration', className: 'evidence-type-badge--rdap' },
  http_headers: { label: 'HTTP Headers', className: 'evidence-type-badge--http' },
  certificate_hostnames: { label: 'Certificate Hostnames', className: 'evidence-type-badge--cert' },
  certificate_log_sample: { label: 'Certificate Log', className: 'evidence-type-badge--cert' },
};

export const EvidenceTypeBadge: React.FC<EvidenceTypeBadgeProps> = ({ type }) => {
  const normalized = (type || '').toLowerCase().trim();
  const config = TYPE_CONFIG[normalized];

  if (config) {
    return (
      <span className={`evidence-type-badge ${config.className}`}>
        {config.label}
      </span>
    );
  }

  // Safe fallback for unknown/future dynamic evidence types
  const fallbackLabel = normalized
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <span className="evidence-type-badge evidence-type-badge--other">
      {fallbackLabel || 'Unknown'}
    </span>
  );
};
