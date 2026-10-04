import React from 'react';
import { RiskAssessment } from '../../types';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';

interface PrimaryAssessmentSectionProps {
  risk: RiskAssessment | null;
  isLoading: boolean;
}

interface FactorDefinition {
  key: string;
  name: string;
  category: string;
  maxPoints: number;
  description: (score: number) => string;
}

const FACTOR_DEFINITIONS: FactorDefinition[] = [
  {
    key: 'perimeter_exposure',
    name: 'Perimeter Exposure',
    category: 'perimeter_exposure',
    maxPoints: 30,
    description: (s) =>
      s > 0
        ? 'Public DNS reveals remote access or development/test gateway entrypoints.'
        : 'No exposed remote access gateways or test subdomains observed.',
  },
  {
    key: 'email_defense_posture',
    name: 'Email Defense Posture',
    category: 'email_defense',
    maxPoints: 20,
    description: (s) =>
      s > 0
        ? 'Permissive, soft-fail (~all), or incomplete email authentication records (SPF/DMARC) observed.'
        : 'Defensive email authentication records (SPF and DMARC) verified.',
  },
  {
    key: 'technology_disclosure',
    name: 'Technology Disclosure',
    category: 'technology_disclosure',
    maxPoints: 25,
    description: (s) =>
      s > 0
        ? 'Observable server, framework, or edge CDN signatures exposed in response headers.'
        : 'No observable software stack or version disclosures detected.',
  },
  {
    key: 'external_dependencies',
    name: 'External Dependencies',
    category: 'external_dependencies',
    maxPoints: 25,
    description: (s) =>
      s > 0
        ? 'Target domain routes to external third-party infrastructure (e.g. delegated nameservers).'
        : 'Perimeter infrastructure self-contained within registered scope.',
  },
];

