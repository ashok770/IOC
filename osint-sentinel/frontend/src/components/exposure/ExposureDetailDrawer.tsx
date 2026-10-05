import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal, Asset } from '../../types';
import { ExposureTypeBadge } from './ExposureTypeBadge';

interface ExposureDetailDrawerProps {
  signal: ExposureSignal | null;
  affectedAsset?: Asset;
  onClose: () => void;
}

export const ExposureDetailDrawer: React.FC<ExposureDetailDrawerProps> = ({
  signal,
  affectedAsset,
  onClose,
}) => {
  const navigate = useNavigate();
  const [showRawJson, setShowRawJson] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!signal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [signal, onClose]);

  if (!signal) return null;

  const extra = signal.extra_data || {};
  const hasExtra = Object.keys(extra).length > 0;

  const getInvestigationGuidance = (type: string) => {
    switch (type.toLowerCase()) {
      case 'remote_access_indicator':
        return 'Confirm the endpoint is intentionally public and review its access-control, MFA enforcement, and exposure requirements.';
      case 'development_test_indicator':
        return 'Confirm whether the environment is intentionally reachable within the authorized external scope or should be restricted to private networks.';
      case 'technology_disclosure':
        return 'Review whether exposed server or software stack metadata is necessary in public response headers and evaluate header hygiene.';
      case 'external_dependency_reference':
        return 'Confirm the external infrastructure reference (e.g. delegated DNS, CDN, mail relay) is expected, active, and appropriately governed.';
      default:
        return 'Review whether this publicly observable configuration indicator conforms to operational policy and exposure requirements.';
    }
  };

  const assetValue =
    affectedAsset?.value ||
    (extra.hostname as string) ||
    (extra.referenced_entity as string) ||
    (signal.asset_id ? `Asset ${signal.asset_id.slice(0, 8)}...` : 'Target Scope');

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
        className="exposure-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="exposure-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Exposure signal details for ${signal.title}`}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <span className="drawer-title-tag">Exposure Signal</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close exposure signal details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Hero Section */}
          <div className="drawer-hero">
            <div className="drawer-hero-badges">
              <ExposureTypeBadge type={signal.signal_type} />
              <span
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-surface-elevated)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  textTransform: 'uppercase',
                }}
              >
                {signal.category.replace(/_/g, ' ')}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Severity: {signal.severity || 'info'}
              </span>
            </div>
            <h2 className="drawer-asset-value" style={{ fontSize: 'var(--text-base)', marginTop: '4px' }}>
              {signal.title}
            </h2>
          </div>

          {/* Factual Observation Description */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Observation Details</span>
            </div>
            <div className="drawer-props-list">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {signal.description}
              </p>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                <div className="drawer-prop-row">
                  <span className="drawer-prop-label">Observation Confidence</span>
                  <span className="drawer-prop-val">
                    {signal.confidence !== undefined ? signal.confidence.toFixed(2) : '1.00'} (Factual)
                  </span>
                </div>
                <div className="drawer-prop-row" style={{ marginTop: 'var(--space-2)' }}>
                  <span className="drawer-prop-label">Observed Timestamp</span>
                  <span className="drawer-prop-val">{formatDate(signal.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deterministic Investigation Prompt */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Investigation Guidance</span>
            </div>
            <div className="exposure-disclaimer-box">
              <div className="exposure-disclaimer-title">Defensive Investigation Prompt</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                {getInvestigationGuidance(signal.signal_type)}
              </p>
              <div
                style={{
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: 'var(--space-2)',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}
              >
                EXPOSURE ≠ VULNERABILITY • Non-intrusive observation derived deterministically from public OSINT telemetry.
              </div>
            </div>
          </div>

          {/* Affected Asset Reference */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Affected Perimeter Asset</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Asset Value</span>
                <span className="drawer-prop-val" style={{ fontWeight: 600, color: 'var(--color-accent-cyan)' }}>
                  {assetValue}
                </span>
              </div>
              {affectedAsset?.asset_type && (
                <div className="drawer-prop-row">
                  <span className="drawer-prop-label">Asset Type</span>
                  <span className="drawer-prop-val">
                    {affectedAsset.asset_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              )}
              {signal.asset_id && (
                <div style={{ marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="exposure-action-link"
                    onClick={() => navigate('/assets')}
                    title="View asset inventory"
                  >
                    <span>View in Asset Inventory</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Structured Telemetry / Extra Data */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Signal Telemetry Attributes</span>
            </div>
            <div className="drawer-props-list">
              <table className="drawer-metadata-table">
                <tbody>
                  {Boolean(extra.matched_keyword) && (
                    <tr>
                      <td>Matched Keyword:</td>
                      <td>{String(extra.matched_keyword)}</td>
                    </tr>
                  )}
                  {Boolean(extra.hostname) && (
                    <tr>
                      <td>Observed Hostname:</td>
                      <td>{String(extra.hostname)}</td>
                    </tr>
                  )}
                  {Boolean(extra.technology_name) && (
                    <tr>
                      <td>Technology Name:</td>
                      <td>{String(extra.technology_name)}</td>
                    </tr>
                  )}
                  {Boolean(extra.referenced_entity) && (
                    <tr>
                      <td>Referenced Entity:</td>
                      <td>{String(extra.referenced_entity)}</td>
                    </tr>
                  )}
                  {Boolean(extra.role) && (
                    <tr>
                      <td>Observed Role:</td>
                      <td>{String(extra.role).replace(/_/g, ' ').toUpperCase()}</td>
                    </tr>
                  )}
                  {!hasExtra && (
                    <tr>
                      <td colSpan={2} style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No additional signal parameters.
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

          {/* Evidence Provenance */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Evidence Provenance</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Evidence ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.7rem' }}>
                  {signal.evidence_id || 'Correlated Derivation'}
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
        </div>
      </aside>
    </>
  );
};
