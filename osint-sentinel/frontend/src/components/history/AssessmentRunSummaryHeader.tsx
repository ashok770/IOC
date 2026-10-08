import React from 'react';
import { AssessmentRun } from '../../types/history';

interface Props {
  latestRun: AssessmentRun | null;
  previousRun: AssessmentRun | null;
}

export const AssessmentRunSummaryHeader: React.FC<Props> = ({ latestRun, previousRun }) => {
  if (!latestRun) {
    return (
      <div className="history-empty-state">
        <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>
          No assessments have been completed for this target yet.
        </p>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Click "Run Passive Scan" on the header or Overview page to generate your baseline assessment.
        </p>
      </div>
    );
  }

  const scoreDelta = previousRun ? round2(latestRun.overall_score - previousRun.overall_score) : null;

  return (
    <div className="current-run-banner" aria-label="Latest Assessment Overview">
      <div className="banner-metric-item">
        <span className="banner-metric-label">Latest Score</span>
        <span className="banner-metric-value" style={{ color: getRiskColor(latestRun.risk_level) }}>
          {latestRun.overall_score.toFixed(1)} / 100
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {previousRun ? (
            <span style={{ fontWeight: 600, color: scoreDelta! > 0 ? '#dc2626' : scoreDelta! < 0 ? '#16a34a' : '#64748b' }}>
              {scoreDelta! > 0 ? `+${scoreDelta}` : scoreDelta! < 0 ? `${scoreDelta}` : 'No change'} vs previous
            </span>
          ) : (
            'Baseline assessment — no previous assessment'
          )}
        </span>
      </div>

      <div className="banner-metric-item">
        <span className="banner-metric-label">Posture Priority</span>
        <span className="banner-metric-value" style={{ textTransform: 'capitalize', color: getRiskColor(latestRun.risk_level) }}>
          {latestRun.risk_level}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {latestRun.status.toUpperCase()}
        </span>
      </div>

      <div className="banner-metric-item">
        <span className="banner-metric-label">Discovered Assets</span>
        <span className="banner-metric-value">{latestRun.total_assets}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Perimeter surface</span>
      </div>

      <div className="banner-metric-item">
        <span className="banner-metric-label">Technologies</span>
        <span className="banner-metric-value">{latestRun.total_technologies}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Observed stack</span>
      </div>

      <div className="banner-metric-item">
        <span className="banner-metric-label">Exposure Signals</span>
        <span className="banner-metric-value">{latestRun.total_exposure_signals}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active indicators</span>
      </div>

      <div className="banner-metric-item">
        <span className="banner-metric-label">Completed At</span>
        <span style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
          {latestRun.completed_at ? new Date(latestRun.completed_at).toLocaleString() : 'In Progress'}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>UTC Timestamp</span>
      </div>
    </div>
  );
};

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#ea580c';
    case 'medium':
      return '#d97706';
    case 'low':
      return '#16a34a';
    default:
      return 'var(--color-text-primary)';
  }
}
