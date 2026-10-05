import React from 'react';
import { Asset } from '../../types';

interface AssetCompositionChartProps {
  assets: Asset[];
}

export const AssetCompositionChart: React.FC<AssetCompositionChartProps> = ({ assets }) => {
  const domains = assets.filter(a => a.asset_type === 'domain').length;
  const subdomains = assets.filter(a => a.asset_type === 'subdomain').length;
  const ips = assets.filter(a => a.asset_type === 'ipv4' || a.asset_type === 'ipv6').length;
  
  const total = assets.length;

  if (total === 0) {
    return (
      <div className="overview-card asset-composition-card">
        <h3 className="card-title">Asset Composition</h3>
        <p className="card-empty-text">No asset data available.</p>
      </div>
    );
  }

  return (
    <div className="overview-card asset-composition-card">
      <h3 className="card-title">Asset Composition</h3>
      <div className="composition-body">
        <div className="composition-chart-wrapper">
          <div className="composition-donut">
             <div className="donut-center">
               <span className="donut-number">{total}</span>
               <span className="donut-label">TOTAL ASSETS</span>
             </div>
          </div>
        </div>
        <div className="composition-legend">
          <div className="legend-item">
            <span className="legend-color color-domain"></span>
            <span className="legend-name">Domain</span>
            <span className="legend-value">{domains}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color color-subdomain"></span>
            <span className="legend-name">Subdomains</span>
            <span className="legend-value">{subdomains}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color color-ip"></span>
            <span className="legend-name">IP Addresses</span>
            <span className="legend-value">{ips}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
