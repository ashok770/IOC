import React from 'react';

export const AuthorizedAssessmentSection: React.FC = () => {
  const principles = [
    {
      num: '01',
      title: 'PASSIVE-FIRST',
      subtitle: 'Public Reconnaissance',
      description: 'Public intelligence before active interaction. We aggregate external, publicly visible telemetry without invasive probes or unauthorized queries.',
    },
    {
      num: '02',
      title: 'NON-INTRUSIVE',
      subtitle: 'Zero Disruption',
      description: 'No exploitation or destructive testing. Operations evaluate external exposure surfaces strictly within non-invasive protocol standards.',
    },
    {
      num: '03',
      title: 'EVIDENCE-DRIVEN',
      subtitle: 'Authoritative Proof',
      description: 'Observations remain traceable to their sources. Every identified asset or exposure signal includes collector provenance and verifiable timestamps.',
    },
    {
      num: '04',
      title: 'AUDITABLE',
      subtitle: 'Historical Accountability',
      description: 'Assessment activity and historical runs remain accountable. Full audit logs preserve when each run occurred, what scope was inspected, and who authorized it.',
    },
  ];

  return (
    <section id="security" className="marketing-section marketing-section-white">
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
            GOVERNANCE & INTEGRITY
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
            BUILT FOR AUTHORIZED ASSESSMENTS.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            OSINT Sentinel is purpose-built for security teams, infrastructure engineers,
            and compliance leaders who require factual external exposure intelligence within
            rigorous authorization boundaries.
          </p>
        </div>

        {/* Four Principles Grid */}
        <div className="principles-grid">
          {principles.map((p, idx) => (
            <div key={idx} className="principle-card">
              <div className="principle-card-number">{p.num}</div>
              <h3 className="principle-title">{p.title}</h3>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--ds-font-mono, monospace)',
                  color: 'var(--ds-color-cobalt, #2563EB)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                {p.subtitle}
              </div>
              <p className="principle-text">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
