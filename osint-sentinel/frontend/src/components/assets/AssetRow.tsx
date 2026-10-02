import React from 'react';
import { Asset } from '../../types';
import { AssetTypeBadge } from './AssetTypeBadge';

interface AssetRowProps {
  asset: Asset;
  primaryDomain?: string;
  isSelected: boolean;
  onSelect: (asset: Asset) => void;
}

export const AssetRow: React.FC<AssetRowProps> = ({
  asset,
  primaryDomain,
  isSelected,
  onSelect,
}) => {
  const isExternal =
    primaryDomain &&
    asset.asset_type !== 'ip' &&
    asset.value.toLowerCase() !== primaryDomain.toLowerCase() &&
    !asset.value.toLowerCase().endsWith(`.${primaryDomain.toLowerCase()}`);

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

  return (
    <tr
      className={`assets-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(asset)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
      aria-label={`Asset ${asset.value}, type ${asset.asset_type}`}
    >
      {/* Asset Value */}
      <td>
        <div className="asset-cell-value">
          <span>{asset.value}</span>
          {isExternal && <span className="external-tag">External Ref</span>}
        </div>
      </td>

      {/* Asset Type */}
      <td>
        <AssetTypeBadge type={asset.asset_type} />
      </td>

      {/* Source */}
      <td>
        <span className="asset-cell-source">{asset.source}</span>
      </td>

      {/* Confidence */}
      <td>
        <span
          className="asset-cell-confidence"
          title="Factual observation confidence based on authoritative intelligence sources."
        >
          1.00
        </span>
      </td>

      {/* Last Seen */}
      <td>
        <span className="asset-cell-date">{formattedDate}</span>
      </td>
    </tr>
  );
};
