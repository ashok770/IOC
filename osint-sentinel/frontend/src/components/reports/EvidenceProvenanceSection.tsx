import React, { useMemo, useState } from 'react';
import { EvidenceItem } from '../../types';

interface EvidenceProvenanceSectionProps {
  evidenceItems: EvidenceItem[];
  totalEvidenceCount: number;
}

const SAMPLE_LIMIT = 15;

export const EvidenceProvenanceSection: React.FC<EvidenceProvenanceSectionProps> = ({
  evidenceItems,
  totalEvidenceCount,
}) => {
  const [showAllSamples, setShowAllSamples] = useState<boolean>(false);

  // Summarize count by evidence type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evidenceItems.forEach((ev) => {
      counts[ev.evidence_type] = (counts[ev.evidence_type] || 0) + 1;
    });
    return counts;
  }, [evidenceItems]);

  const displayedItems = showAllSamples ? evidenceItems : evidenceItems.slice(0, SAMPLE_LIMIT);

  return (
    <section className="report-section" id="evidence-provenance">
      <div className="report-section-header">
        <span className="section-number">06</span>
        <h2 className="section-title">EVIDENCE & PROVENANCE</h2>
      </div>

      <p className="report-section-desc">
        Factual telemetry artifacts collected from authoritative sources ({totalEvidenceCount} verified records cataloged).
      </p>

      {/* Breakdown Pills */}
      <div className="evidence-type-pills">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="evidence-type-pill">
            <span className="type-pill-name">{type}</span>
            <span className="type-pill-count monospace">{count}</span>
          </div>
        ))}
      </div>

      {evidenceItems.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No evidence records cataloged for this target scope.</p>
        </div>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>EVIDENCE ID</th>
                <th style={{ width: '18%' }}>TYPE</th>
                <th style={{ width: '15%' }}>SOURCE</th>
                <th style={{ width: '10%' }}>CONFIDENCE</th>
                <th style={{ width: '20%' }}>COLLECTED AT</th>
                <th style={{ width: '15%' }}>OBSERVATION</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((ev) => {
                const shortId = ev.id.slice(0, 8);
                const dataSummary = ev.data?.record_type
                  ? `${ev.data.record_type} Record`
                  : ev.data?.domain
                  ? `Domain: ${ev.data.domain}`
                  : ev.evidence_type;

                return (
                  <tr key={ev.id}>
                    <td>
                      <span className="monospace evidence-id-cell" title={ev.id}>
                        {shortId}...
                      </span>
                    </td>
                    <td>
                      <span className="report-badge evidence-badge">{ev.evidence_type}</span>
                    </td>
                    <td>
                      <span className="monospace source-cell">{ev.source}</span>
                    </td>
                    <td>
                      <span className="monospace">{(ev.confidence * 100).toFixed(0)}%</span>
                    </td>
                    <td>
                      <span className="monospace report-time-cell">
                        {new Date(ev.collected_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className="observation-summary-cell" title={JSON.stringify(ev.data)}>
                        {dataSummary}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="report-table-truncation-note">
            <span>
              Showing {displayedItems.length} representative records. Additional evidence records are available in{' '}
              <strong>Evidence & Provenance</strong>.
            </span>
            {evidenceItems.length > SAMPLE_LIMIT && (
              <button
                type="button"
                className="btn-toggle-inline"
                onClick={() => setShowAllSamples(!showAllSamples)}
              >
                {showAllSamples ? 'Show Sample (15)' : `Show All Loaded (${evidenceItems.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
