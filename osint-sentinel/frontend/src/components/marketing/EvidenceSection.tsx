import React from 'react';

export const EvidenceSection: React.FC = () => {
  return (
    <section id="evidence" className="marketing-section">
      <div className="marketing-container">
        {/* Editorial Section Header */}
        <div style={{ maxWidth: '820px' }}>
          <div className="marketing-eyebrow">
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--ds-color-cobalt, #2563EB)',
              }}
            />
            FACTUAL PROVENANCE
          </div>

          <h2
            style={{
              fontSize: '2.5rem',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ds-color-graphite, #111827)',
              margin: '0 0 20px 0',
              textTransform: 'uppercase',
            }}
          >
            EVERY CONCLUSION BEGINS WITH AN OBSERVATION.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            OSINT Sentinel separates observed evidence from analytical interpretation.
            Every finding can be traced back to its underlying public evidence.
          </p>
        </div>

        {/* Evidence Provenance Showcase */}
        <div className="evidence-showcase">
          {/* Left: Explanatory Editorial Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--ds-color-graphite, #111827)',
                  margin: 0,
                }}
              >
                Immutable Observation Chains
              </h3>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--ds-color-graphite-muted, #374151)',
                  margin: 0,
                }}
              >
                Unlike heuristic tools that guess risk scores or assume vulnerabilities,
                OSINT Sentinel documents the raw protocol telemetry: collector source,
                exact timestamp, authoritative responses, and correlation paths.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--ds-color-graphite, #111827)',
                  margin: 0,
                }}
              >
                Observation Confidence
              </h3>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--ds-color-graphite-muted, #374151)',
                  margin: 0,
                }}
              >
                Confidence reflects the cryptographic integrity and direct observer confirmation
                of the raw telemetry — not an arbitrary statistical attack probability.
              </p>
            </div>

            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'var(--ds-color-soft-blue, #EEF4FF)',
                borderLeft: '4px solid var(--ds-color-cobalt, #2563EB)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                color: 'var(--ds-color-graphite, #111827)',
              }}
            >
              <strong>Auditable Evidence Principle:</strong> Every reported asset and exposure condition
              maintains a permanent link to the raw collector output for independent verification.
            </div>
          </div>

          {/* Right: Exact Evidence Spec Card */}
          <div className="evidence-spec-card">
            <div className="evidence-spec-header">
              <span className="evidence-spec-title">DNS OBSERVATION</span>
              <span className="marketing-illustrative-tag">[ILLUSTRATIVE EXAMPLE]</span>
            </div>

            <div className="evidence-prop-grid">
              <div className="evidence-prop">
                <div className="evidence-prop-label">Source</div>
                <div className="evidence-prop-value">DNS</div>
              </div>

              <div className="evidence-prop">
                <div className="evidence-prop-label">Record</div>
                <div className="evidence-prop-value">A</div>
              </div>

              <div className="evidence-prop">
                <div className="evidence-prop-label">Observed</div>
                <div className="evidence-prop-value" style={{ color: 'var(--ds-color-cobalt, #2563EB)' }}>
                  198.51.100.24
                </div>
              </div>

              <div className="evidence-prop">
                <div className="evidence-prop-label">Timestamp</div>
                <div className="evidence-prop-value">2026-10-08 14:45 UTC</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280' }}>
                  Telemetry Confidence
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A', fontFamily: 'var(--ds-font-mono, monospace)' }}>
                  99%
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--ds-font-mono, monospace)',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                }}
              >
                STATUS: VERIFIED
              </span>
            </div>

            <div className="evidence-provenance-footer">
              <span>Evidence ID: <code style={{ color: '#111827' }}>EVID-DNS-90412</code></span>
              <span>Direct Authoritative Query</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
