import React from 'react';

export const AssessmentWorkflow: React.FC = () => {
  const steps = [
    { title: 'TARGET', sub: 'Input Apex / Scope', primary: true },
    { title: 'PUBLIC SOURCES', sub: 'DNS / CT / BGP', primary: false },
    { title: 'EVIDENCE', sub: 'Raw Telemetry', primary: false },
    { title: 'ASSETS', sub: 'Discovered Entities', primary: false },
    { title: 'CORRELATION', sub: 'Entity Graph', primary: false },
    { title: 'EXPOSURE ASSESSMENT', sub: 'Signal Evaluation', primary: false },
    { title: 'REPORT', sub: 'Deterministic Export', primary: true },
  ];

  return (
    <section id="workflow" className="marketing-section">
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
            ASSESSMENT FLOW
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
            FROM TARGET TO ASSESSMENT.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            A continuous, deterministic progression from target definition to comprehensive,
            evidence-backed security reporting.
          </p>
        </div>

        {/* Visual Workflow Nodes */}
        <div className="workflow-horizontal">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`workflow-node ${step.primary ? 'is-primary' : ''}`}>
                <span
                  style={{
                    fontFamily: 'var(--ds-font-mono, monospace)',
                    fontSize: '0.625rem',
                    opacity: 0.7,
                    marginBottom: '4px',
                  }}
                >
                  STEP 0{idx + 1}
                </span>
                <span className="workflow-node-title">{step.title}</span>
                <span className="workflow-node-sub">{step.sub}</span>
              </div>

              {idx < steps.length - 1 && (
                <div className="workflow-connector" aria-hidden="true">
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
