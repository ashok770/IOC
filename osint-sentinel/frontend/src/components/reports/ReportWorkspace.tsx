import React from 'react';
import { Target, AnalysisSummary, RiskAssessment } from '../../types';
import { AssessmentLevelBadge } from '../risk/AssessmentLevelBadge';

interface ReportWorkspaceProps {
  target: Target;
  summary: AnalysisSummary | null;
  riskAssessment: RiskAssessment | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  hasGeneratedReport: boolean;
}

export const ReportWorkspace: React.FC<ReportWorkspaceProps> = ({
  target,
  summary,
  riskAssessment,
  isGenerating,
  onGenerate,
  onPreview,
  hasGeneratedReport,
}) => {
  const isCompleted = target.assessment_status === 'completed';
  const score = riskAssessment?.overall_score ?? summary?.overall_risk_score ?? 0;
  const level = riskAssessment?.risk_level ?? summary?.risk_level ?? 'low';

  return (
    <div className="report-workspace-container">
      {/* Target Status Card */}
      <div className="report-workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-headline-group">
            <span className="workspace-tag">ASSESSMENT WORKSPACE</span>
            <h2 className="workspace-target-name">{target.name || target.primary_domain}</h2>
            <span className="workspace-domain monospace highlight-cyan">
              PRIMARY SCOPE: {target.primary_domain}
            </span>
          </div>
          <div className="workspace-badges-group">
            <span className="workspace-badge current-assessment-badge">
              CURRENT ASSESSMENT
            </span>
            <span className={`status-badge-inline status-${target.assessment_status}`}>
              STATUS: {target.assessment_status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Assessment Metrics Summary */}
        <div className="workspace-stats-grid">
          <div className="workspace-stat-item">
            <span className="stat-label">ASSESSMENT SCORE</span>
            <div className="stat-score-row">
              <span className="stat-score-val monospace">{score.toFixed(1)}</span>
              <span className="stat-score-max monospace">/ 100</span>
            </div>
            <AssessmentLevelBadge level={level} size="sm" />
          </div>

          <div className="workspace-stat-item">
            <span className="stat-label">ASSET INVENTORY</span>
            <span className="stat-val monospace">{summary?.assets ?? 0}</span>
            <span className="stat-sub">External assets discovered</span>
          </div>

          <div className="workspace-stat-item">
            <span className="stat-label">TECHNOLOGY STACK</span>
            <span className="stat-val monospace">{summary?.technologies ?? 0}</span>
            <span className="stat-sub">Passive software observations</span>
          </div>

          <div className="workspace-stat-item">
            <span className="stat-label">EXPOSURE SIGNALS</span>
            <span className="stat-val monospace">{summary?.exposure_signals ?? 0}</span>
            <span className="stat-sub">Identified exposure indicators</span>
          </div>

          <div className="workspace-stat-item">
            <span className="stat-label">EVIDENCE RECORDS</span>
            <span className="stat-val monospace">{summary?.evidence_items ?? 0}</span>
            <span className="stat-sub">Factual artifacts cataloged</span>
          </div>

          <div className="workspace-stat-item">
            <span className="stat-label">RELATIONSHIPS</span>
            <span className="stat-val monospace">{summary?.relationships ?? 0}</span>
            <span className="stat-sub">Observed infrastructure connections</span>
          </div>
        </div>

        {/* Actions & Verification Banner */}
        {!isCompleted ? (
          <div className="workspace-warning-banner">
            <svg
              className="warning-banner-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h4 className="warning-banner-title">REPORT GENERATION UNAVAILABLE</h4>
              <p className="warning-banner-desc">
                Complete the authorized passive assessment before generating the report. Real assessment telemetry
                is required to produce structured output.
              </p>
            </div>
          </div>
        ) : (
          <div className="workspace-actions-row">
            <div className="actions-info">
              <span className="actions-info-title">Structured Assessment Output</span>
              <p className="actions-info-desc">
                Synthesize all discovered assets, exposure signals, technology observations, and evidence provenance into
                a formal security assessment document.
              </p>
            </div>

            <div className="actions-buttons-group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    <span>SYNTHESIZING REPORT...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="btn-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>GENERATE ASSESSMENT REPORT</span>
                  </>
                )}
              </button>

              {hasGeneratedReport && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onPreview}
                >
                  PREVIEW REPORT →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
