import React from 'react';
import { Asset, Relationship, Technology } from '../../types';

interface RelationshipGraphPreviewProps {
  currentAsset: Asset;
  targetDomain: string;
  relationships: Relationship[];
  assetMap: Map<string, string>;
  techMap: Map<string, Technology>;
  onViewAll: () => void;
}

interface GraphNode {
  id: string;
  label: string;
  category: 'target' | 'domain' | 'subdomain' | 'ip' | 'technology' | 'evidence' | 'external';
  relationType?: string;
  isFocal?: boolean;
}

const CATEGORY_STYLES: Record<
  GraphNode['category'],
  { border: string; bg: string; text: string; dot: string; label: string }
> = {
  target: {
    border: '#0284c7',
    bg: '#f0f9ff',
    text: '#0369a1',
    dot: '#0284c7',
    label: 'Target',
  },
  domain: {
    border: '#2563eb',
    bg: '#eff6ff',
    text: '#1d4ed8',
    dot: '#2563eb',
    label: 'Domain',
  },
  subdomain: {
    border: '#0891b2',
    bg: '#ecfeff',
    text: '#0e7490',
    dot: '#0891b2',
    label: 'Subdomain',
  },
  ip: {
    border: '#64748b',
    bg: '#f8fafc',
    text: '#334155',
    dot: '#64748b',
    label: 'IP Address',
  },
  technology: {
    border: '#7c3aed',
    bg: '#f5f3ff',
    text: '#6d28d9',
    dot: '#7c3aed',
    label: 'Technology',
  },
  evidence: {
    border: '#d97706',
    bg: '#fffbeb',
    text: '#b45309',
    dot: '#d97706',
    label: 'Evidence',
  },
  external: {
    border: '#059669',
    bg: '#ecfdf5',
    text: '#047857',
    dot: '#059669',
    label: 'External',
  },
};

