import React from 'react';
import { Target, AnalysisSummary, RiskAssessment } from '../../types';
import { AssessmentLevelBadge } from '../risk/AssessmentLevelBadge';

interface ReportHeaderProps {
  target: Target;
  summary: AnalysisSummary | null;
  riskAssessment: RiskAssessment | null;
  generatedAt: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  target,
  riskAssessment,
  generatedAt,
}) => {
  return (
    <div className="report-doc-header">
      <div className="report-doc-brand-row">
        <div className="report-doc-brand">
          <span className="report-doc-logo-tag">OSINT SENTINEL</span>
          <span className="report-doc-type-label">SECURITY INTELLIGENCE PLATFORM</span>
        </div>
        <div className="report-doc-classification">
          <span className="doc-classification-tag">DEFENSIVE ASSESSMENT REPORT</span>
          <span className="doc-distribution-tag">AUTHORIZED USE ONLY</span>
        </div>
      </div>

      <div className="report-doc-title-block">
        <h1 className="report-doc-main-title">AUTHORIZED EXTERNAL SECURITY ASSESSMENT</h1>
        <p className="report-doc-subtitle">
          Factual, evidence-backed evaluation of observed external attack surface and defensive configurations.
        </p>
      </div>

      <div className="report-meta-grid">
        <div className="report-meta-item">
          <span className="meta-label">ASSESSED TARGET</span>
          <span className="meta-value monospace highlight-cyan">{target.primary_domain}</span>
        </div>

        <div className="report-meta-item">
          <span className="meta-label">ASSESSMENT STATUS</span>
          <span className="meta-value capitalize">{target.assessment_status}</span>
        </div>

        <div className="report-meta-item">
          <span className="meta-label">ASSESSMENT MODE</span>
          <span className="meta-value">Authorized / Passive (Non-Intrusive)</span>
        </div>

        <div className="report-meta-item">
          <span className="meta-label">EXECUTION POLICY</span>
          <span className="meta-value">Zero Exploitation / Read-Only OSINT</span>
        </div>

        <div className="report-meta-item">
          <span className="meta-label">REPORT GENERATED</span>
          <span className="meta-value monospace">{generatedAt}</span>
        </div>

        <div className="report-meta-item">
          <span className="meta-label">ASSESSMENT LEVEL</span>
          <span className="meta-value">
            {riskAssessment ? (
              <AssessmentLevelBadge level={riskAssessment.risk_level} size="sm" />
            ) : (
              'PENDING'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
