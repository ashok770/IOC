import React, { useState } from 'react';
import { Asset } from '../../types';

interface AssetInventorySectionProps {
  assets: Asset[];
  primaryDomain?: string;
}

const MAX_DISPLAY_COUNT = 25;

export const AssetInventorySection: React.FC<AssetInventorySectionProps> = ({
  assets,
  primaryDomain,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  const displayedAssets = showAll ? assets : assets.slice(0, MAX_DISPLAY_COUNT);
  const remainingCount = assets.length - MAX_DISPLAY_COUNT;

  return (
    <section className="report-section" id="asset-inventory">
      <div className="report-section-header">
        <span className="section-number">03</span>
        <h2 className="section-title">EXTERNAL ASSET INVENTORY</h2>
      </div>

      <p className="report-section-desc">
        Publicly accessible network assets discovered through authorized passive collection ({assets.length} total assets).
      </p>

      {assets.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No external assets recorded for this assessment target.</p>
        </div>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>ASSET VALUE</th>
                <th style={{ width: '15%' }}>TYPE</th>
                <th style={{ width: '18%' }}>SCOPE CLASSIFICATION</th>
                <th style={{ width: '15%' }}>SOURCE</th>
                <th style={{ width: '20%' }}>DISCOVERED AT</th>
              </tr>
            </thead>
            <tbody>
              {displayedAssets.map((asset) => {
                const isExternal =
                  primaryDomain &&
                  asset.asset_type !== 'ip' &&
                  asset.value.toLowerCase() !== primaryDomain.toLowerCase() &&
                  !asset.value.toLowerCase().endsWith(`.${primaryDomain.toLowerCase()}`);

                return (
                  <tr key={asset.id}>
                    <td>
                      <span className="monospace asset-value-cell" title={asset.value}>
                        {asset.value}
                      </span>
                    </td>
                    <td>
                      <span className={`report-badge type-${asset.asset_type}`}>
                        {asset.asset_type}
                      </span>
                    </td>
                    <td>
                      <span className={`scope-badge ${isExternal ? 'scope-ref' : 'scope-primary'}`}>
                        {isExternal ? 'External Reference' : 'Target Scope'}
                      </span>
                    </td>
                    <td>
                      <span className="monospace source-cell">{asset.source}</span>
                    </td>
                    <td>
                      <span className="monospace report-time-cell">
                        {asset.discovered_at ? new Date(asset.discovered_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {remainingCount > 0 && (
            <div className="report-table-truncation-note">
              <span>
                {showAll
                  ? `Showing all ${assets.length} records.`
                  : `Showing ${MAX_DISPLAY_COUNT} of ${assets.length} assets. ${remainingCount} additional assets are cataloged in Asset Intelligence.`}
              </span>
              <button
                type="button"
                className="btn-toggle-inline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Compact View' : `View All ${assets.length} Records`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
