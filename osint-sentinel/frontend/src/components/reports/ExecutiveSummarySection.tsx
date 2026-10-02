import React from 'react';
import { Target, AnalysisSummary, RiskAssessment } from '../../types';
import { AssessmentLevelBadge } from '../risk/AssessmentLevelBadge';

interface ExecutiveSummarySectionProps {
  target: Target;
  summary: AnalysisSummary | null;
  riskAssessment: RiskAssessment | null;
}

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({
  target,
  summary,
  riskAssessment,
}) => {
  const score = riskAssessment ? riskAssessment.overall_score : summary?.overall_risk_score ?? 0;
  const level = riskAssessment ? riskAssessment.risk_level : summary?.risk_level ?? 'low';

  return (
    <section className="report-section" id="executive-summary">
      <div className="report-section-header">
        <span className="section-number">01</span>
        <h2 className="section-title">EXECUTIVE SUMMARY</h2>
      </div>

      <div className="executive-narrative">
        <p>
          OSINT Sentinel performed an authorized, non-intrusive external exposure assessment of the primary domain{' '}
          <strong className="monospace highlight-cyan">{target.primary_domain}</strong>. All observations were gathered
          exclusively through publicly accessible authoritative DNS records, RDAP registration registries, Certificate
          Transparency logs, and passive HTTP response headers. Zero intrusive probing, port scanning, or exploitation
          was performed.
        </p>
        <p>
          The assessment produced an <strong>External Exposure Assessment Score</strong> of{' '}
          <span className="monospace score-highlight">{score.toFixed(1)} / 100</span>, categorizing the observed
          perimeter as <AssessmentLevelBadge level={level} size="sm" /> priority for defensive investigation. This score
          reflects observable surface area, public mail defense policies, and technology disclosures, serving as a triage
          prioritization guide rather than a measure of exploitability or compromise likelihood.
        </p>
      </div>

      {/* Authoritative KPI Matrix */}
      <div className="report-kpi-grid">
        <div className="report-kpi-card">
          <span className="kpi-label">INVESTIGATION PRIORITY</span>
          <div className="kpi-score-row">
            <span className="kpi-score-val">{score.toFixed(1)}</span>
            <span className="kpi-score-max">/ 100</span>
          </div>
          <span className="kpi-subtext">Heuristic Assessment Score</span>
        </div>

        <div className="report-kpi-card">
          <span className="kpi-label">ASSESSED ASSETS</span>
          <span className="kpi-val monospace">{summary?.assets ?? 0}</span>
          <span className="kpi-subtext">Domains, subdomains & IPs</span>
        </div>

        <div className="report-kpi-card">
          <span className="kpi-label">TECHNOLOGY STACK</span>
          <span className="kpi-val monospace">{summary?.technologies ?? 0}</span>
          <span className="kpi-subtext">Passive software detections</span>
        </div>

        <div className="report-kpi-card">
          <span className="kpi-label">EXPOSURE SIGNALS</span>
          <span className="kpi-val monospace">{summary?.exposure_signals ?? 0}</span>
          <span className="kpi-subtext">Prioritized external signals</span>
        </div>

        <div className="report-kpi-card">
          <span className="kpi-label">EVIDENCE ARTIFACTS</span>
          <span className="kpi-val monospace">{summary?.evidence_items ?? 0}</span>
          <span className="kpi-subtext">Factual collection records</span>
        </div>

        <div className="report-kpi-card">
          <span className="kpi-label">ASSET RELATIONSHIPS</span>
          <span className="kpi-val monospace">{summary?.relationships ?? 0}</span>
          <span className="kpi-subtext">Observed infrastructure edges</span>
        </div>
      </div>
    </section>
  );
};
