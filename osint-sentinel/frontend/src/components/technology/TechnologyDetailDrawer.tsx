import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Technology, Asset } from '../../types';
import { TechnologyCategoryBadge } from './TechnologyCategoryBadge';

interface TechnologyDetailDrawerProps {
  tech: Technology | null;
  associatedAsset?: Asset;
  onClose: () => void;
}

const formatMethodLabel = (method: string): string => {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 8) + ' UTC';
  } catch {
    return isoStr;
  }
};

export const TechnologyDetailDrawer: React.FC<TechnologyDetailDrawerProps> = ({
  tech,
  associatedAsset,
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
    if (tech) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tech, onClose]);

  // Reset raw view on tech change
  useEffect(() => {
    setShowRawJson(false);
  }, [tech?.id]);

  if (!tech) return null;

  const extra = (tech.extra_data || {}) as Record<string, unknown>;
  const hasExtra = Object.keys(extra).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="technology-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="technology-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tech-drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3 id="tech-drawer-title" className="drawer-title">
              Technology Detail
            </h3>
            <span className="drawer-title-tag">Passive Observation</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close technology details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Observation Core Principle Disclaimer */}
          <div className="technology-disclaimer-box">
            <div className="technology-disclaimer-title">Observation Principle</div>
            <div>
              Technology observation is <strong>NOT</strong> vulnerability assessment.
              Passive detection reflects observed presence in public telemetry and does not imply
              compromise or exploitability.
            </div>
          </div>

          {/* Hero / Identity */}
          <div className="drawer-hero" style={{ marginTop: 'var(--space-3)' }}>
            <div className="drawer-hero-badges">
              <TechnologyCategoryBadge category={tech.category} />
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
                CONFIDENCE: {(tech.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <h2 className="drawer-asset-value" style={{ marginTop: 'var(--space-2)' }}>
              {tech.name}
            </h2>
          </div>

          {/* Observation Properties */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Observation Properties</span>
            </div>
            <div className="drawer-props-list">
              {/* Version Handling */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Version</span>
                <span className="drawer-prop-val">
                  {tech.version ? (
                    <span className="tech-version-pill" style={{ fontSize: '0.72rem' }}>
                      {tech.version}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Not observed
                    </span>
                  )}
                </span>
              </div>

              {/* Observation Confidence */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observation Confidence</span>
                <span
                  className="drawer-prop-val"
                  title="Confidence that this technology was correctly detected."
                >
                  {tech.confidence.toFixed(2)} (Factual Detection)
                </span>
              </div>

              {/* Detection Method */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Detection Method</span>
                <span className="drawer-prop-val">
                  {formatMethodLabel(tech.detection_method)}
                </span>
              </div>

              {/* First Seen */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">First Observed</span>
                <span className="drawer-prop-val">{formatDate(tech.first_seen)}</span>
              </div>

              {/* Last Seen */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Last Observed</span>
                <span className="drawer-prop-val">{formatDate(tech.last_seen)}</span>
              </div>

              {/* Technology Record ID */}
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observation ID</span>
                <span className="drawer-prop-val" style={{ fontSize: '0.68rem' }}>
                  {tech.id}
                </span>
              </div>
            </div>
          </div>

          {/* Asset Association */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Asset Association</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observed On</span>
                <span className="drawer-prop-val">
                  {associatedAsset ? associatedAsset.value : 'Target Scope'}
                </span>
              </div>
              {associatedAsset && (
                <div className="drawer-prop-row">
                  <span className="drawer-prop-label">Asset Classification</span>
                  <span className="drawer-prop-val">
                    {associatedAsset.asset_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="technology-action-link"
                  onClick={() => navigate('/assets')}
                >
                  VIEW ASSET IN ASSET INTELLIGENCE →
                </button>
              </div>
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
                  {tech.evidence_id || 'No direct evidence reference available'}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry / Detection Markers */}
          {hasExtra && (
            <div className="drawer-section">
              <div className="drawer-section-title">
                <span>Detection Telemetry</span>
              </div>
              <div className="drawer-props-list">
                <table className="drawer-metadata-table">
                  <tbody>
                    {Boolean(extra.matched_header) && (
                      <tr>
                        <td>Matched Header:</td>
                        <td>{String(extra.matched_header)}</td>
                      </tr>
                    )}
                    {Boolean(extra.raw_value) && (
                      <tr>
                        <td>Raw Value:</td>
                        <td>{String(extra.raw_value)}</td>
                      </tr>
                    )}
                    {Boolean(extra.probed_url) && (
                      <tr>
                        <td>Probed URL:</td>
                        <td>{String(extra.probed_url)}</td>
                      </tr>
                    )}
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

          {/* Related Intelligence Navigation */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Related Intelligence</span>
            </div>
            <div className="drawer-future-notice">
              <div className="drawer-future-title">Exposure Intelligence</div>
              <div>
                Technology observations may correlate with public disclosure exposure signals.
              </div>
              <button
                type="button"
                className="technology-action-link"
                onClick={() => navigate('/exposures')}
              >
                VIEW EXPOSURE INTELLIGENCE →
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
