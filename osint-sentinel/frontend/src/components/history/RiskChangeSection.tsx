import React from 'react';
import { RiskComparisonResult } from '../../types/history';

interface Props {
  risk: RiskComparisonResult;
}

export const RiskChangeSection: React.FC<Props> = ({ risk }) => {
  const scoreDelta = risk.overall_score.delta;

  return (
    <div className="change-section" aria-label="Risk Assessment Change Section">
      <h3 className="change-section-title">
        RISK ASSESSMENT CHANGE
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          background: 'var(--color-bg-subtle, #f8fafc)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--color-border-subtle, #e2e8f0)',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Previous Assessment
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>
            {risk.overall_score.previous.toFixed(1)} — {risk.risk_level.previous.toUpperCase()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Current Assessment
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>
            {risk.overall_score.current.toFixed(1)} — {risk.risk_level.current.toUpperCase()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Score Delta
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              marginTop: '2px',
              color: scoreDelta > 0 ? '#dc2626' : scoreDelta < 0 ? '#16a34a' : 'inherit',
            }}
          >
            {scoreDelta > 0 ? `+${scoreDelta.toFixed(1)}` : `${scoreDelta.toFixed(1)}`}
          </div>
        </div>
      </div>

      {risk.factor_deltas && risk.factor_deltas.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Factor Score Breakdown
          </div>
          <table className="factors-table">
            <thead>
              <tr>
                <th>Factor Category</th>
                <th>Previous</th>
                <th>Current</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {risk.factor_deltas.map((factor, idx) => {
                const delta = factor.delta;
                return (
                  <tr key={`factor-${idx}`}>
                    <td style={{ fontWeight: 600 }}>{formatFactorName(factor.category)}</td>
                    <td>{factor.previous_score.toFixed(1)}</td>
                    <td>{factor.current_score.toFixed(1)}</td>
                    <td
                      style={{
                        fontWeight: 600,
                        color: delta > 0 ? '#dc2626' : delta < 0 ? '#16a34a' : '#64748b',
                      }}
                    >
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? `${delta.toFixed(1)}` : '0.0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

function formatFactorName(name: string): string {
  if (!name) return 'Unknown Factor';
  // Replace underscores with spaces and capitalize each word
  return name
    .split(/_|\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
