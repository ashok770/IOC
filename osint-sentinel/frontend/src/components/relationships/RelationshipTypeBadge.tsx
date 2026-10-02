import React from 'react';

interface RelationshipTypeBadgeProps {
  type: string;
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  resolves_to: { label: 'RESOLVES TO', className: 'rel-type-badge--resolves_to' },
  contains: { label: 'CONTAINS', className: 'rel-type-badge--contains' },
  references: { label: 'REFERENCES', className: 'rel-type-badge--references' },
  externally_referenced: { label: 'EXTERNALLY REFERENCED', className: 'rel-type-badge--externally_referenced' },
  technology_observed_on: { label: 'TECHNOLOGY OBSERVED ON', className: 'rel-type-badge--technology_observed_on' },
  supported_by: { label: 'SUPPORTED BY', className: 'rel-type-badge--supported_by' },
  certificate_associated_with: { label: 'CERTIFICATE ASSOCIATED WITH', className: 'rel-type-badge--certificate_associated_with' },
};

export const RelationshipTypeBadge: React.FC<RelationshipTypeBadgeProps> = ({ type }) => {
  const normalized = (type || '').toLowerCase().trim();
  const config = TYPE_CONFIG[normalized];

  if (config) {
    return (
      <span className={`rel-type-badge ${config.className}`}>
        {config.label}
      </span>
    );
  }

  // Graceful fallback for dynamic / unknown relationship types
  const fallbackLabel = normalized.replace(/_/g, ' ').toUpperCase();

  return (
    <span className="rel-type-badge rel-type-badge--other">
      {fallbackLabel || 'UNKNOWN'}
    </span>
  );
};
