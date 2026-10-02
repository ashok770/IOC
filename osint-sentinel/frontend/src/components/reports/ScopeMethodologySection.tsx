import React, { useMemo } from 'react';
import { Target, EvidenceItem } from '../../types';

interface ScopeMethodologySectionProps {
  target: Target;
  evidenceItems: EvidenceItem[];
}

export const ScopeMethodologySection: React.FC<ScopeMethodologySectionProps> = ({
  target,
  evidenceItems,
}) => {
  // Detect sources actually present in collected evidence
  const detectedSources = useMemo(() => {
    const sources = new Set<string>();
    evidenceItems.forEach((ev) => {
      const src = ev.source.toLowerCase();
      const type = ev.evidence_type.toLowerCase();
      if (src.includes('dns') || type.includes('dns')) sources.add('DNS');
      if (src.includes('rdap') || type.includes('rdap')) sources.add('RDAP');
      if (src.includes('http') || type.includes('http')) sources.add('HTTP Headers');
      if (
        src.includes('crt') ||
        src.includes('certificate') ||
        type.includes('certificate')
      ) {
        sources.add('Certificate Transparency');
      }
    });
    return Array.from(sources);
  }, [evidenceItems]);

  return (
    <section className="report-section" id="scope-methodology">
      <div className="report-section-header">
        <span className="section-number">02</span>
        <h2 className="section-title">SCOPE & METHODOLOGY</h2>
      </div>

      <div className="report-scope-grid">
        <div className="report-scope-card">
          <h3 className="scope-card-title">OPERATIONAL PARAMETERS</h3>
          <div className="scope-param-list">
            <div className="scope-param-row">
              <span className="param-label">ASSESSMENT MODE</span>
              <span className="param-value highlight-cyan">Authorized / Passive</span>
            </div>
            <div className="scope-param-row">
              <span className="param-label">EXECUTION POLICY</span>
              <span className="param-value highlight-violet">Non-Intrusive / Zero Exploitation</span>
            </div>
            <div className="scope-param-row">
              <span className="param-label">SCOPE BOUNDARY</span>
              <span className="param-value monospace">{target.primary_domain} and discovered records</span>
            </div>
            <div className="scope-param-row">
              <span className="param-label">COLLECTION APPROACH</span>
              <span className="param-value">Passive External OSINT Collection</span>
            </div>
          </div>
        </div>

        <div className="report-scope-card">
          <h3 className="scope-card-title">VERIFIED EVIDENCE SOURCES</h3>
          <p className="scope-card-desc">
            Evidence sources observed in the assessment pipeline for this specific target:
          </p>
          <div className="scope-sources-list">
            {detectedSources.length === 0 ? (
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                Passive collection sources pending execution.
              </span>
            ) : (
              detectedSources.map((source) => (
                <div key={source} className="scope-source-pill">
                  <span className="source-dot" aria-hidden="true" />
                  <span className="source-name">{source}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="methodology-narrative">
        <p>
          The assessment process gathers publicly available telemetry without active service interaction or credentialed
          testing. Authoritative DNS infrastructure is queried for record types including <code>A</code>, <code>AAAA</code>,{' '}
          <code>NS</code>, <code>MX</code>, <code>TXT</code>, and <code>SOA</code>. Web services referenced in public records
          are inspected for publicly returned HTTP response headers and status codes. Discovered domain assets,
          technologies, and exposure indicators are mapped deterministically into an explainable assessment model.
        </p>
      </div>
    </section>
  );
};
