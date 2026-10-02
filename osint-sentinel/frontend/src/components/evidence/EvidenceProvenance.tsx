import React from 'react';
import { EvidenceItem } from '../../types';

interface EvidenceProvenanceProps {
  item: EvidenceItem;
}

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return 'Not available';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 8) + ' UTC';
  } catch {
    return isoStr;
  }
};

export const EvidenceProvenance: React.FC<EvidenceProvenanceProps> = ({ item }) => {
  return (
    <div className="drawer-section">
      <div className="drawer-section-title">
        <span>Evidence Provenance</span>
      </div>
      <div className="evidence-provenance-box">
        {/* Collector Source */}
        <div className="drawer-prop-row">
          <span className="drawer-prop-label">Collector Source</span>
          <span className="drawer-prop-val">{item.source || 'Not available'}</span>
        </div>

        {/* Source URL */}
        <div className="drawer-prop-row">
          <span className="drawer-prop-label">Source URL</span>
          <span className="drawer-prop-val">
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="evidence-external-link"
                title={`Open source: ${item.source_url}`}
              >
                <span>{item.source_url}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No source URL available
              </span>
            )}
          </span>
        </div>

        {/* Collection Timestamp */}
        <div className="drawer-prop-row">
          <span className="drawer-prop-label">Collected At</span>
          <span className="drawer-prop-val">{formatDate(item.collected_at)}</span>
        </div>

        {/* Confidence */}
        <div className="drawer-prop-row">
          <span className="drawer-prop-label">Observation Confidence</span>
          <span
            className="drawer-prop-val"
            title="Authoritative collector observation confidence."
          >
            {item.confidence.toFixed(2)} (Factual Telemetry)
          </span>
        </div>

        {/* Evidence ID */}
        <div className="drawer-prop-row">
          <span className="drawer-prop-label">Evidence ID</span>
          <span className="drawer-prop-val" style={{ fontSize: '0.68rem' }}>
            {item.id || 'Not available'}
          </span>
        </div>
      </div>
    </div>
  );
};
