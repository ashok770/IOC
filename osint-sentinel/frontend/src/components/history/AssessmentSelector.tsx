import React from 'react';
import { AssessmentRun } from '../../types/history';

interface Props {
  runs: AssessmentRun[];
  baseRunId: string;
  targetRunId: string;
  onBaseChange: (id: string) => void;
  onTargetChange: (id: string) => void;
  onCompare: () => void;
  isLoading: boolean;
}

export const AssessmentSelector: React.FC<Props> = ({
  runs,
  baseRunId,
  targetRunId,
  onBaseChange,
  onTargetChange,
  onCompare,
  isLoading,
}) => {
  const isSameRun = baseRunId && targetRunId && baseRunId === targetRunId;
  const isDisabled = !baseRunId || !targetRunId || isSameRun || isLoading;

  if (runs.length < 2) {
    return (
      <div className="comparison-selector-panel">
        <h3 className="change-section-title" style={{ fontSize: '15px' }}>
          Assessment Comparison Selection
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {runs.length === 1
            ? 'Baseline assessment available. Run another assessment to enable historical comparison.'
            : 'No assessments available yet to compare.'}
        </p>
      </div>
    );
  }

  return (
    <div className="comparison-selector-panel" aria-label="Compare Assessment Runs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="change-section-title" style={{ fontSize: '15px' }}>
          Select Assessments to Compare
        </h3>
        {isSameRun && (
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
            Select two different assessments to compare.
          </span>
        )}
      </div>

      <div className="selector-grid">
        <div className="selector-group">
          <label className="selector-label" htmlFor="base-assessment-select">
            Base Assessment (Older)
          </label>
          <select
            id="base-assessment-select"
            className="selector-select"
            value={baseRunId}
            onChange={(e) => onBaseChange(e.target.value)}
          >
            {runs.map((run) => (
              <option key={`base-${run.id}`} value={run.id}>
                {new Date(run.started_at).toLocaleString()} — Score: {run.overall_score.toFixed(1)} ({run.risk_level.toUpperCase()}) [{run.status.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label className="selector-label" htmlFor="target-assessment-select">
            Target Assessment (Newer)
          </label>
          <select
            id="target-assessment-select"
            className="selector-select"
            value={targetRunId}
            onChange={(e) => onTargetChange(e.target.value)}
          >
            {runs.map((run) => (
              <option key={`target-${run.id}`} value={run.id}>
                {new Date(run.started_at).toLocaleString()} — Score: {run.overall_score.toFixed(1)} ({run.risk_level.toUpperCase()}) [{run.status.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="compare-action-btn"
          onClick={onCompare}
          disabled={isDisabled}
          aria-busy={isLoading}
        >
          {isLoading ? 'Comparing...' : 'Compare Assessments'}
        </button>
      </div>
    </div>
  );
};
