import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EvidenceItem, Asset } from '../../types';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { EvidenceProvenance } from './EvidenceProvenance';
import { getEvidenceSummary } from './EvidenceRow';

interface EvidenceDetailDrawerProps {
  item: EvidenceItem | null;
  targetDomain: string;
  associatedAsset?: Asset;
  onClose: () => void;
}

export const EvidenceDetailDrawer: React.FC<EvidenceDetailDrawerProps> = ({
  item,
  targetDomain,
  associatedAsset,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (item) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  // Reset copied state on item change
  useEffect(() => {
    setCopied(false);
  }, [item?.id]);

  if (!item) return null;

  const summary = getEvidenceSummary(item);
  const dataPayload = item.data || {};
  const rawJsonString = JSON.stringify(dataPayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine asset domain / value
  const assetValue = associatedAsset
    ? associatedAsset.value
    : (dataPayload.domain as string) || targetDomain;

  return (
    <>
      {/* Backdrop */}
      <div
        className="evidence-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="evidence-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3 id="evidence-drawer-title" className="drawer-title">
              Evidence Detail
            </h3>
            <span className="drawer-title-tag">Authoritative Telemetry</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close evidence details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Observation Core Principle Disclaimer */}
          <div className="evidence-disclaimer-box">
            <div className="evidence-disclaimer-title">Evidentiary Principle</div>
            <div>
              Evidence records are <strong>immutable factual observations</strong> collected directly from
              authoritative external public sources (DNS resolvers, RDAP registries, HTTP endpoints, or CT logs).
              Evidence proves an observation — it does <strong>not</strong> indicate a vulnerability or compromise.
            </div>
          </div>

          {/* Hero / Identity */}
          <div className="drawer-hero" style={{ marginTop: 'var(--space-3)' }}>
            <div className="drawer-hero-badges">
              <EvidenceTypeBadge type={item.evidence_type} />
              <span className="evidence-source-badge">{item.source}</span>
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
                CONFIDENCE: {(item.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <h2 className="drawer-asset-value" style={{ marginTop: 'var(--space-2)' }}>
              {summary.title}
            </h2>
            {summary.subtitle && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {summary.subtitle}
              </p>
            )}
          </div>

          {/* Asset & Scope Association */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>Scope & Asset Association</span>
            </div>
            <div className="drawer-props-list">
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Assessment Target</span>
                <span className="drawer-prop-val">{targetDomain}</span>
              </div>
              <div className="drawer-prop-row">
                <span className="drawer-prop-label">Observed On</span>
                <span className="drawer-prop-val">{assetValue}</span>
              </div>
              {associatedAsset && (
                <div className="drawer-prop-row">
                  <span className="drawer-prop-label">Asset Classification</span>
                  <span className="drawer-prop-val">
                    {associatedAsset.asset_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              )}
              {associatedAsset && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="evidence-action-link"
                    onClick={() => {
                      onClose();
                      navigate('/assets');
                    }}
                  >
                    VIEW ASSET IN ASSET INTELLIGENCE →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes (if present) */}
          {Boolean(item.notes) && (
            <div className="drawer-section">
              <div className="drawer-section-title">
                <span>Collector Notes</span>
              </div>
              <div className="drawer-props-list">
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {item.notes}
                </p>
              </div>
            </div>
          )}

          {/* Raw Evidence Payload */}
          <div className="drawer-section">
            <div
              className="drawer-section-title"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Raw Evidence Artifact</span>
              <button
                type="button"
                className="evidence-action-link"
                onClick={handleCopyJson}
                title="Copy raw JSON artifact"
              >
                {copied ? '✓ COPIED' : 'COPY RAW JSON'}
              </button>
            </div>
            <pre className="evidence-raw-card">{rawJsonString}</pre>
          </div>

          {/* Provenance Section */}
          <EvidenceProvenance item={item} />
        </div>
      </aside>
    </>
  );
};
