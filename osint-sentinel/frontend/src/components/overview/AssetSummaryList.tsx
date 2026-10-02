import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../types';

interface AssetSummaryListProps {
  assets: Asset[];
  isLoading: boolean;
}

export const AssetSummaryList: React.FC<AssetSummaryListProps> = ({
  assets,
  isLoading,
}) => {
  const navigate = useNavigate();
  const domains = assets.filter((a) => a.asset_type === 'domain');
  const subdomains = assets.filter((a) => a.asset_type === 'subdomain');
  const ips = assets.filter((a) => a.asset_type === 'ip');
  const certHostnames = assets.filter((a) => a.asset_type === 'certificate_associated_hostname' || a.asset_type === 'certificate_hostname');

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Discovered Perimeter Surface
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Summary of unique perimeter assets cataloged under the authorized target scope.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => navigate('/assets')}
          title="Open Asset Intelligence inventory"
        >
          <span>VIEW ALL ASSETS</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {isLoading ? (
        <div className="state-box" style={{ minHeight: 140 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading discovered assets...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="state-box" style={{ minHeight: 120 }}>
          <span className="state-title">No Assets Cataloged</span>
          <p className="state-message">Run passive assessment to discover perimeter assets.</p>
        </div>
      ) : (
        <div className="asset-summary-grid">
          {/* Domains */}
          <div className="asset-type-col">
            <div className="asset-type-header">
              <span>Primary Domain</span>
              <span>{domains.length}</span>
            </div>
            <div className="asset-pill-list">
              {domains.map((a) => (
                <span key={a.id} className="asset-pill">
                  {a.value}
                </span>
              ))}
            </div>
          </div>

          {/* Subdomains */}
          <div className="asset-type-col">
            <div className="asset-type-header">
              <span>Subdomains</span>
              <span>{subdomains.length}</span>
            </div>
            <div className="asset-pill-list">
              {subdomains.length > 0 ? (
                subdomains.map((a) => (
                  <span key={a.id} className="asset-pill">
                    {a.value}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No subdomains cataloged
                </span>
              )}
            </div>
          </div>

          {/* IP Addresses */}
          <div className="asset-type-col">
            <div className="asset-type-header">
              <span>Resolved IP Addresses</span>
              <span>{ips.length}</span>
            </div>
            <div className="asset-pill-list">
              {ips.length > 0 ? (
                ips.map((a) => (
                  <span key={a.id} className="asset-pill">
                    {a.value}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No IPs resolved
                </span>
              )}
            </div>
          </div>

          {/* Certificate Hostnames */}
          <div className="asset-type-col">
            <div className="asset-type-header">
              <span>Certificate Hostnames</span>
              <span>{certHostnames.length}</span>
            </div>
            <div className="asset-pill-list">
              {certHostnames.length > 0 ? (
                certHostnames.map((a) => (
                  <span key={a.id} className="asset-pill">
                    {a.value}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  None observed
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
