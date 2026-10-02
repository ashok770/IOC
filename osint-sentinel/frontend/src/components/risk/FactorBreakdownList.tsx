import React from 'react';

interface FactorMeta {
  title: string;
  maxScore: number;
  description: string;
  rationale: string;
  observedCondition: (score: number) => string;
}

const FACTOR_DEFINITIONS: Record<string, FactorMeta> = {
  perimeter_exposure: {
    title: 'Perimeter Exposure',
    maxScore: 35.0,
    description: 'Publicly routable entrypoints, remote access gateways, and non-production infrastructure.',
    rationale: 'Public DNS discloses access gateways and pre-production hostnames, exposing authentication portals and unhardened systems to passive reconnaissance.',
    observedCondition: (score: number) => {
      if (score >= 35.0) return 'Observed remote access portal and pre-production test hostnames in public DNS.';
      if (score >= 20.0) return 'Observed remote access gateway indicator (VPN/portal) in public DNS.';
      if (score >= 15.0) return 'Observed development/staging hostnames in public DNS.';
      return 'No remote access gateways or pre-production hostnames observed in public DNS.';
    },
  },
  email_defense_posture: {
    title: 'Email Defenses',
    maxScore: 30.0,
    description: 'Domain email authentication configurations (SPF records, DMARC policies, and enforcement strength).',
    rationale: 'Authoritative DNS mail routing configurations dictate domain spoofing resistance. Missing or permissive policies allow unauthenticated senders.',
    observedCondition: (score: number) => {
      if (score >= 30.0) return 'Missing both SPF record and DMARC policy on apex domain.';
      if (score >= 20.0) return 'Missing SPF record or non-enforcing DMARC policy (p=none).';
      if (score >= 15.0) return 'Missing DMARC policy or missing SPF record.';
      if (score >= 8.0) return 'Non-enforcing DMARC policy (p=none) or permissive SPF qualifier.';
      if (score >= 3.0) return 'Softfail SPF qualifier (~all) observed; DMARC policy evaluated.';
      return 'Enforcing email defenses observed (strict SPF -all with enforcing DMARC policy).';
    },
  },
  technology_disclosure: {
    title: 'Technology Stack',
    maxScore: 20.0,
    description: 'Server banners, HTTP response headers, and disclosed software version tokens.',
    rationale: 'Public response headers disclose granular technology fingerprints and version identifiers, facilitating targeted reconnaissance.',
    observedCondition: (score: number) => {
      if (score >= 15.0) return 'Granular software versions disclosed in public HTTP response headers.';
      if (score >= 7.5) return 'Software version identifier observed in response headers.';
      if (score >= 2.5) return 'Technology products identified via public HTTP response headers (e.g. web server banner).';
      return 'No technology fingerprints or software version disclosures observed in response headers.';
    },
  },
  external_dependencies: {
    title: 'External Dependencies',
    maxScore: 8.0,
    description: 'Architectural reliance on third-party nameservers, CDNs, and external service delegations.',
    rationale: 'Observed delegations to external third-party infrastructure. Target ownership is not assumed; represents architectural footprint.',
    observedCondition: (score: number) => {
      if (score >= 8.0) return '3 or more external infrastructure delegations (nameservers/CDNs) observed.';
      if (score >= 4.0) return '1 to 2 external infrastructure delegations observed in authoritative DNS.';
      return 'No external third-party delegations observed outside primary domain scope.';
    },
  },
};

interface FactorBreakdownListProps {
  factorsBreakdown: Record<string, number>;
}

export const FactorBreakdownList: React.FC<FactorBreakdownListProps> = ({
  factorsBreakdown,
}) => {
  const factorKeys = Object.keys(factorsBreakdown);

  if (factorKeys.length === 0) {
    return (
      <div className="risk-factors-empty">
        <p className="risk-empty-text">No factor breakdown data returned by backend.</p>
      </div>
    );
  }

  return (
    <div className="risk-factors-section">
      <div className="risk-section-header">
        <div>
          <h3 className="risk-section-title">WHY THIS SCORE?</h3>
          <p className="risk-section-subtitle">
            Deterministic breakdown of observed external exposure factors contributing to investigation priority.
          </p>
        </div>
      </div>

      <div className="risk-factors-grid">
        {factorKeys.map((key) => {
          const score = factorsBreakdown[key] ?? 0;
          const meta = FACTOR_DEFINITIONS[key] || {
            title: key.replace(/_/g, ' ').toUpperCase(),
            maxScore: 25.0,
            description: 'Observed external exposure factor evaluated by risk engine.',
            rationale: 'Observed exposure factor contributing to investigation priority.',
            observedCondition: (s: number) =>
              s > 0
                ? 'Observed exposure factor contributing to investigation priority.'
                : 'No exposure factor observed for this category.',
          };

          const percentage = Math.min(100, Math.max(0, (score / meta.maxScore) * 100));
          const hasExposure = score > 0;

          return (
            <div
              key={key}
              className={`risk-factor-card ${hasExposure ? 'has-exposure' : 'no-exposure'}`}
            >
              <div className="factor-card-header">
                <div className="factor-title-group">
                  <span className="factor-title">{meta.title}</span>
                  <span className="factor-category-key">{key}</span>
                </div>
                <div className="factor-score-badge">
                  <span className="factor-score-num">{score.toFixed(1)}</span>
                  <span className="factor-score-max">/ {meta.maxScore.toFixed(0)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="factor-progress-track">
                <div
                  className={`factor-progress-fill ${
                    percentage >= 75
                      ? 'fill-critical'
                      : percentage >= 50
                      ? 'fill-high'
                      : percentage > 0
                      ? 'fill-medium'
                      : 'fill-zero'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Observed Condition */}
              <div className="factor-detail-row">
                <span className="factor-detail-label">OBSERVED CONDITION</span>
                <span className="factor-detail-value">{meta.observedCondition(score)}</span>
              </div>

              {/* Rationale */}
              <div className="factor-detail-row">
                <span className="factor-detail-label">ASSESSMENT RATIONALE</span>
                <p className="factor-rationale-text">{meta.rationale}</p>
              </div>

              {/* Status Note */}
              <div className="factor-card-footer">
                <span className={`factor-status-pill ${hasExposure ? 'status-contributing' : 'status-clean'}`}>
                  {hasExposure ? (
                    <>
                      <span className="status-dot warning" aria-hidden="true" />
                      <span>CONTRIBUTING FACTOR (+{score.toFixed(1)} pts)</span>
                    </>
                  ) : (
                    <>
                      <span className="status-dot success" aria-hidden="true" />
                      <span>NO OBSERVED PENALTY (0.0 pts)</span>
                    </>
                  )}
                </span>
                <span className="factor-semantics-tag">Observed Exposure Factor</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
