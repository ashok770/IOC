import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetRiskScore, Asset, Technology } from '../../types';
import { PriorityTierBadge } from './PriorityTierBadge';

interface AssetPriorityTableProps {
  items: AssetRiskScore[];
  assetMap: Map<string, Asset>;
  techMap: Map<string, Technology[]>;
  isLoading?: boolean;
}

export const AssetPriorityTable: React.FC<AssetPriorityTableProps> = ({
  items,
  assetMap,
  techMap,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Count by tier for filter tabs
  const tierCounts = useMemo(() => {
    const counts = { all: items.length, p1: 0, p2: 0, p3: 0, p4: 0 };
    items.forEach((item) => {
      const p = item.priority_level.toLowerCase();
      if (p.includes('p1') || p.includes('urgent')) counts.p1++;
      else if (p.includes('p2') || p.includes('high')) counts.p2++;
      else if (p.includes('p3') || p.includes('medium')) counts.p3++;
      else if (p.includes('p4') || p.includes('low')) counts.p4++;
    });
    return counts;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tier match
      if (tierFilter !== 'all') {
        const p = item.priority_level.toLowerCase();
        if (tierFilter === 'p1' && !p.includes('p1') && !p.includes('urgent')) return false;
        if (tierFilter === 'p2' && !p.includes('p2') && !p.includes('high')) return false;
        if (tierFilter === 'p3' && !p.includes('p3') && !p.includes('medium')) return false;
        if (tierFilter === 'p4' && !p.includes('p4') && !p.includes('low')) return false;
      }

      // Search match (asset value, type, factors)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const asset = assetMap.get(item.asset_id);
        const val = (item.asset_value || asset?.value || '').toLowerCase();
        const type = (item.asset_type || asset?.asset_type || '').toLowerCase();
        const matchFactor = item.contributing_factors.some(
          (f) =>
            (f.factor || f.factor_name || '').toLowerCase().includes(q) ||
            (f.reason || f.description || '').toLowerCase().includes(q)
        );
        return val.includes(q) || type.includes(q) || matchFactor;
      }

      return true;
    });
  }, [items, tierFilter, searchQuery, assetMap]);

  return (
    <div className="risk-priority-section">
      <div className="risk-section-header">
        <div>
          <h3 className="risk-section-title">PRIORITY INVESTIGATION</h3>
          <p className="risk-section-subtitle">
            Ranked perimeter assets requiring defensive investigation based on observed exposure signals.
          </p>
        </div>
        <div className="risk-tier-tabs">
          <button
            type="button"
            className={`risk-tab-btn ${tierFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTierFilter('all')}
          >
            ALL ({tierCounts.all})
          </button>
          <button
            type="button"
            className={`risk-tab-btn tab-p1 ${tierFilter === 'p1' ? 'active' : ''}`}
            onClick={() => setTierFilter('p1')}
          >
            P1 URGENT ({tierCounts.p1})
          </button>
          <button
            type="button"
            className={`risk-tab-btn tab-p2 ${tierFilter === 'p2' ? 'active' : ''}`}
            onClick={() => setTierFilter('p2')}
          >
            P2 HIGH ({tierCounts.p2})
          </button>
          <button
            type="button"
            className={`risk-tab-btn tab-p3 ${tierFilter === 'p3' ? 'active' : ''}`}
            onClick={() => setTierFilter('p3')}
          >
            P3 MEDIUM ({tierCounts.p3})
          </button>
          <button
            type="button"
            className={`risk-tab-btn tab-p4 ${tierFilter === 'p4' ? 'active' : ''}`}
            onClick={() => setTierFilter('p4')}
          >
            P4 LOW ({tierCounts.p4})
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="risk-table-toolbar">
        <div className="risk-search-wrapper">
          <svg
            className="risk-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="risk-search-input"
            placeholder="Filter assets, types, or observed factors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="risk-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <span className="risk-results-count">
          Showing {filteredItems.length} of {items.length} prioritized assets
        </span>
      </div>

      {/* Analyst Table */}
      {isLoading ? (
        <div className="state-box" style={{ minHeight: 180 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading prioritized assets...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="risk-empty-table">
          <p className="risk-empty-text">
            {searchQuery || tierFilter !== 'all'
              ? 'No prioritized assets match the active filters.'
              : 'No prioritized assets available for this assessment scope.'}
          </p>
        </div>
      ) : (
        <div className="risk-table-wrapper">
          <table className="risk-analyst-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>ASSET</th>
                <th style={{ width: '15%' }}>INVESTIGATION PRIORITY</th>
                <th style={{ width: '12%' }}>SCORE</th>
                <th style={{ width: '35%' }}>OBSERVED EXPOSURE & FACTORS</th>
                <th style={{ width: '10%', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const asset = assetMap.get(item.asset_id);
                const assetVal = item.asset_value || asset?.value || item.asset_id;
                const assetType = item.asset_type || asset?.asset_type || 'unknown';
                const assetTechs = techMap.get(item.asset_id) || [];

                return (
                  <tr key={item.id} className="risk-table-row">
                    {/* Asset column */}
                    <td>
                      <div className="risk-asset-cell">
                        <span className="risk-asset-val monospace" title={assetVal}>
                          {assetVal}
                        </span>
                        <div className="risk-asset-meta">
                          <span className={`risk-asset-type-badge type-${assetType}`}>
                            {assetType}
                          </span>
                          {assetTechs.length > 0 && (
                            <span className="risk-asset-tech-pill" title={assetTechs.map((t) => t.name).join(', ')}>
                              {assetTechs.length} tech observed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority Tier */}
                    <td>
                      <PriorityTierBadge tier={item.priority_level} />
                    </td>

                    {/* Score */}
                    <td>
                      <div className="risk-table-score">
                        <span className="score-val">{item.priority_score.toFixed(1)}</span>
                        <span className="score-max">/ 100</span>
                      </div>
                    </td>

                    {/* Observed Factors */}
                    <td>
                      <div className="risk-factors-cell">
                        {item.contributing_factors.length === 0 ? (
                          <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                            Base asset triage weighting
                          </span>
                        ) : (
                          <div className="risk-factor-tags-list">
                            {item.contributing_factors.map((f, fIdx) => {
                              const factorTitle = f.factor || f.factor_name || 'Observed Signal';
                              const factorReason = f.reason || f.description || '';
                              return (
                                <div key={fIdx} className="risk-factor-tag" title={factorReason}>
                                  <span className="factor-tag-name">{factorTitle}</span>
                                  <span className="factor-tag-impact">+{f.score_impact}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-asset-link"
                        onClick={() => navigate('/assets')}
                        title="Investigate in Asset Intelligence"
                      >
                        VIEW ASSET →
                      </button>
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
