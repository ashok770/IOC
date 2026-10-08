import React from 'react';
import { AssessmentRun } from '../../types/history';

interface Props {
  runs: AssessmentRun[];
  selectedBaseId?: string;
  selectedTargetId?: string;
  onSelectRun?: (runId: string) => void;
}

export const AssessmentTimeline: React.FC<Props> = ({
  runs,
  selectedBaseId,
  selectedTargetId,
  onSelectRun,
}) => {
  if (!runs || runs.length === 0) {
    return null;
  }

  return (
    <div className="timeline-panel" aria-label="Assessment History Timeline">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="change-section-title" style={{ fontSize: '15px' }}>
          Assessment History Timeline ({runs.length})
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Newest runs listed first
        </span>
      </div>

      <div className="timeline-list">
        {runs.map((run) => {
          const isBase = run.id === selectedBaseId;
          const isTarget = run.id === selectedTargetId;
          const formattedDate = new Date(run.started_at).toLocaleString();

          return (
            <div
              key={run.id}
              className="timeline-item"
              style={{
                borderColor: isTarget
                  ? 'var(--color-accent-blue, #2563eb)'
                  : isBase
                  ? '#93c5fd'
                  : undefined,
                background: isTarget ? '#eff6ff' : isBase ? '#f8fafc' : undefined,
                cursor: onSelectRun ? 'pointer' : 'default',
              }}
              onClick={() => onSelectRun && onSelectRun(run.id)}
            >
              <div className="timeline-item-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="timeline-item-date">{formattedDate}</span>
                  <StatusBadge status={run.status} />
                  {isBase && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Base
                    </span>
                  )}
                  {isTarget && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Target
                    </span>
                  )}
                </div>
                <div className="timeline-item-stats">
                  <span>Assets: <strong>{run.total_assets}</strong></span>
                  <span>Technologies: <strong>{run.total_technologies}</strong></span>
                  <span>Exposure Signals: <strong>{run.total_exposure_signals}</strong></span>
                  <span>ID: <code style={{ fontSize: '11px' }}>{run.id.substring(0, 8)}</code></span>
                </div>
                {run.error_message && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    Error: {run.error_message}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: getRiskColor(run.risk_level),
                  }}
                >
                  {run.overall_score.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: getRiskColor(run.risk_level),
                  }}
                >
                  {run.risk_level}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bg = '#f1f5f9';
  let color = '#475569';

  switch (status.toLowerCase()) {
    case 'completed':
      bg = '#f0fdf4';
      color = '#15803d';
      break;
    case 'partial':
      bg = '#fffbeb';
      color = '#b45309';
      break;
    case 'in_progress':
      bg = '#eff6ff';
      color = '#1d4ed8';
      break;
    case 'failed':
      bg = '#fef2f2';
      color = '#b91c1c';
      break;
  }

  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: bg,
        color: color,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
};

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
      return '#64748b';
  }
}
