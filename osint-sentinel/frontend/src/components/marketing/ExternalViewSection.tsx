import React, { useState } from 'react';

interface EntityDefinition {
  type: string;
  countLabel: string;
  description: string;
  example: string;
  icon: React.ReactNode;
}

export const ExternalViewSection: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('Domain');

  const entities: EntityDefinition[] = [
    {
      type: 'Domain',
      countLabel: 'Apex Roots',
      description: 'Registered organizational root domains, DNS zones, and authoritative RDAP registry entities.',
      example: 'company-core.org',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      type: 'Host',
      countLabel: 'Subdomains & FQDNs',
      description: 'Public hostnames discovered via authoritative DNS queries, CT records, and HTTP responses.',
      example: 'auth-gateway.company-core.org',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      type: 'IP',
      countLabel: 'IPv4 / IPv6 Addresses',
      description: 'Network-layer IP addresses resolved directly from authoritative DNS A and AAAA records.',
      example: '198.51.100.24',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      type: 'Certificate',
      countLabel: 'TLS Records',
      description: 'Public Certificate Transparency records, Subject Alternative Names (SANs), issuers, and validity windows.',
      example: 'CN=*.company-core.org (Valid)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      type: 'Technology',
      countLabel: 'Observed Stacks',
      description: 'Web servers, application frameworks, proxies, and meta generators detected from HTTP responses.',
      example: 'Nginx 1.24 / Next.js / Express',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      type: 'Evidence',
      countLabel: 'Raw Artifacts',
      description: 'Authoritative collector records, raw DNS answers, HTTP header responses, and collector timestamps.',
      example: 'EVID-DNS-2026-9042',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      type: 'Dependency',
      countLabel: 'SaaS & Integrations',
      description: 'External CNAME targets, delegated nameservers, mail exchange hosts, and SPF include references.',
      example: 'Google Workspace MX / Cloudflare CDN',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
    },
    {
      type: 'Exposure Signal',
      countLabel: 'Surface Conditions',
      description: 'Factual exposure conditions: remote access indicators, test subdomains, missing SPF/DMARC, or expiring certs.',
      example: 'Missing DMARC / Dev Subdomain',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  const currentEntity = entities.find((e) => e.type === selectedEntity) || entities[0];

  return (
    <section id="product" className="marketing-section marketing-section-white">
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
            CONNECTED INTELLIGENCE MODEL
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
            ONE EXTERNAL VIEW. MANY CONNECTED OBSERVATIONS.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            OSINT Sentinel turns fragmented public observations into a connected external
            intelligence model. Each entity belongs to an auditable graph of discovered assets.
          </p>
        </div>

        {/* Interactive Entity Relationship Visualization */}
        <div className="external-view-layout">
          {/* Left: 8 Entity Types Matrix */}
          <div className="entity-matrix">
            {entities.map((item) => {
              const isSelected = selectedEntity === item.type;
              return (
                <div
                  key={item.type}
                  onClick={() => setSelectedEntity(item.type)}
                  className="entity-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--ds-color-cobalt, #2563EB)' : '#E5E7EB',
                    backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                    boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.1)' : 'none',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div
                    className="entity-icon-box"
                    style={{
                      backgroundColor: isSelected ? 'var(--ds-color-cobalt, #2563EB)' : '#EEF4FF',
                      color: isSelected ? '#FFFFFF' : '#2563EB',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="entity-name">{item.type}</h4>
                    <p className="entity-desc">{item.countLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Entity Inspector Detail Card */}
          <div
            style={{
              backgroundColor: '#111827',
              borderRadius: 'var(--ds-radius-card, 14px)',
              padding: '32px',
              color: '#FFFFFF',
              boxShadow: 'var(--ds-shadow-dark-md, 0 8px 24px rgba(0, 0, 0, 0.4))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="marketing-illustrative-tag-dark">[ILLUSTRATIVE EXAMPLE]</span>
                <span
                  style={{
                    fontFamily: 'var(--ds-font-mono, monospace)',
                    fontSize: '0.75rem',
                    color: '#60A5FA',
                    fontWeight: 600,
                  }}
                >
                  ENTITY INSPECTOR
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Active Entity Type</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                {currentEntity.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  {currentEntity.type} Entity
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>
                  {currentEntity.countLabel}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#D1D5DB', marginBottom: '24px' }}>
              {currentEntity.description}
            </p>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'var(--ds-font-mono, monospace)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ color: '#9CA3AF', fontSize: '0.6875rem', marginBottom: '6px', textTransform: 'uppercase' }}>
                Observed Graph Property Sample
              </div>
              <div style={{ color: '#60A5FA' }}>{currentEntity.example}</div>
            </div>

            <div
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#9CA3AF',
              }}
            >
              <span>Evidence Provenance: <strong style={{ color: '#34D399' }}>Source + Timestamp</strong></span>
              <span>Deterministic Context</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
