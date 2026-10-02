import React from 'react';
import { Relationship, Asset, Technology } from '../../types';
import { RelationshipTypeBadge } from './RelationshipTypeBadge';

export interface ScopeInfo {
  label: 'Target Scope' | 'External Reference' | 'Technology Observation' | 'Evidence Provenance';
  variant: 'target' | 'external' | 'tech' | 'evidence';
}

export const getRelationshipScope = (rel: Relationship): ScopeInfo => {
  const extra = (rel.extra_data || {}) as Record<string, unknown>;

  if (
    rel.target_type === 'external_entity' ||
    rel.relationship_type === 'externally_referenced' ||
    extra.target_owned === false
  ) {
    return { label: 'External Reference', variant: 'external' };
  }

  if (rel.target_type === 'technology' || rel.relationship_type === 'technology_observed_on') {
    return { label: 'Technology Observation', variant: 'tech' };
  }

  if (rel.target_type === 'evidence' || rel.relationship_type === 'supported_by') {
    return { label: 'Evidence Provenance', variant: 'evidence' };
  }

  return { label: 'Target Scope', variant: 'target' };
};

export const resolveEntityLabel = (
  entityType: string,
  entityId: string,
  targetDomain: string,
  assetMap: Map<string, Asset>,
  techMap: Map<string, Technology>,
  extraData?: Record<string, unknown> | null
): { name: string; type: string } => {
  const extra = extraData || {};

  if (entityType === 'target') {
    return { name: targetDomain, type: 'target' };
  }

  if (entityType === 'asset') {
    const asset = assetMap.get(entityId);
    if (asset) {
      return { name: asset.value, type: asset.asset_type.replace(/_/g, ' ') };
    }
    if (extra.asset_value && typeof extra.asset_value === 'string') {
      return { name: extra.asset_value, type: (extra.asset_type as string) || 'asset' };
    }
    if (extra.ip && typeof extra.ip === 'string') {
      return { name: extra.ip, type: (extra.record_type as string) || 'ip' };
    }
    return { name: entityId.slice(0, 8) + '...', type: 'asset' };
  }

  if (entityType === 'technology') {
    const tech = techMap.get(entityId);
    if (tech) {
      return { name: tech.name, type: tech.category.replace(/_/g, ' ') };
    }
    if (extra.technology_name && typeof extra.technology_name === 'string') {
      return { name: extra.technology_name, type: (extra.category as string) || 'technology' };
    }
    return { name: entityId.slice(0, 8) + '...', type: 'technology' };
  }

  if (entityType === 'external_entity') {
    return { name: entityId, type: (extra.role as string) || 'external entity' };
  }

  if (entityType === 'evidence') {
    return { name: `Evidence (${entityId.slice(0, 8)}...)`, type: 'evidence' };
  }

  return { name: entityId, type: entityType };
};

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 5) + ' UTC';
  } catch {
    return isoStr;
  }
};

interface RelationshipRowProps {
  rel: Relationship;
  targetDomain: string;
  assetMap: Map<string, Asset>;
  techMap: Map<string, Technology>;
  isSelected: boolean;
  onSelect: (rel: Relationship) => void;
}

export const RelationshipRow: React.FC<RelationshipRowProps> = ({
  rel,
  targetDomain,
  assetMap,
  techMap,
  isSelected,
  onSelect,
}) => {
  const sourceInfo = resolveEntityLabel(
    rel.source_type,
    rel.source_id,
    targetDomain,
    assetMap,
    techMap,
    rel.extra_data
  );

  const targetInfo = resolveEntityLabel(
    rel.target_type,
    rel.target_id_reference,
    targetDomain,
    assetMap,
    techMap,
    rel.extra_data
  );

  const scope = getRelationshipScope(rel);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(rel);
    }
  };

  return (
    <tr
      className={`relationship-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(rel)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
    >
      {/* Source Entity */}
      <td>
        <div className="rel-entity-cell">
          <span className="rel-entity-text" title={sourceInfo.name}>
            {sourceInfo.name}
          </span>
          <span className="rel-entity-type-tag">{sourceInfo.type}</span>
        </div>
      </td>

      {/* Relationship Type */}
      <td>
        <RelationshipTypeBadge type={rel.relationship_type} />
      </td>

      {/* Target Entity */}
      <td>
        <div className="rel-entity-cell">
          <span className="rel-entity-text" title={targetInfo.name}>
            {targetInfo.name}
          </span>
          <span className="rel-entity-type-tag">{targetInfo.type}</span>
        </div>
      </td>

      {/* Scope Classification */}
      <td>
        <span className={`rel-scope-badge rel-scope-badge--${scope.variant}`}>
          {scope.label}
        </span>
      </td>

      {/* Confidence */}
      <td>
        <span
          className="rel-confidence-cell"
          title={`Observation Confidence: ${(rel.confidence * 100).toFixed(0)}% (Factual correlation)`}
        >
          {rel.confidence.toFixed(2)}
        </span>
      </td>

      {/* Supporting Evidence */}
      <td>
        <span className="rel-evidence-cell" title={rel.evidence_id || 'Direct correlation'}>
          {rel.evidence_id ? `${rel.evidence_id.slice(0, 8)}...` : '--'}
        </span>
      </td>

      {/* Observed At */}
      <td>
        <span className="rel-date-cell">{formatDate(rel.created_at)}</span>
      </td>
    </tr>
  );
};
