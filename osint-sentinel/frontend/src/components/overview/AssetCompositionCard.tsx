import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../types';

interface AssetCompositionCardProps {
  assets: Asset[];
  primaryDomain: string;
  isLoading: boolean;
}

export const AssetCompositionCard: React.FC<AssetCompositionCardProps> = ({
  assets,
  primaryDomain,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const domains = assets.filter((a) => a.asset_type === 'domain');
  const subdomains = assets.filter((a) => a.asset_type === 'subdomain');
  const ips = assets.filter((a) => a.asset_type === 'ip');
  const certHostnames = assets.filter(
    (a) => a.asset_type === 'certificate_associated_hostname' || a.asset_type === 'certificate_hostname'
  );

  const total = assets.length;

  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const domainPct = getPercent(domains.length);
  const subPct = getPercent(subdomains.length);
  const ipPct = getPercent(ips.length);
  const certPct = getPercent(certHostnames.length);

  // SVG Donut calculation
  // Radius = 54 -> Circumference = 2 * PI * 54 = 339.292
  const c = 2 * Math.PI * 54;
  const domainLen = (domains.length / (total || 1)) * c;
  const subLen = (subdomains.length / (total || 1)) * c;
  const ipLen = (ips.length / (total || 1)) * c;
  const certLen = (certHostnames.length / (total || 1)) * c;

  const domainOffset = 0;
  const subOffset = domainLen;
  const ipOffset = domainLen + subLen;
  const certOffset = domainLen + subLen + ipLen;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <section className="asset-composition-section" aria-label="Asset Intelligence and Perimeter Surface">
      {/* Section Header */}
      <div className="asset-section-top-header">
        <div>
          <h2 className="overview-section-heading">Asset Intelligence & Perimeter Surface</h2>
          <p className="overview-section-subhead">
            Composition analysis and categorized perimeter inventory discovered across the external attack surface
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/assets')}
          title="Open Asset Intelligence module"
        >
          <span>VIEW FULL ASSET INVENTORY</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {isLoading ? (
        <div className="state-box" style={{ minHeight: 180 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading perimeter asset intelligence...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="state-box" style={{ minHeight: 140 }}>
          <span className="state-title">No Assets Cataloged</span>
          <p className="state-message">Execute passive external assessment to catalog perimeter assets.</p>
        </div>
      ) : (
        <div className="asset-intelligence-layout">
          {/* Top Panel: SVG Donut Chart + Asset Distribution Analytics */}
          <div className="composition-analytics-block">
            <div className="composition-header-row">
              <span className="composition-title">External Perimeter Composition</span>
              <span className="composition-count-chip">{total} Assessed Entities</span>
            </div>

            <div className="donut-and-breakdown-row">
              {/* SVG Donut Chart Visual */}
              <div className="donut-chart-wrapper">
                <svg className="donut-svg" viewBox="0 0 140 140" aria-label="Asset composition donut chart">
                  <g transform="rotate(-90 70 70)">
                    {/* Background Ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="14"
                    />

                    {/* Domain Segment (Cyan) */}
                    {domains.length > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke="#00c8e5"
                        strokeWidth="14"
                        strokeDasharray={`${domainLen} ${c - domainLen}`}
                        strokeDashoffset={-domainOffset}
                      />
                    )}

                    {/* Subdomains Segment (Sky Blue) */}
                    {subdomains.length > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="14"
                        strokeDasharray={`${subLen} ${c - subLen}`}
                        strokeDashoffset={-subOffset}
                      />
                    )}

                    {/* IPs Segment (Teal) */}
                    {ips.length > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="14"
                        strokeDasharray={`${ipLen} ${c - ipLen}`}
                        strokeDashoffset={-ipOffset}
                      />
                    )}

                    {/* Cert Hostnames Segment (Violet) */}
                    {certHostnames.length > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke="#7c5cfc"
                        strokeWidth="14"
                        strokeDasharray={`${certLen} ${c - certLen}`}
                        strokeDashoffset={-certOffset}
                      />
                    )}
                  </g>

                  {/* Center Text Readout */}
                  <g textAnchor="middle" transform="translate(70, 68)">
                    <text y="4" className="donut-center-num">
                      {total}
                    </text>
                    <text y="20" className="donut-center-label">
                      ASSETS
                    </text>
                  </g>
                </svg>
              </div>

              {/* Composition Breakdown Legend & Metrics */}
              <div className="donut-metrics-col">
                <div className="composition-legend-grid">
                  <div className="legend-card legend-card--domain">
                    <div className="legend-header">
                      <span className="legend-indicator dot-domain" aria-hidden="true" />
                      <span className="legend-type-label">Apex Domain</span>
                    </div>
                    <div className="legend-metrics-row">
                      <span className="legend-count">{domains.length}</span>
                      <span className="legend-percentage">{domainPct}% of surface</span>
                    </div>
                  </div>

                  <div className="legend-card legend-card--subdomain">
                    <div className="legend-header">
                      <span className="legend-indicator dot-subdomain" aria-hidden="true" />
                      <span className="legend-type-label">Subdomains</span>
                    </div>
                    <div className="legend-metrics-row">
                      <span className="legend-count">{subdomains.length}</span>
                      <span className="legend-percentage">{subPct}% of surface</span>
                    </div>
                  </div>

                  <div className="legend-card legend-card--ip">
                    <div className="legend-header">
                      <span className="legend-indicator dot-ip" aria-hidden="true" />
                      <span className="legend-type-label">Resolved IPs</span>
                    </div>
                    <div className="legend-metrics-row">
                      <span className="legend-count">{ips.length}</span>
                      <span className="legend-percentage">{ipPct}% of surface</span>
                    </div>
                  </div>

                  <div className="legend-card legend-card--cert">
                    <div className="legend-header">
                      <span className="legend-indicator dot-cert" aria-hidden="true" />
                      <span className="legend-type-label">Cert Hostnames</span>
                    </div>
                    <div className="legend-metrics-row">
                      <span className="legend-count">{certHostnames.length}</span>
                      <span className="legend-percentage">{certPct}% of surface</span>
                    </div>
                  </div>
                </div>

                {/* Linear proportional bar */}
                <div className="composition-bar-track" aria-hidden="true">
                  {domainPct > 0 && <div className="composition-bar-seg seg-domain" style={{ width: `${domainPct}%` }} />}
                  {subPct > 0 && <div className="composition-bar-seg seg-subdomain" style={{ width: `${subPct}%` }} />}
                  {ipPct > 0 && <div className="composition-bar-seg seg-ip" style={{ width: `${ipPct}%` }} />}
                  {certPct > 0 && <div className="composition-bar-seg seg-cert" style={{ width: `${certPct}%` }} />}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Structured Perimeter Surface Hierarchy */}
          <div className="perimeter-surface-hierarchy">
            {/* Primary Apex Scope */}
            <div className="perimeter-tier-card tier-primary-domain">
              <div className="tier-header">
                <span className="tier-label">Primary Domain Scope</span>
                <span className="tier-badge">Apex Scope</span>
              </div>
              <div className="tier-content">
                <span className="primary-domain-tag">{primaryDomain}</span>
                <button
                  type="button"
                  className="tier-copy-btn"
                  onClick={() => handleCopy(primaryDomain)}
                  title="Copy primary domain"
                >
                  {copiedText === primaryDomain ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Subdomains */}
            <div className="perimeter-tier-card">
              <div className="tier-header">
                <span className="tier-label">Discovered Subdomains</span>
                <span className="tier-count">{subdomains.length} Registered</span>
              </div>
              <div className="tier-content tier-content--scroll">
                {subdomains.length > 0 ? (
                  subdomains.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className="technical-pill"
                      onClick={() => handleCopy(sub.value)}
                      title="Click to copy subdomain"
                    >
                      <span>{sub.value}</span>
                      {copiedText === sub.value && <span className="pill-copied-indicator">✓</span>}
                    </button>
                  ))
                ) : (
                  <span className="tier-empty-text">No delegated subdomains observed</span>
                )}
              </div>
            </div>

            {/* Resolved IP Addresses */}
            <div className="perimeter-tier-card">
              <div className="tier-header">
                <span className="tier-label">Resolved IP Addresses</span>
                <span className="tier-count">{ips.length} Active Endpoints</span>
              </div>
              <div className="tier-content tier-content--scroll">
                {ips.length > 0 ? (
                  ips.map((ip) => (
                    <button
                      key={ip.id}
                      type="button"
                      className="technical-pill technical-pill--ip"
                      onClick={() => handleCopy(ip.value)}
                      title="Click to copy IP address"
                    >
                      <span>{ip.value}</span>
                      {copiedText === ip.value && <span className="pill-copied-indicator">✓</span>}
                    </button>
                  ))
                ) : (
                  <span className="tier-empty-text">No IP addresses resolved</span>
                )}
              </div>
            </div>

            {/* Certificate Hostnames */}
            <div className="perimeter-tier-card">
              <div className="tier-header">
                <span className="tier-label">Certificate Hostnames</span>
                <span className="tier-count">{certHostnames.length} Hostnames</span>
              </div>
              <div className="tier-content tier-content--scroll">
                {certHostnames.length > 0 ? (
                  certHostnames.map((cert) => (
                    <span key={cert.id} className="technical-pill">
                      {cert.value}
                    </span>
                  ))
                ) : (
                  <span className="tier-empty-text">None observed via passive CT logs</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
