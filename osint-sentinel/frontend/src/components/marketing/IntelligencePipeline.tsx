import React from 'react';

export const IntelligencePipeline: React.FC = () => {
  const stages = [
    {
      num: '01',
      name: 'DISCOVER',
      tagline: 'Public Ingestion',
      description:
        'Gather publicly observable DNS records, TLS certificates, RDAP registration records, and HTTP web-root headers without invasive probing.',
    },
    {
      num: '02',
      name: 'CORRELATE',
      tagline: 'Deterministic Graph',
      description:
        'Link hostnames, IP addresses, DNS records, and certificate SAN entries into an interconnected entity relationship model.',
    },
    {
      num: '03',
      name: 'ANALYZE',
      tagline: 'Component Fingerprinting',
      description:
        'Identify web servers, reverse proxies, frameworks, and third-party dependencies from factual protocol response signatures.',
    },
    {
      num: '04',
      name: 'PRIORITIZE',
      tagline: 'Exposure Identification',
      description:
        'Surface configuration drift, sensitive hostnames, expiring certificates or domains, and email security gaps based on factual exposure signals.',
    },
    {
      num: '05',
      name: 'INVESTIGATE',
      tagline: 'Provenance Auditing',
      description:
        'Inspect individual findings down to raw collector timestamps, source records, and authoritative collector output.',
    },
    {
      num: '06',
      name: 'REPORT',
      tagline: 'Deterministic Export',
      description:
        'Generate structured, auditable exposure assessment documentation for security stakeholders and engineering leads.',
    },
  ];

  return (
    <section id="methodology" className="marketing-section">
      <div className="marketing-container">
        {/* Section Header */}
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
            SYSTEM ARCHITECTURE
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
            FROM RAW SIGNALS TO INTELLIGENCE.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            OSINT Sentinel transforms disparate external data points into verifiable,
            structured exposure assessments through a rigorous six-stage deterministic pipeline.
          </p>
        </div>

        {/* Directional Six-Stage Track */}
        <div className="pipeline-track">
          {stages.map((stage, idx) => (
            <div key={idx} className="pipeline-step">
              <div className="pipeline-step-number">{stage.num}</div>
              <h3 className="pipeline-step-title">{stage.name}</h3>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--ds-font-mono, monospace)',
                  color: 'var(--ds-color-cobalt, #2563EB)',
                  marginBottom: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {stage.tagline}
              </div>
              <p className="pipeline-step-text">{stage.description}</p>

              {idx < stages.length - 1 && (
                <div className="pipeline-arrow" aria-hidden="true">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
