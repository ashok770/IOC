import React from 'react';
import { RiskAssessment } from '../../types';

interface FactorBreakdownCardProps {
  risk: RiskAssessment | null;
  isLoading: boolean;
}

interface FactorMeta {
  key: string;
  name: string;
  category: string;
  description: (score: number) => string;
}

const FACTOR_DEFINITIONS: FactorMeta[] = [
  {
    key: 'perimeter_exposure',
    name: 'Perimeter Exposure',
    category: 'perimeter_exposure',
    description: (s) =>
      s > 0
        ? 'Public DNS reveals remote access or development/test gateway entrypoints.'
        : 'No exposed remote access gateways or test subdomains observed.',
  },
  {
    key: 'email_defense_posture',
    name: 'Email Defense Posture',
    category: 'email_defense',
    description: (s) =>
      s > 0
        ? 'Permissive, soft-fail (~all), or incomplete email authentication records (SPF/DMARC) observed.'
        : 'Defensive email authentication records (SPF and DMARC) verified.',
  },
  {
    key: 'technology_disclosure',
    name: 'Technology Disclosure',
    category: 'technology_disclosure',
    description: (s) =>
      s > 0
        ? 'Observable server, framework, or edge CDN signatures exposed in response headers.'
        : 'No observable software stack or version disclosures detected.',
  },
  {
    key: 'external_dependencies',
    name: 'External Dependencies',
    category: 'external_dependencies',
    description: (s) =>
      s > 0
        ? 'Target domain routes to external third-party infrastructure (e.g. delegated nameservers).'
        : 'Perimeter infrastructure self-contained within registered scope.',
  },
];

export const FactorBreakdownCard: React.FC<FactorBreakdownCardProps> = ({
  risk,
  isLoading,
}) => {
  const breakdown = risk?.factors_breakdown || {};

  return (
    <div className="factors-card">
      <div className="factors-title-row">
        <h2 className="score-card-title">Contributing Exposure Factors</h2>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          DETERMINISTIC RULES
        </span>
      </div>

      <div className="factors-list">
        {FACTOR_DEFINITIONS.map((def) => {
          const score = breakdown[def.key] ?? 0.0;
          const isClean = score === 0;

          // Check if the backend provided a specific recommendation rationale for this factor category
          const matchingRec = risk?.recommendations?.find(
            (r) => r.category === def.category || r.category === def.key
          );
          const factorDescription = matchingRec?.rationale || def.description(score);

          return (
            <div key={def.key} className="factor-item">
              <div className="factor-item-info">
                <span className="factor-item-name">{def.name}</span>
                <span className="factor-item-desc">
                  {isLoading ? 'Loading factor observation...' : factorDescription}
                </span>
              </div>
              <div className={`factor-item-impact ${isClean ? 'clean' : 'penalty'}`}>
                {isLoading ? '--' : isClean ? '0.0' : `+${score.toFixed(1)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
