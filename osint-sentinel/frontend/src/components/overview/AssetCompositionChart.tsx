import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../types';

interface AssetCompositionChartProps {
  assets: Asset[];
}

export const AssetCompositionChart: React.FC<AssetCompositionChartProps> = ({ assets }) => {
  const navigate = useNavigate();
  const domains = assets.filter(a => a.asset_type === 'domain').length;
  const subdomains = assets.filter(a => a.asset_type === 'subdomain').length;
  const ips = assets.filter(a => a.asset_type === 'ip' || a.asset_type === 'ipv4' || a.asset_type === 'ipv6').length;
  const certHostnames = assets.filter(a => a.asset_type === 'certificate_hostname').length;
  
  const total = assets.length;
  const other = total - (domains + subdomains + ips + certHostnames);

  if (total === 0) {
    return (
      <div className="discovery-section">
        <h3 className="discovery-title">EXTERNAL ASSET SURFACE</h3>
        <p className="discovery-empty">No asset data available.</p>
      </div>
    );
  }

  // Calculate svg segments
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = [
    { name: 'Domains', value: domains, color: 'var(--color-status-success)' },
    { name: 'Subdomains', value: subdomains, color: 'var(--color-status-warning)' },
    { name: 'IP Addresses', value: ips, color: 'var(--color-accent-cyan)' },
    { name: 'Certificate Hostnames', value: certHostnames, color: 'var(--color-status-high)' },
    { name: 'Other', value: other, color: 'var(--color-text-muted)' },
  ].filter(s => s.value > 0);

  const totalSegmentValue = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="discovery-section" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="discovery-title" style={{ margin: 0, textTransform: 'none' }}>Asset surface</h3>
      </div>
      
      <div className="surface-split-layout" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="surface-split-left" style={{ position: 'relative' }}>
          <div className="donut-svg-wrapper surface-donut">
            <svg viewBox="-80 -80 160 160" className="donut-svg">
              <circle r={radius} cx="0" cy="0" fill="none" stroke="var(--color-bg-base)" strokeWidth="20" />
              {segments.map((seg, idx) => {
                const dashLength = (seg.value / totalSegmentValue) * circumference;
                const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += dashLength;

                return (
                  <circle
                    key={idx}
                    r={radius}
                    cx="0"
                    cy="0"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    transform="rotate(-90)"
                  />
                );
              })}
            </svg>
            <div className="donut-center-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}>
              <span className="donut-center-val" style={{ fontSize: '24px', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{total}</span>
              <span className="donut-center-text" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>assets</span>
            </div>
          </div>
        </div>
        
        <div className="surface-split-right" style={{ width: '100%', marginTop: '16px' }}>
          <div className="surface-inventory" style={{ width: '100%' }}>
            {segments.map((seg, idx) => (
              <div className="surface-inventory-item" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: seg.color, flexShrink: 0 }}></span>
                <span className="surface-inventory-name" style={{ flexGrow: 1 }}>{seg.name}</span>
                <span className="surface-inventory-val">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="discovery-action" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button className="btn-link" onClick={() => navigate('/assets')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }} aria-label="View detailed asset inventory">
          View assets
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};
