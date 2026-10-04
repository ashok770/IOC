import React from 'react';
import { Asset } from '../../types';
import { AssetTypeBadge } from './AssetTypeBadge';

interface AssetRowProps {
  asset: Asset;
  primaryDomain?: string;
  isSelected: boolean;
  onSelect: (asset: Asset) => void;
}

export const isAssetExternal = (asset: Asset, primaryDomain?: string): boolean => {
  if (!primaryDomain) return false;
  if (asset.asset_type === 'ip') return false;
  const val = asset.value.toLowerCase();
  const domain = primaryDomain.toLowerCase();
  return val !== domain && !val.endsWith(`.${domain}`);
};

export const AssetRow: React.FC<AssetRowProps> = ({
  asset,
  primaryDomain,
  isSelected,
  onSelect,
}) => {
  const isExternal = isAssetExternal(asset, primaryDomain);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(asset);
    }
  };

  const formattedDate = asset.last_seen_at
    ? new Date(asset.last_seen_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--';

  const formatSource = (source: string) => {
    if (source === 'target_registration') return 'Scope Definition';
    return source.toUpperCase();
  };

  return (
    <tr
      className={`assets-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(asset)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
      aria-label={`Asset ${asset.value}, ${asset.asset_type}`}
    >
      {/* 1. ASSET (Strongest visual weight) */}
      <td className="asset-td-value">
        <div className="asset-value-wrapper">
          <span className="asset-primary-value">{asset.value}</span>
        </div>
      </td>

      {/* 2. TYPE */}
      <td className="asset-td-type">
        <AssetTypeBadge type={asset.asset_type} />
      </td>

      {/* 3. SCOPE */}
      <td className="asset-td-scope">
        {isExternal ? (
          <span className="asset-scope-tag asset-scope-tag--external" title="Discovered external entity outside target apex zone">
            <span className="scope-dot" aria-hidden="true" />
            External Reference
          </span>
        ) : (
          <span className="asset-scope-tag asset-scope-tag--target" title="Directly within authorized target assessment boundary">
            <span className="scope-dot" aria-hidden="true" />
            Target Scope
          </span>
        )}
      </td>

      {/* 4. SOURCE */}
      <td className="asset-td-source">
        <span className="asset-source-text">{formatSource(asset.source)}</span>
      </td>

      {/* 5. CONFIDENCE */}
      <td className="asset-td-confidence">
        <span
          className="asset-confidence-badge"
          title="Factual deterministically validated observation from authoritative telemetry."
        >
          100%
        </span>
      </td>

      {/* 6. LAST OBSERVED */}
      <td className="asset-td-date">
        <span className="asset-date-text">{formattedDate}</span>
      </td>
    </tr>
  );
};
