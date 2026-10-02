import React from 'react';
import { AssetRiskScore, Asset } from '../../types';
import { PriorityTierBadge } from '../risk/PriorityTierBadge';

interface InvestigationPrioritiesSectionProps {
  priorities: AssetRiskScore[];
  assetMap: Map<string, Asset>;
}

export const InvestigationPrioritiesSection: React.FC<InvestigationPrioritiesSectionProps> = ({
  priorities,
  assetMap,
}) => {
  return (
    <section className="report-section" id="investigation-priorities">
      <div className="report-section-header">
        <span className="section-number">09</span>
        <h2 className="section-title">INVESTIGATION PRIORITIES</h2>
      </div>

      <p className="report-section-desc">
        Prioritized asset triage queue indicating required defensive focus (P1 Urgent to P4 Low) based on observable perimeter exposure.
      </p>

      {priorities.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No prioritized assets available.</p>
        </div>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>ASSET</th>
                <th style={{ width: '18%' }}>INVESTIGATION PRIORITY</th>
                <th style={{ width: '12%' }}>SCORE</th>
                <th style={{ width: '40%' }}>OBSERVED FACTORS</th>
              </tr>
            </thead>
            <tbody>
              {priorities.map((item) => {
                const asset = assetMap.get(item.asset_id);
                const assetVal = item.asset_value || asset?.value || item.asset_id;

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="monospace asset-value-cell font-bold" title={assetVal}>
                        {assetVal}
                      </span>
                    </td>
                    <td>
                      <PriorityTierBadge tier={item.priority_level} />
                    </td>
                    <td>
                      <span className="monospace font-bold">
                        {item.priority_score.toFixed(1)} / 100
                      </span>
                    </td>
                    <td>
                      <div className="report-factors-cell">
                        {item.contributing_factors.length === 0 ? (
                          <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                            Base perimeter weighting
                          </span>
                        ) : (
                          <div className="report-factor-pills">
                            {item.contributing_factors.map((f, idx) => (
                              <span
                                key={idx}
                                className="report-factor-pill"
                                title={f.reason || f.description || ''}
                              >
                                {f.factor || f.factor_name} (+{f.score_impact})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
