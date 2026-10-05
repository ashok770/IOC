import React from 'react';
import { AnalysisSummary, RiskAssessment } from '../../types';

interface AssessmentSummaryProps {
  summary: AnalysisSummary | null;
  risk: RiskAssessment | null;
}

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ summary, risk }) => {
  const score = risk ? risk.overall_score.toFixed(1) : '--';
  const level = risk ? risk.risk_level.toUpperCase() : 'PENDING';
  
  return (
    <div className="kpi-summary-row">
      <div className="kpi-card">
        <div className="kpi-label">Exposure Assessment</div>
        <div className="kpi-value-group">
          <span className="kpi-value">{score}</span>
          <span className="kpi-suffix">/ 100</span>
        </div>
        <div className="kpi-subtext">{level}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Investigation Priority</div>
        <div className="kpi-value">P4</div>
        <div className="kpi-subtext">{level}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Exposure Signals</div>
        <div className="kpi-value">{summary?.exposure_signals ?? 0}</div>
        <div className="kpi-subtext">Requires Review</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Assets</div>
        <div className="kpi-value">{summary?.assets ?? 0}</div>
        <div className="kpi-subtext">Discovered items</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Technologies</div>
        <div className="kpi-value">{summary?.technologies ?? 0}</div>
        <div className="kpi-subtext">Detected stacks</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Evidence</div>
        <div className="kpi-value">{summary?.evidence_items ?? 0}</div>
        <div className="kpi-subtext">Observable artifacts</div>
      </div>
    </div>
  );
};