export const RelationshipGraphPreview: React.FC<RelationshipGraphPreviewProps> = ({
  currentAsset,
  targetDomain,
  relationships,
  assetMap,
  techMap,
  onViewAll,
}) => {
  // If zero relationships exist
  if (relationships.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
          No related entities observed.
        </div>
        <button
          className="btn-link"
          onClick={onViewAll}
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-cyan)' }}
        >
          View all relationships &rarr;
        </button>
      </div>
    );
  }

  // Determine focal node category
  let focalCategory: GraphNode['category'] = 'domain';
  if (currentAsset.asset_type === 'ip') focalCategory = 'ip';
  else if (currentAsset.asset_type === 'subdomain' || currentAsset.asset_type === 'certificate_associated_hostname')
    focalCategory = 'subdomain';

  const focalNode: GraphNode = {
    id: currentAsset.id,
    label: currentAsset.value,
    category: focalCategory,
    isFocal: true,
  };

  // Build immediate neighborhood nodes (up to 4-5 nodes)
  const neighborNodes: GraphNode[] = [];
  const seenIds = new Set<string>([currentAsset.id]);

  // If this asset is not the root target itself, add Target Scope as an authoritative parent node
  if (currentAsset.value !== targetDomain) {
    neighborNodes.push({
      id: 'target-root',
      label: targetDomain,
      category: 'target',
      relationType: 'target_scope',
    });
    seenIds.add('target-root');
  }

  // Extract from relationships
  for (const rel of relationships) {
    if (neighborNodes.length >= 5) break;

    const isOutgoing = rel.source_id === currentAsset.id;
    const targetRef = isOutgoing ? rel.target_id_reference : rel.source_id;
    const targetType = isOutgoing ? rel.target_type : rel.source_type;

    if (!targetRef || seenIds.has(targetRef)) continue;
    seenIds.add(targetRef);

    let label = targetRef;
    let cat: GraphNode['category'] = 'external';

    if (targetType === 'target') {
      cat = 'target';
      label = targetDomain;
    } else if (targetType === 'asset') {
      const mappedVal = assetMap.get(targetRef);
      if (mappedVal) {
        label = mappedVal;
        cat = /^\d{1,3}(\.\d{1,3}){3}$/.test(mappedVal) ? 'ip' : 'domain';
      } else {
        const extra = rel.extra_data as Record<string, unknown> | undefined;
        if (extra?.ip && typeof extra.ip === 'string') {
          label = extra.ip;
          cat = 'ip';
        } else if (extra?.asset_value && typeof extra.asset_value === 'string') {
          label = extra.asset_value;
          cat = 'domain';
        }
      }
    } else if (targetType === 'technology') {
      cat = 'technology';
      const tech = techMap.get(targetRef);
      const extra = rel.extra_data as Record<string, unknown> | undefined;
      label = tech?.name || (extra?.technology_name as string) || 'Technology';
    } else if (targetType === 'evidence') {
      cat = 'evidence';
      label = `Evidence #${targetRef.slice(0, 6)}`;
    } else {
      cat = 'external';
      const extra = rel.extra_data as Record<string, unknown> | undefined;
      label = (extra?.role as string) || (extra?.cname_target as string) || targetRef;
    }

    neighborNodes.push({
      id: targetRef,
      label,
      category: cat,
      relationType: rel.relationship_type,
    });
  }

  // Fixed coordinate anchors for high-density compact visualization
  // Focal node in center: (160, 90)
  const FOCAL_COORDS = { x: 160, y: 90 };
  const ANCHOR_COORDS = [
    { x: 160, y: 24 },  // Top
    { x: 65, y: 154 },  // Bottom-Left
    { x: 255, y: 154 }, // Bottom-Right
    { x: 55, y: 32 },   // Top-Left
    { x: 265, y: 32 },  // Top-Right
  ];

  const truncate = (str: string, maxLen = 14) => {
    if (str.length <= maxLen) return str;
    return `${str.slice(0, maxLen - 1)}…`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* SVG Canvas */}
      <div
        style={{
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '6px',
          padding: '8px 4px',
          position: 'relative',
        }}
      >
        <svg
          width="100%"
          height="180"
          viewBox="0 0 320 180"
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* Connector Edges */}
          {neighborNodes.map((neighbor, idx) => {
            const anchor = ANCHOR_COORDS[idx % ANCHOR_COORDS.length];
            return (
              <g key={`edge-${neighbor.id}`}>
                <line
                  x1={FOCAL_COORDS.x}
                  y1={FOCAL_COORDS.y}
                  x2={anchor.x}
                  y2={anchor.y}
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.5"
                  strokeDasharray={neighbor.category === 'evidence' ? '3 3' : 'none'}
                />
              </g>
            );
          })}

          {/* Neighbor Node Badges */}
          {neighborNodes.map((neighbor, idx) => {
            const anchor = ANCHOR_COORDS[idx % ANCHOR_COORDS.length];
            const style = CATEGORY_STYLES[neighbor.category] || CATEGORY_STYLES.external;
            const width = 96;
            const height = 24;
            const rx = 4;

            return (
              <g
                key={`node-${neighbor.id}`}
                transform={`translate(${anchor.x - width / 2}, ${anchor.y - height / 2})`}
                style={{ cursor: 'pointer' }}
                onClick={onViewAll}
              >
                <title>{`${neighbor.label} (${style.label})`}{neighbor.relationType ? ` • ${neighbor.relationType}` : ''}</title>
                <rect
                  width={width}
                  height={height}
                  rx={rx}
                  fill={style.bg}
                  stroke={style.border}
                  strokeWidth="1"
                />
                <circle cx="8" cy={height / 2} r="3" fill={style.dot} />
                <text
                  x="16"
                  y={height / 2 + 3.5}
                  fontSize="10"
                  fontFamily={neighbor.category === 'domain' || neighbor.category === 'ip' ? 'var(--font-mono)' : 'var(--font-sans)'}
                  fontWeight="600"
                  fill={style.text}
                >
                  {truncate(neighbor.label, 11)}
                </text>
              </g>
            );
          })}

          {/* Focal Center Node (Current Asset) */}
          <g
            transform={`translate(${FOCAL_COORDS.x - 65}, ${FOCAL_COORDS.y - 16})`}
            style={{ cursor: 'default' }}
          >
            <title>{`${focalNode.label} (Current Asset Investigation)`}</title>
            <rect
              width="130"
              height="32"
              rx="6"
              fill="var(--color-bg-surface)"
              stroke="var(--color-accent-cyan)"
              strokeWidth="2"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
            />
            <circle cx="12" cy="16" r="4" fill="var(--color-accent-cyan)" />
            <text
              x="22"
              y="20"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fill="var(--color-text-primary)"
            >
              {truncate(focalNode.label, 13)}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: CATEGORY_STYLES.target.dot }} />
            Target
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: CATEGORY_STYLES.domain.dot }} />
            Domain/IP
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: CATEGORY_STYLES.technology.dot }} />
            Technology
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: CATEGORY_STYLES.evidence.dot }} />
            Evidence
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {relationships.length} mapped {relationships.length === 1 ? 'edge' : 'edges'}
          </span>
          <button
            className="btn-link"
            onClick={onViewAll}
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-cyan)', padding: 0 }}
          >
            View all relationships &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
