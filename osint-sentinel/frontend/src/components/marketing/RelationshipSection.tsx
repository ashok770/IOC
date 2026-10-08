import React from 'react';

export const RelationshipSection: React.FC = () => {
  return (
    <section id="relationships" className="marketing-section marketing-section-obsidian">
      <div className="marketing-container">
        {/* Section Header */}
        <div style={{ maxWidth: '840px' }}>
          <div className="marketing-eyebrow marketing-eyebrow-obsidian">
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#60A5FA',
              }}
            />
            DETERMINISTIC CORRELATION
          </div>

          <h2
            style={{
              fontSize: '2.5rem',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: '0 0 20px 0',
              textTransform: 'uppercase',
            }}
          >
            THE VALUE ISN'T ONLY IN WHAT YOU DISCOVER. IT'S IN HOW THE PIECES CONNECT.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: '#D1D5DB',
              margin: 0,
            }}
          >
            Isolated observations produce noise. OSINT Sentinel constructs a multi-layered
            dependency and correlation tree that connects apex domains to edge hosts,
            cryptographic certificates, underlying technologies, and verifiable evidence artifacts.
          </p>
        </div>

        {/* Obsidian Technical Intelligence Surface */}
        <div className="relationship-canvas-container">
          <div className="relationship-canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="marketing-illustrative-tag-dark">[ILLUSTRATIVE EXAMPLE]</span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--ds-font-mono, monospace)',
                  color: '#9CA3AF',
                }}
              >
                CORRELATION HIERARCHY TREE
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--ds-font-mono, monospace)',
                color: '#60A5FA',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                padding: '3px 10px',
                borderRadius: '4px',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              DETERMINISTIC GRAPH
            </span>
          </div>

          {/* Crisp Vector Relationship Hierarchy Visual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
            {/* Visual Vector Tree */}
            <div
              style={{
                backgroundColor: '#0D0F14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '32px 28px',
                fontFamily: 'var(--ds-font-mono, monospace)',
                fontSize: '0.875rem',
                lineHeight: 1.8,
                color: '#E5E7EB',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontWeight: 700 }}>
                <span>◆ Domain</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[apex-root.org]</span>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '2px 0' }}> │</div>

              {/* Host Branch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93C5FD' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}> ├──</span>
                <span>Host</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[gateway.apex-root.org]</span>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '2px 0' }}> │    │</div>

              {/* Tech Child of Host */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA', paddingLeft: '14px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}> └──</span>
                <span>Technology</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[Nginx / OpenSSL]</span>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '2px 0' }}> │</div>

              {/* Certificate Branch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}> ├──</span>
                <span>Certificate</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[CN=*.apex-root.org]</span>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '2px 0' }}> │</div>

              {/* Evidence Branch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}> └──</span>
                <span>Evidence</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[EVID-CT-LOG-4491]</span>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '2px 0' }}>      │</div>

              {/* Dependency Child of Evidence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F472B6', paddingLeft: '28px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}> └──</span>
                <span>Dependency</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>[Let's Encrypt R3]</span>
              </div>
            </div>

            {/* Explanatory Annotations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                  Evidence-Based Correlation
                </h4>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#9CA3AF', margin: 0 }}>
                  Nodes in the correlation graph are not linked by speculation. Links represent
                  concrete certificate SAN inclusions, authoritative DNS CNAME / A pointers,
                  and observed HTTP response headers.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                  No Unverified Inference
                </h4>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#9CA3AF', margin: 0 }}>
                  OSINT Sentinel distinguishes observed evidence from analytical exposure signals.
                  We avoid speculative exploit chains, unverified vulnerability claims, or
                  artificial attack probability calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