export const PrimaryAssessmentSection: React.FC<PrimaryAssessmentSectionProps> = ({
  risk,
  isLoading,
}) => {
  const getRiskVariant = (level: string): StatusBadgeVariant => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  const score = risk !== null ? risk.overall_score : 0;
  const scoreFormatted = risk !== null ? risk.overall_score.toFixed(1) : '--';
  const riskLevelFormatted = risk ? risk.risk_level.toUpperCase() : 'PENDING';
  const breakdown = risk?.factors_breakdown || {};

  // Arc Gauge Geometry (240 degree arc)
  // Center (120, 105), Radius 78
  // Start angle: 150 deg, End angle: 390 deg
  const radius = 78;
  const circumference = 2 * Math.PI * radius * (240 / 360); // ~326.7
  const scorePercent = Math.min(100, Math.max(0, score));
  const dashOffset = circumference - (scorePercent / 100) * circumference;

  // Arc color based on score band
  const getScoreColor = (val: number) => {
    if (val <= 25) return '#10b981'; // Emerald
    if (val <= 50) return '#f59e0b'; // Amber
    if (val <= 75) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const activeColor = getScoreColor(score);

  // Path for 240 degree arc from 150° to 390°
  // 150 deg: cos(150) = -0.866, sin(150) = 0.5 -> x = 120 + 78*(-0.866) = 52.45, y = 105 + 78*(0.5) = 144
  // 390 deg: cos(390)=cos(30) = 0.866, sin(390)=sin(30)=0.5 -> x = 120 + 78*(0.866) = 187.55, y = 105 + 78*(0.5) = 144
  const arcPath = "M 52.45 144 A 78 78 0 1 1 187.55 144";

  // Calculate active factors statistics
  const activePenalties = Object.values(breakdown).filter((v) => v > 0).length;
  const cleanBaselines = FACTOR_DEFINITIONS.length - activePenalties;

  return (
    <section className="primary-assessment-container" aria-label="External Exposure Assessment">
      {/* Left Pane: Radial Exposure Arc Gauge */}
      <div className="assessment-score-pane">
        <div className="score-pane-header">
          <span className="score-eyebrow">External Exposure Assessment</span>
          <StatusBadge
            label={isLoading ? 'EVALUATING...' : riskLevelFormatted}
            variant={risk ? getRiskVariant(risk.risk_level) : 'neutral'}
          />
        </div>

        {/* SVG Radial Arc Gauge Chart */}
        <div className="radial-gauge-container">
          <svg className="radial-gauge-svg" viewBox="0 0 240 180" aria-hidden="true">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="35%" stopColor="#00c8e5" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc Track */}
            <path
              d={arcPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active Measured Value Arc */}
            <path
              d={arcPath}
              fill="none"
              stroke={activeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />

            {/* Inner Gauge Content */}
            <g transform="translate(120, 95)" textAnchor="middle">
              <text y="-4" className="gauge-svg-score">
                {isLoading ? '...' : scoreFormatted}
              </text>
              <text y="18" className="gauge-svg-scale">
                OUT OF 100
              </text>
              <text y="38" className="gauge-svg-badge" fill={activeColor}>
                ● {riskLevelFormatted} EXPOSURE
              </text>
            </g>
          </svg>

          {/* Scale range indicator chips */}
          <div className="gauge-scale-legend">
            <div className="scale-legend-step">
              <span className="scale-dot scale-dot--low" />
              <span>Low (0-25)</span>
            </div>
            <div className="scale-legend-step">
              <span className="scale-dot scale-dot--med" />
              <span>Med (26-50)</span>
            </div>
            <div className="scale-legend-step">
              <span className="scale-dot scale-dot--high" />
              <span>High (51-75)</span>
            </div>
            <div className="scale-legend-step">
              <span className="scale-dot scale-dot--crit" />
              <span>Crit (76+)</span>
            </div>
          </div>
        </div>

        <p className="score-heuristic-disclaimer">
          Investigation-priority heuristic derived from observed external exposure factors. This score is not a
          vulnerability score, CVSS score, compromise probability, or security guarantee.
        </p>
      </div>

      {/* Right Pane: Contributing Factors Visualization */}
      <div className="assessment-factors-pane">
        <div className="factors-pane-header">
          <div>
            <h2 className="factors-pane-title">Contributing Exposure Factors</h2>
            <p className="factors-pane-subtitle">
              Deterministic rule contributions explaining the current external exposure posture
            </p>
          </div>
          <div className="factors-summary-pill">
            <span>{cleanBaselines} Clean Baselines</span>
            <span className="pill-sep">•</span>
            <span className={activePenalties > 0 ? 'text-amber' : ''}>{activePenalties} Active Factors</span>
          </div>
        </div>

        <div className="factors-horizontal-list">
          {FACTOR_DEFINITIONS.map((def) => {
            const factorScore = breakdown[def.key] ?? 0.0;
            const isClean = factorScore === 0;

            const matchingRec = risk?.recommendations?.find(
              (r) => r.category === def.category || r.category === def.key
            );
            const factorDescription = matchingRec?.rationale || def.description(factorScore);
            const fillPercent = Math.min(100, Math.max(isClean ? 0 : 8, (factorScore / def.maxPoints) * 100));

            return (
              <div key={def.key} className="factor-analytic-row">
                <div className="factor-header-meta">
                  <div className="factor-title-group">
                    <span className="factor-category-icon" aria-hidden="true">
                      {def.key === 'perimeter_exposure' && '🌐'}
                      {def.key === 'email_defense_posture' && '✉️'}
                      {def.key === 'technology_disclosure' && '⚙️'}
                      {def.key === 'external_dependencies' && '🔗'}
                    </span>
                    <span className="factor-label-name">{def.name}</span>
                  </div>

                  <div className="factor-score-pill-wrap">
                    <span className={`factor-score-pill ${isClean ? 'pill-clean' : 'pill-penalty'}`}>
                      {isLoading ? '--' : isClean ? '0.0 pts' : `+${factorScore.toFixed(1)} pts`}
                    </span>
                  </div>
                </div>

                <div className="factor-bar-track" aria-hidden="true">
                  <div
                    className={`factor-bar-fill ${isClean ? 'fill-clean' : 'fill-penalty'}`}
                    style={{ width: `${isLoading ? 0 : fillPercent}%` }}
                  />
                </div>

                <p className="factor-context-desc">
                  {isLoading ? 'Evaluating factor observations...' : factorDescription}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
