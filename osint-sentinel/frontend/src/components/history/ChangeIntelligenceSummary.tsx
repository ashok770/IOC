import React from 'react';
import { AssessmentComparisonResponse } from '../../types/history';

interface Props {
  comparison: AssessmentComparisonResponse;
}

export const ChangeIntelligenceSummary: React.FC<Props> = ({ comparison }) => {
  const { base_assessment, target_assessment, summary, risk } = comparison;

  const scoreDelta = risk.overall_score.delta;
  const assetDelta = summary.asset_delta;
  const techDelta = summary.technology_delta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-label="Change Intelligence Summary">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="change-section-title" style={{ fontSize: '18px' }}>
          Change Intelligence Overview
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Comparing {new Date(base_assessment.started_at).toLocaleDateString()} →{' '}
          {new Date(target_assessment.started_at).toLocaleDateString()}
        </span>
      </div>

      <div className="change-summary-grid">
        {/* External Exposure Assessment Score */}
        <div className="change-card">
          <span className="change-card-title">External Exposure Assessment</span>
          <div className="change-card-value">
            <span>
              {risk.overall_score.previous.toFixed(1)} → {risk.overall_score.current.toFixed(1)}
            </span>
            <span
              className={`delta-badge ${
                scoreDelta > 0 ? 'increased' : scoreDelta < 0 ? 'decreased' : 'neutral'
              }`}
            >
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta < 0 ? `${scoreDelta}` : '0.0'}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Risk Level: {risk.risk_level.previous.toUpperCase()} → {risk.risk_level.current.toUpperCase()}
          </span>
        </div>

        {/* Asset Surface */}
        <div className="change-card">
          <span className="change-card-title">Assets</span>
          <div className="change-card-value">
            <span>
              {base_assessment.total_assets} → {target_assessment.total_assets}
            </span>
            <span
              className={`delta-badge ${
                assetDelta > 0 ? 'increased' : assetDelta < 0 ? 'decreased' : 'neutral'
              }`}
            >
              {assetDelta > 0 ? `+${assetDelta}` : `${assetDelta}`}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            +{comparison.assets.added.length} new, -{comparison.assets.removed.length} removed
          </span>
        </div>

        {/* Technologies */}
        <div className="change-card">
          <span className="change-card-title">Technologies</span>
          <div className="change-card-value">
            <span>
              {base_assessment.total_technologies} → {target_assessment.total_technologies}
            </span>
            <span
              className={`delta-badge ${
                techDelta > 0 ? 'increased' : techDelta < 0 ? 'decreased' : 'neutral'
              }`}
            >
              {techDelta > 0 ? `+${techDelta}` : `${techDelta}`}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            +{comparison.technologies.added.length} new, -{comparison.technologies.removed.length} removed,{' '}
            {comparison.technologies.version_changes.length} version updates
          </span>
        </div>

        {/* Exposure Signals */}
        <div className="change-card">
          <span className="change-card-title">Exposure Signals</span>
          <div className="change-card-value">
            <span>
              {base_assessment.total_exposure_signals} → {target_assessment.total_exposure_signals}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: '#dc2626' }}>+{summary.new_exposure_signals} New</strong>,{' '}
            <strong style={{ color: '#16a34a' }}>-{summary.resolved_exposure_signals} Resolved</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
