import React from 'react';

export const TraceSection: React.FC = () => {
  const footprintTraces = [
    {
      category: 'DNS & ZONE RECORDS',
      sourceTag: 'RFC 1035',
      title: 'Authoritative Zone Observations',
      description:
        'A, AAAA, CNAME, MX, NS, SOA, and TXT records expose apex domains, delegated mail handlers, verification records, and edge routing gateways.',
      evidenceExample: 'dig +noall +answer IN A target.org',
    },
    {
      category: 'CERTIFICATE TRANSPARENCY',
      sourceTag: 'RFC 6962',
      title: 'Public Cryptographic Logs',
      description:
        'Append-only cryptographic CT logs record issued TLS certificates, revealing subdomains, Subject Alternative Names (SANs), and CA issuers.',
      evidenceExample: 'x509.SAN: api.internal.target.org',
    },
    {
      category: 'HTTP & WEB HEADERS',
      sourceTag: 'RFC 9110 / HTTP',
      title: 'Controlled Web-Root Observations',
      description:
        'Passive web-root observation captures Server, X-Powered-By, Via, and Cloudflare headers to identify web servers, proxies, and meta generators without invasive probing.',
      evidenceExample: 'Server: nginx/1.24 | X-Powered-By: Next.js',
    },
    {
      category: 'DOMAIN REGISTRATION & RDAP',
      sourceTag: 'RFC 9082 / RDAP',
      title: 'Registration Metadata & Status',
      description:
        'Registration authority queries discover registrar details, administrative lifecycle dates, expiration windows, and active domain status indicators.',
      evidenceExample: 'Registrar: MarkMonitor | Status: clientTransferProhibited',
    },
    {
      category: 'EXTERNAL DEPENDENCIES',
      sourceTag: 'DNS & HEADERS',
      title: 'Infrastructure & SaaS References',
      description:
        'Authoritative DNS CNAME pointers, nameservers, MX delegations, SPF includes, and public CDN indicators establish external dependency relationships.',
      evidenceExample: 'CNAME: target.cdn.cloudflare.net | MX: aspmx.l.google.com',
    },
    {
      category: 'EXPOSURE SIGNALS',
      sourceTag: 'DETERMINISTIC SIGNAL',
      title: 'Factual Exposure Signals',
      description:
        'Identifies observable conditions: remote access indicators, development/test hostnames, missing or permissive SPF/DMARC records, and expiring certificates.',
      evidenceExample: 'SIGNAL: Missing DMARC record on apex domain',
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
            PUBLICLY OBSERVABLE FOOTPRINT
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
            certificates, hosts, technologies, dependencies, and registration sources.
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
