import React, { useState } from 'react';
import { Relationship, Asset, Technology } from '../../types';

interface RelationshipsSectionProps {
  relationships: Relationship[];
  assetMap: Map<string, Asset>;
  techMap: Map<string, Technology>;
  totalRelationshipCount: number;
}

const SAMPLE_LIMIT = 20;

/**
 * Established backend relationship vocabulary mapping:
 * - references -> "References"
 * - technology_observed_on -> "Technology Observed On"
 * - externally_referenced -> "Externally Referenced"
 * - supported_by -> "Supported By"
 * - contains -> "Contains"
 * - resolves_to -> "Resolves To"
 * - certificate_associated_with -> "Certificate Associated With"
 */
export const RELATIONSHIP_TYPE_DISPLAY: Record<string, string> = {
  references: 'References',
  technology_observed_on: 'Technology Observed On',
  externally_referenced: 'Externally Referenced',
  supported_by: 'Supported By',
  contains: 'Contains',
  resolves_to: 'Resolves To',
  certificate_associated_with: 'Certificate Associated With',
};

export const formatRelationshipType = (type: string): string => {
  const normalized = (type || '').toLowerCase().trim();
  if (RELATIONSHIP_TYPE_DISPLAY[normalized]) {
    return RELATIONSHIP_TYPE_DISPLAY[normalized];
  }
  return normalized
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const RelationshipsSection: React.FC<RelationshipsSectionProps> = ({
  relationships,
  assetMap,
  techMap,
  totalRelationshipCount,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  const displayedRelationships = showAll ? relationships : relationships.slice(0, SAMPLE_LIMIT);

  // Helper to resolve entity label
  const getEntityLabel = (type: string, id: string): string => {
    if (type === 'asset') {
      const a = assetMap.get(id);
      return a ? a.value : id.slice(0, 10);
    }
    if (type === 'technology') {
      const t = techMap.get(id);
      return t ? t.name : id.slice(0, 10);
    }
    return id;
  };

  return (
    <section className="report-section" id="asset-relationships">
      <div className="report-section-header">
        <span className="section-number">07</span>
        <h2 className="section-title">EXTERNAL ASSET RELATIONSHIPS</h2>
      </div>

      <p className="report-section-desc">
        Observed directed connections linking assets, external delegations, and technology components ({totalRelationshipCount} edges observed).
      </p>

      {relationships.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No observed relationships recorded for this assessment target.</p>
        </div>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>SOURCE ENTITY</th>
                <th style={{ width: '26%' }}>RELATIONSHIP TYPE</th>
                <th style={{ width: '32%' }}>TARGET REFERENCE</th>
                <th style={{ width: '10%' }}>CONFIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {displayedRelationships.map((rel) => {
                const sourceLabel = getEntityLabel(rel.source_type, rel.source_id);
                const targetLabel = rel.target_type === 'asset' || rel.target_type === 'technology'
                  ? getEntityLabel(rel.target_type, rel.target_id_reference)
                  : rel.target_id_reference;

                return (
                  <tr key={rel.id}>
                    <td>
                      <div className="rel-entity-cell">
                        <span className="monospace font-bold" title={sourceLabel}>
                          {sourceLabel}
                        </span>
                        <span className="rel-entity-sub">{rel.source_type}</span>
                      </div>
                    </td>
                    <td>
                      <span className="report-rel-type-tag">
                        {formatRelationshipType(rel.relationship_type)}
                      </span>
                    </td>
                    <td>
                      <div className="rel-entity-cell">
                        <span className="monospace" title={targetLabel}>
                          {targetLabel}
                        </span>
                        <span className="rel-entity-sub">{rel.target_type}</span>
                      </div>
                    </td>
                    <td>
                      <span className="monospace">{(rel.confidence * 100).toFixed(0)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="report-table-truncation-note">
            <span>
              Showing {displayedRelationships.length} of {totalRelationshipCount} observed relationships.
              Full graph telemetry is available in <strong>Relationships</strong>.
            </span>
            {relationships.length > SAMPLE_LIMIT && (
              <button
                type="button"
                className="btn-toggle-inline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Sample (20)' : `Show All Loaded (${relationships.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
