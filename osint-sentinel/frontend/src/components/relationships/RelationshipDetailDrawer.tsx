import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Relationship, Asset, Technology } from '../../types';
import { RelationshipTypeBadge } from './RelationshipTypeBadge';
import { resolveEntityLabel, getRelationshipScope } from './RelationshipRow';

interface RelationshipDetailDrawerProps {
  rel: Relationship | null;
  targetDomain: string;
  assetMap: Map<string, Asset>;
  techMap: Map<string, Technology>;
  onClose: () => void;
}

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 8) + ' UTC';
  } catch {
    return isoStr;
  }
};

export const RelationshipDetailDrawer: React.FC<RelationshipDetailDrawerProps> = ({
  rel,
  targetDomain,
  assetMap,
  techMap,
  onClose,
}) => {
  const navigate = useNavigate();
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (rel) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rel, onClose]);

  // Reset raw view on relationship change
  useEffect(() => {
    setShowRawJson(false);
  }, [rel?.id]);

  if (!rel) return null;

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
  const extra = (rel.extra_data || {}) as Record<string, unknown>;
  const hasExtra = Object.keys(extra).length > 0;

  // Check if source or target are navigable assets or technologies
  const sourceAsset = rel.source_type === 'asset' ? assetMap.get(rel.source_id) : undefined;
  const targetAsset = rel.target_type === 'asset' ? assetMap.get(rel.target_id_reference) : undefined;
  const isTechnologyTarget = rel.target_type === 'technology';

  return (
    <>
      {/* Backdrop */}
      <div
        className="relationship-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="relationship-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rel-drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3 id="rel-drawer-title" className="drawer-title">
              Relationship Detail
            </h3>
            <span className="drawer-title-tag">Observed Directed Link</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close relationship details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Observation Core Principle Disclaimer */}
          <div className="relationship-disclaimer-box">
            <div className="relationship-disclaimer-title">Observation Principle</div>
            <div>
              External asset relationships represent <strong>factual, directed links</strong> observed in public
              DNS, RDAP, HTTP, and Certificate telemetry. They are <strong>NOT</strong> attack paths, exploit chains,
              or compromise graphs.
            </div>
          </div>

          {/* Directed Edge Visual */}
          <div className="rel-edge-diagram" style={{ marginTop: 'var(--space-3)' }}>
            <div className="rel-edge-nodes">
              <div className="rel-edge-node">
                <div className="rel-edge-node-title" title={sourceInfo.name}>
                  {sourceInfo.name}
                </div>
                <span className="rel-edge-node-type">{sourceInfo.type}</span>
              </div>

              <div className="rel-edge-arrow">
                <span className="rel-edge-arrow-label">
                  {rel.relationship_type.replace(/_/g, ' ')}
                </span>
                <span className="rel-edge-arrow-line">──▶</span>
              </div>

              <div className="rel-edge-node">
                <div className="rel-edge-node-title" title={targetInfo.name}>
                  {targetInfo.name}
                </div>
                <span className="rel-edge-node-type">{targetInfo.type}</span>
              </div>
            </div>
          </div>

          {/* Relationship Properties */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Directed Edge Attributes</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Relationship Type</span>
                <span className="drawer-prop-val">
                  <RelationshipTypeBadge type={rel.relationship_type} />
                </span>
              </div>

              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Scope Classification</span>
                <span className="drawer-prop-val">
                  <span className={`rel-scope-badge rel-scope-badge--${scope.variant}`}>
                    {scope.label}
                  </span>
                </span>
              </div>

              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observation Confidence</span>
                <span
                  className="drawer-prop-val"
                  title="Confidence that this relationship is factually observed."
                >
                  {rel.confidence.toFixed(2)} (Factual Observation)
                </span>
              </div>

              <div className="drawer-prop-row">
                <span className="drawer-prop-label">First Observed</span>
                <span className="drawer-prop-val">{formatDate(rel.created_at)}</span>
              </div>

              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Relationship ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.68rem' }}>
                  {rel.id}
                </span>
              </div>
            </div>
          </div>

          {/* Source Entity Details */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Source Entity</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Source Name</span>
                <span className="drawer-prop-val">{sourceInfo.name}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Source Type</span>
                <span className="drawer-prop-val">{rel.source_type.toUpperCase()}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Source ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.68rem' }}>
                  {rel.source_id}
                </span>
              </div>
              {sourceAsset && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="relationship-action-link"
                    onClick={() => {
                      onClose();
                      navigate('/assets');
                    }}
                  >
                    VIEW SOURCE ASSET IN ASSET INTELLIGENCE →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Target Entity Details */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Target Entity</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Target Name / Value</span>
                <span className="drawer-prop-val">{targetInfo.name}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Target Type</span>
                <span className="drawer-prop-val">{rel.target_type.toUpperCase()}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Target Reference</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.68rem' }}>
                  {rel.target_id_reference}
                </span>
              </div>
              {targetAsset && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="relationship-action-link"
                    onClick={() => {
                      onClose();
                      navigate('/assets');
                    }}
                  >
                    VIEW TARGET ASSET IN ASSET INTELLIGENCE →
                  </button>
                </div>
              )}
              {isTechnologyTarget && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="relationship-action-link"
                    onClick={() => {
                      onClose();
                      navigate('/technologies');
                    }}
                  >
                    VIEW OBSERVED TECHNOLOGY IN TECHNOLOGY INTELLIGENCE →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Supporting Evidence Provenance */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Supporting Evidence Provenance</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Evidence Reference</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.7rem' }}>
                  {rel.evidence_id || 'Evidence reference not available'}
                </span>
              </div>
              {rel.evidence_id && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="relationship-action-link"
                    onClick={() => {
                      onClose();
                      navigate('/evidence');
                    }}
                  >
                    VIEW EVIDENCE IN EVIDENCE & PROVENANCE →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata & Raw Attributes */}
          {hasExtra && (
            <div className="drawer-section">
              <div className="drawer-section-title">
                <span>Correlation Telemetry & Metadata</span>
              </div>
              <div className="drawer-props-list">
                <table className="drawer-metadata-table">
                  <tbody>
                    {Object.entries(extra).map(([k, v]) => (
                      <tr key={k}>
                        <td>{k.replace(/_/g, ' ').toUpperCase()}:</td>
                        <td>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="drawer-raw-toggle"
                    onClick={() => setShowRawJson(!showRawJson)}
                  >
                    <span>{showRawJson ? '▼ Hide' : '▶ View'} Raw Attributes</span>
                  </button>
                  {showRawJson && (
                    <pre className="drawer-raw-box" style={{ marginTop: 'var(--space-2)' }}>
                      {JSON.stringify(extra, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
