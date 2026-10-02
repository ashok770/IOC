import React, { useEffect, useState } from 'react';
import { Asset, Relationship } from '../../types';
import { AssetTypeBadge } from './AssetTypeBadge';
import { assetApi } from '../../api';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  primaryDomain?: string;
  onClose: () => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  primaryDomain,
  onClose,
}) => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoadingRel, setIsLoadingRel] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch factual relationships for selected asset
  useEffect(() => {
    if (!asset) {
      setRelationships([]);
      return;
    }

    let isMounted = true;
    setIsLoadingRel(true);

    assetApi
      .getAssetRelationships(asset.id)
      .then((res) => {
        if (isMounted) {
          setRelationships(res.items || []);
          setIsLoadingRel(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRelationships([]);
          setIsLoadingRel(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [asset?.id]);

  if (!asset) return null;

  const isExternal =
    primaryDomain &&
    asset.asset_type !== 'ip' &&
    asset.value.toLowerCase() !== primaryDomain.toLowerCase() &&
    !asset.value.toLowerCase().endsWith(`.${primaryDomain.toLowerCase()}`);

  const extra = asset.extra_data || {};
  const hasExtra = Object.keys(extra).length > 0;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="asset-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="asset-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Asset details for ${asset.value}`}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <span className="drawer-title-tag">Asset Detail</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close asset details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Hero / Asset Identity */}
          <div className="drawer-hero">
            <div className="drawer-hero-badges">
              <AssetTypeBadge type={asset.asset_type} />
              {isExternal ? (
                <span className="external-tag">External Reference</span>
              ) : (
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-accent-cyan)',
                    backgroundColor: 'var(--color-accent-cyan-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                  }}
                >
                  Target Scope
                </span>
              )}
            </div>
            <h2 className="drawer-asset-value">{asset.value}</h2>
          </div>

          {/* Properties Section */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Observation Properties</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Asset ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.7rem' }}>
                  {asset.id}
                </span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Scope Classification</span>
                <span className="drawer-prop-val">
                  {isExternal ? 'External Reference' : 'Target Scope'}
                </span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Source</span>
                <span className="drawer-prop-val">{asset.source}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observation Confidence</span>
                <span
                  className="drawer-prop-val"
                  title="Factual observation confidence based on authoritative intelligence sources."
                >
                  1.00 (Factual)
                </span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">First Discovered</span>
                <span className="drawer-prop-val">{formatDate(asset.discovered_at)}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Last Observed</span>
                <span className="drawer-prop-val">{formatDate(asset.last_seen_at)}</span>
              </div>
            </div>
          </div>

          {/* Structured Metadata */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Telemetry & Metadata</span>
            </div>
            <div className="drawer-props-list">
              <table className="drawer-metadata-table">
                <tbody>
                  {Boolean(extra.role) && (
                    <tr>
                      <td>Role:</td>
                      <td>{String(extra.role).replace('_', ' ').toUpperCase()}</td>
                    </tr>
                  )}
                  {Boolean(extra.record_type) && (
                    <tr>
                      <td>DNS Record:</td>
                      <td>{String(extra.record_type)}</td>
                    </tr>
                  )}
                  {extra.ttl !== undefined && (
                    <tr>
                      <td>TTL:</td>
                      <td>{String(extra.ttl)}s</td>
                    </tr>
                  )}
                  {extra.preference !== undefined && (
                    <tr>
                      <td>MX Preference:</td>
                      <td>{String(extra.preference)}</td>
                    </tr>
                  )}
                  {Boolean(extra.scope) && (
                    <tr>
                      <td>Discovery Scope:</td>
                      <td>{String(extra.scope).replace(/_/g, ' ')}</td>
                    </tr>
                  )}
                  {!hasExtra && (
                    <tr>
                      <td colSpan={2} style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No additional telemetry attributes logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {hasExtra && (
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
              )}
            </div>
          </div>

          {/* Provenance */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Evidence Provenance</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Evidence ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.7rem' }}>
                  {asset.first_evidence_id || 'Target Registration'}
                </span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Evidence Explorer</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Upcoming Checkpoint
                </span>
              </div>
            </div>
          </div>

          {/* Related Intelligence */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Related Intelligence</span>
            </div>
            <div className="drawer-future-notice">
              <div className="drawer-future-title">External Asset Relationships</div>
              <div>
                {isLoadingRel
                  ? 'Querying relationships...'
                  : `${relationships.length} observed relationship${relationships.length === 1 ? '' : 's'} involving this asset.`}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
