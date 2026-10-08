import React from 'react';

export const TraceSection: React.FC = () => {
  const footprintTraces = [
    {
      category: 'DNS & ZONE RECORDS',
      sourceTag: 'RFC 1035',
      title: 'Authoritative Zone Observations',
      description:
        'A, AAAA, CNAME, MX, and TXT records expose apex domains, delegated mail handlers, verification records, and edge routing gateways.',
      evidenceExample: 'dig +noall +answer IN A target.org',
    },
    {
      category: 'CERTIFICATE TRANSPARENCY',
      sourceTag: 'RFC 6962',
      title: 'Public Cryptographic Logs',
      description:
        'Append-only cryptographic CT logs record every issued TLS certificate, revealing subdomains, wildcard scopes, and CA signing authorities.',
      evidenceExample: 'x509.SAN: api.internal.target.org',
    },
    {
      category: 'EDGE & HTTP GATEWAYS',
      sourceTag: 'HTTP/1.1 & H2',
      title: 'Public Protocol Handshakes',
      description:
        'Standard TLS negotiations and HTTP responses broadcast server headers, security directives, reverse-proxy signatures, and TLS cipher suites.',
      evidenceExample: 'Server: nginx/1.24 | HSTS: max-age=31536000',
    },
    {
      category: 'ROUTING & AUTONOMOUS SYSTEMS',
      sourceTag: 'BGP / RDAP',
      title: 'IP Blocks & CIDR Delegations',
      description:
        'Regional Internet Registries (RIRs) and BGP route announcements map IP ranges, autonomous system numbers (ASNs), and cloud allocations.',
      evidenceExample: 'AS15169 | 198.51.100.0/24 Public CIDR',
    },
    {
      category: 'THIRD-PARTY INTEGRATIONS',
      sourceTag: 'DOM & HEADERS',
      title: 'External SaaS & Dependencies',
      description:
        'Client-side script includes, CSP policies, CDN endpoints, and auth callback URLs document downstream external supply-chain dependencies.',
      evidenceExample: 'CSP: https://cdn.auth0.com https://sentry.io',
    },
    {
      category: 'EXPOSURE SIGNALS',
      sourceTag: 'SURFACE ANOMALY',
      title: 'Public Interface Exposure',
      description:
        'Factual configuration anomalies, exposed administrative interfaces, deprecated TLS protocols, and misplaced origin endpoints.',
      evidenceExample: 'SIGNAL: /metrics Prometheus endpoint public',
    },
  ];

  return (
    <section id="traces" className="marketing-section marketing-section-white">
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
            OBSERVABLE ATTACK SURFACE
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
            EVERY PUBLIC-FACING ORGANIZATION LEAVES AN OBSERVABLE FOOTPRINT.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: 'var(--ds-color-graphite-muted, #374151)',
              margin: 0,
            }}
          >
            Public infrastructure produces observable traces across domains, DNS records,
            certificates, hosts, technologies, dependencies, and other public sources.
            OSINT Sentinel captures these signals passively and deterministically.
          </p>
        </div>

        {/* Connected Intelligence Grid */}
        <div className="trace-grid">
          {footprintTraces.map((trace, idx) => (
            <div key={idx} className="trace-item">
              <div className="trace-item-header">
                <span className="trace-badge">{trace.category}</span>
                <span
                  style={{
                    fontFamily: 'var(--ds-font-mono, monospace)',
                    fontSize: '0.6875rem',
                    color: 'var(--ds-color-text-muted, #6B7280)',
                  }}
                >
                  {trace.sourceTag}
                </span>
              </div>

              <h3 className="trace-item-title">{trace.title}</h3>

              <p className="trace-item-body">{trace.description}</p>

              <div className="trace-item-evidence">
                <span style={{ color: 'var(--ds-color-cobalt, #2563EB)' }}>❯</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {trace.evidenceExample}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
