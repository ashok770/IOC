import React from 'react';
import { Asset } from '../../types';

interface AssetSummaryStripProps {
  assets: Asset[];
  primaryDomain?: string;
  selectedType: string;
  onSelectType: (type: string) => void;
}

export const AssetSummaryStrip: React.FC<AssetSummaryStripProps> = ({
  assets,
  primaryDomain,
  selectedType,
  onSelectType,
}) => {
  if (assets.length === 0) return null;

  let domainCount = 0;
  let subdomainCount = 0;
  let ipCount = 0;
  let certCount = 0;
  let externalCount = 0;

  for (const a of assets) {
    const normType = (a.asset_type || '').toLowerCase();
    if (normType === 'domain') domainCount++;
    else if (normType === 'subdomain') subdomainCount++;
    else if (normType === 'ip') ipCount++;
    else if (normType.includes('cert')) certCount++;

    if (
      primaryDomain &&
      normType !== 'ip' &&
      a.value.toLowerCase() !== primaryDomain.toLowerCase() &&
      !a.value.toLowerCase().endsWith(`.${primaryDomain.toLowerCase()}`)
    ) {
      externalCount++;
    }
  }

  const total = assets.length;
  const domainPct = total > 0 ? (domainCount / total) * 100 : 0;
  const subdomainPct = total > 0 ? (subdomainCount / total) * 100 : 0;
  const ipPct = total > 0 ? (ipCount / total) * 100 : 0;
  const certPct = total > 0 ? (certCount / total) * 100 : 0;

  return (
    <div className="asset-summary-strip" aria-label="Asset inventory composition">
      {/* Subtle Proportional Distribution Bar */}
      <div className="asset-dist-bar" role="progressbar" aria-valuenow={total} aria-valuemin={0} aria-valuemax={total}>
        {domainCount > 0 && (
          <div
            className="asset-dist-seg asset-dist-seg--domain"
            style={{ width: `${domainPct}%` }}
            title={`Domain: ${domainCount} (${domainPct.toFixed(0)}%)`}
          />
        )}
        {subdomainCount > 0 && (
          <div
            className="asset-dist-seg asset-dist-seg--subdomain"
            style={{ width: `${subdomainPct}%` }}
            title={`Subdomains: ${subdomainCount} (${subdomainPct.toFixed(0)}%)`}
          />
        )}
        {ipCount > 0 && (
          <div
            className="asset-dist-seg asset-dist-seg--ip"
            style={{ width: `${ipPct}%` }}
            title={`IP Addresses: ${ipCount} (${ipPct.toFixed(0)}%)`}
          />
        )}
        {certCount > 0 && (
          <div
            className="asset-dist-seg asset-dist-seg--cert"
            style={{ width: `${certPct}%` }}
            title={`Certificate Hostnames: ${certCount} (${certPct.toFixed(0)}%)`}
          />
        )}
      </div>

      {/* Composition Metrics */}
      <div className="asset-summary-metrics">
        <button
          type="button"
          className={`asset-summary-chip ${selectedType === 'all' ? 'active' : ''}`}
          onClick={() => onSelectType('all')}
          title="Show all asset types"
        >
          <span className="chip-label">Total Inventory</span>
          <span className="chip-count">{total}</span>
        </button>

        {domainCount > 0 && (
          <button
            type="button"
            className={`asset-summary-chip asset-chip--domain ${selectedType === 'domain' ? 'active' : ''}`}
            onClick={() => onSelectType(selectedType === 'domain' ? 'all' : 'domain')}
            title="Filter by Apex Domain"
          >
            <span className="chip-indicator" />
            <span className="chip-label">Domain</span>
            <span className="chip-count">{domainCount}</span>
          </button>
        )}

        {subdomainCount > 0 && (
          <button
            type="button"
            className={`asset-summary-chip asset-chip--subdomain ${selectedType === 'subdomain' ? 'active' : ''}`}
            onClick={() => onSelectType(selectedType === 'subdomain' ? 'all' : 'subdomain')}
            title="Filter by Subdomains"
          >
            <span className="chip-indicator" />
            <span className="chip-label">Subdomains</span>
            <span className="chip-count">{subdomainCount}</span>
          </button>
        )}

        {ipCount > 0 && (
          <button
            type="button"
            className={`asset-summary-chip asset-chip--ip ${selectedType === 'ip' ? 'active' : ''}`}
            onClick={() => onSelectType(selectedType === 'ip' ? 'all' : 'ip')}
            title="Filter by IP Addresses"
          >
            <span className="chip-indicator" />
            <span className="chip-label">IP Infrastructure</span>
            <span className="chip-count">{ipCount}</span>
          </button>
        )}

        {certCount > 0 && (
          <button
            type="button"
            className={`asset-summary-chip asset-chip--cert ${selectedType.includes('cert') ? 'active' : ''}`}
            onClick={() => onSelectType(selectedType.includes('cert') ? 'all' : 'certificate_associated_hostname')}
            title="Filter by Certificate Hostnames"
          >
            <span className="chip-indicator" />
            <span className="chip-label">Cert Hostnames</span>
            <span className="chip-count">{certCount}</span>
          </button>
        )}

        {externalCount > 0 && (
          <div className="asset-summary-divider-chip" title="Discovered external references outside primary domain scope">
            <span className="chip-label">External Refs</span>
            <span className="chip-count chip-count--external">{externalCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
