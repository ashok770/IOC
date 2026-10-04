import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Relationship, Asset, Technology } from '../../types';

interface RelationshipStructureCardProps {
  primaryDomain: string;
  relationships: Relationship[];
  assets: Asset[];
  technologies: Technology[];
  isLoading: boolean;
}

interface RepresentativeBranch {
  id: string;
  type: string;
  targetLabel: string;
  targetType: string;
  confidence: number;
  categoryIcon: string;
}

export const RelationshipStructureCard: React.FC<RelationshipStructureCardProps> = ({
  primaryDomain,
  relationships,
  assets,
  technologies,
  isLoading,
}) => {
  const navigate = useNavigate();

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  const techMap = useMemo(() => {
    const map = new Map<string, Technology>();
    technologies.forEach((t) => map.set(t.id, t));
    return map;
  }, [technologies]);

  const representativeBranches = useMemo<RepresentativeBranch[]>(() => {
    if (!relationships || relationships.length === 0) return [];

    const branches: RepresentativeBranch[] = [];
    const seenTargets = new Set<string>();

    const prioritizedTypes = ['technology_observed_on', 'resolves_to', 'references', 'contains'];

    const sorted = [...relationships].sort((a, b) => {
      const idxA = prioritizedTypes.indexOf(a.relationship_type);
      const idxB = prioritizedTypes.indexOf(b.relationship_type);
      const weightA = idxA !== -1 ? idxA : 99;
      const weightB = idxB !== -1 ? idxB : 99;
      return weightA - weightB;
    });

    for (const rel of sorted) {
      if (branches.length >= 5) break;

      let targetLabel = '';
      let targetType = rel.target_type;
      let categoryIcon = '🔗';

      if (rel.target_type === 'asset') {
        const a = assetMap.get(rel.target_id_reference);
        targetLabel = a ? a.value : rel.target_id_reference.slice(0, 12);
        categoryIcon = a?.asset_type === 'ip' ? '🌐' : '📑';
      } else if (rel.target_type === 'technology') {
        const t = techMap.get(rel.target_id_reference);
        targetLabel = t ? t.name : (rel.extra_data?.technology_name as string) || 'Technology Stack';
        categoryIcon = '⚙️';
      } else {
        targetLabel = (rel.extra_data?.target_value as string) || rel.target_id_reference.slice(0, 12);
      }

      const dedupeKey = `${rel.relationship_type}:${targetLabel}`;
      if (!seenTargets.has(dedupeKey)) {
        seenTargets.add(dedupeKey);
        branches.push({
          id: rel.id,
          type: rel.relationship_type,
          targetLabel,
          targetType,
          confidence: rel.confidence,
          categoryIcon,
        });
      }
    }

    return branches;
  }, [relationships, assetMap, techMap]);

  const formatRelType = (relType: string): string => {
    switch (relType) {
      case 'resolves_to':
        return 'resolves_to';
      case 'references':
        return 'references';
      case 'technology_observed_on':
        return 'technology_observed_on';
      case 'supported_by':
        return 'supported_by';
      case 'contains':
        return 'contains';
      case 'certificate_associated_with':
        return 'certificate_associated_with';
      default:
        return relType;
    }
  };

  const getRelBadgeClass = (relType: string): string => {
    switch (relType) {
      case 'technology_observed_on':
        return 'rel-badge--tech';
      case 'resolves_to':
        return 'rel-badge--dns';
      case 'references':
        return 'rel-badge--ref';
      default:
        return 'rel-badge--default';
    }
  };

  return (
    <div className="relationship-structure-card" aria-label="Representative Relationship Structure">
      <div className="relationship-card-header">
        <div>
          <h2 className="relationship-card-title">External Asset Relationships</h2>
          <p className="relationship-card-subtitle">
            Observed entity associations and passive dependency topology
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/relationships')}
          title="Open External Asset Relationships module"
        >
          <span>EXPLORE GRAPH ({relationships.length})</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {isLoading ? (
        <div className="state-box" style={{ minHeight: 200 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Mapping external entity graph...</span>
        </div>
      ) : representativeBranches.length === 0 ? (
        <div className="state-box" style={{ minHeight: 160 }}>
          <span className="state-title">No Relationships Observed</span>
          <p className="state-message">Run passive assessment to map entity relationships.</p>
        </div>
      ) : (
        <div className="topology-view-wrapper">
          {/* Top Scope Node */}
          <div className="topology-root-node">
            <div className="root-node-indicator">
              <span className="root-pulse-ring" aria-hidden="true" />
              <span className="root-core-dot" aria-hidden="true" />
            </div>
            <div className="root-node-info">
              <span className="root-node-eyebrow">TARGET APEX ENTITY</span>
              <span className="root-node-domain">{primaryDomain}</span>
            </div>
            <span className="root-node-counter">
              {relationships.length} Total Linkages
            </span>
          </div>

          {/* Topological Branches with SVG Connector Bus */}
          <div className="topology-branches-container">
            {representativeBranches.map((branch) => (
              <div key={branch.id} className="topology-branch-item">
                <div className="topology-bus-line" aria-hidden="true">
                  <span className="bus-stem" />
                  <span className="bus-branch" />
                  <span className="bus-node-dot" />
                </div>

                <div className="topology-node-card">
                  <div className="topology-node-header">
                    <span className={`branch-rel-tag ${getRelBadgeClass(branch.type)}`}>
                      {formatRelType(branch.type)}
                    </span>
                    <span className="branch-confidence-tag">
                      {(branch.confidence * 100).toFixed(0)}% verified
                    </span>
                  </div>

                  <div className="topology-node-entity-row">
                    <span className="node-category-icon" aria-hidden="true">
                      {branch.categoryIcon}
                    </span>
                    <span className="node-target-name">{branch.targetLabel}</span>
                    <span className="node-type-label">[{branch.targetType}]</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note with quick action */}
          <div className="topology-footer-bar">
            <div className="topology-footer-stats">
              <span className="topology-legend-dot" />
              <span>Deterministic Directed Graph • {relationships.length} Observed Associations</span>
            </div>
            <button
              type="button"
              className="topology-explore-link"
              onClick={() => navigate('/relationships')}
            >
              Interactive Graph View →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
