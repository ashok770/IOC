import React from 'react';

interface AssessmentBasisCardProps {
  primaryDomain: string;
  assessmentStatus: string;
  totalAssets?: number;
  totalSignals?: number;
}

export const AssessmentBasisCard: React.FC<AssessmentBasisCardProps> = ({
  primaryDomain,
  assessmentStatus,
  totalAssets,
  totalSignals,
}) => {
  return (
    <div className="risk-basis-container">
      {/* Assessment Basis */}
      <div className="risk-basis-card">
        <div className="risk-basis-header">
          <svg
            className="risk-basis-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 6 12 12 16 14" />
          </svg>
          <div>
            <h3 className="risk-basis-title">ASSESSMENT BASIS</h3>
            <span className="risk-basis-subtitle">Factual Data Inputs & Signal Origins</span>
          </div>
        </div>

        <p className="risk-basis-intro">
          The external exposure score is computed strictly from verifiable, deterministic observations
          collected during authorized passive reconnaissance:
        </p>

        <ul className="risk-basis-list">
          <li className="risk-basis-item">
            <span className="basis-bullet-tag">ASSETS</span>
            <div className="basis-content">
              <strong>Observed External Assets:</strong> Authoritative DNS A/AAAA, NS, MX, and SOA records
              identifying publicly accessible hosts, apex domains, and routed IP addresses
              {totalAssets !== undefined && ` (${totalAssets} assets indexed)`}.
            </div>
          </li>
          <li className="risk-basis-item">
            <span className="basis-bullet-tag">TECHNOLOGY</span>
            <div className="basis-content">
              <strong>Passive Technology Observations:</strong> Response headers (e.g. Server, X-Powered-By)
              and DNS service signatures matched against deterministic regex rules without intrusive probing.
            </div>
          </li>
          <li className="risk-basis-item">
            <span className="basis-bullet-tag">EMAIL</span>
            <div className="basis-content">
              <strong>Email Authentication Observations:</strong> Authoritative TXT records evaluated for
              SPF qualifier rigor (-all / ~all / +all) and _dmarc policy enforcement (p=reject / p=quarantine / p=none).
            </div>
          </li>
          <li className="risk-basis-item">
            <span className="basis-bullet-tag">DEPENDENCIES</span>
            <div className="basis-content">
              <strong>External Infrastructure References:</strong> Observed delegations to third-party CDNs,
              hosted mail, and authoritative DNS providers. Target ownership is not assumed.
            </div>
          </li>
          <li className="risk-basis-item">
            <span className="basis-bullet-tag">SIGNALS</span>
            <div className="basis-content">
              <strong>Deterministic Exposure Signals:</strong> Factual exposure indicators including remote-access
              gateways and non-production testing hostnames
              {totalSignals !== undefined && ` (${totalSignals} signals observed)`}.
            </div>
          </li>
        </ul>
      </div>

      {/* Assessment Integrity */}
      <div className="risk-integrity-card">
        <div className="risk-basis-header">
          <svg
            className="risk-basis-icon integrity-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <h3 className="risk-basis-title">ASSESSMENT INTEGRITY</h3>
            <span className="risk-basis-subtitle">Operational Boundaries & Safeguards</span>
          </div>
        </div>

        <div className="risk-integrity-grid">
          <div className="integrity-metric">
            <span className="integrity-label">ASSESSMENT MODE</span>
            <span className="integrity-value highlight-cyan">Authorized / Passive</span>
          </div>

          <div className="integrity-metric">
            <span className="integrity-label">EXECUTION POLICY</span>
            <span className="integrity-value highlight-violet">Non-Intrusive / Zero Exploitation</span>
          </div>

          <div className="integrity-metric">
            <span className="integrity-label">EVIDENCE BASIS</span>
            <span className="integrity-value">Deterministic / Evidenced</span>
          </div>

          <div className="integrity-metric">
            <span className="integrity-label">ASSESSMENT SCOPE</span>
            <span className="integrity-value monospace">{primaryDomain}</span>
          </div>

          <div className="integrity-metric">
            <span className="integrity-label">COLLECTION STATUS</span>
            <span className="integrity-value capitalize">{assessmentStatus}</span>
          </div>

          <div className="integrity-metric">
            <span className="integrity-label">METHODOLOGY VERSION</span>
            <span className="integrity-value monospace">v1.0 (Heuristic Rules)</span>
          </div>
        </div>

        <div className="risk-integrity-disclaimer">
          <svg
            className="disclaimer-mini-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>
            <strong>Defensive Boundary Notice:</strong> OSINT Sentinel observes publicly available
            exposure telemetry only. This assessment does not claim 100% security coverage,
            complete vulnerability discovery, or exploit guarantee.
          </span>
        </div>
      </div>
    </div>
  );
};
