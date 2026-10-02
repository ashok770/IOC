import React from 'react';
import { Asset } from '../../types';
import { AssetRow } from './AssetRow';

export type SortField = 'value' | 'asset_type' | 'source' | 'last_seen_at';
export type SortOrder = 'asc' | 'desc';

interface AssetTableProps {
  assets: Asset[];
  primaryDomain?: string;
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  primaryDomain,
  selectedAsset,
  onSelectAsset,
  sortField,
  sortOrder,
  onSort,
}) => {
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="assets-table-container">
      <table className="assets-table" role="table" aria-label="Discovered external perimeter assets">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort('value')}
              scope="col"
              aria-sort={sortField === 'value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Asset Value{getSortIndicator('value')}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('asset_type')}
              scope="col"
              aria-sort={sortField === 'asset_type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Type{getSortIndicator('asset_type')}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('source')}
              scope="col"
              aria-sort={sortField === 'source' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Intelligence Source{getSortIndicator('source')}
            </th>
            <th scope="col">Confidence</th>
            <th
              className="sortable"
              onClick={() => onSort('last_seen_at')}
              scope="col"
              aria-sort={sortField === 'last_seen_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Last Observed{getSortIndicator('last_seen_at')}
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              primaryDomain={primaryDomain}
              isSelected={selectedAsset?.id === asset.id}
              onSelect={onSelectAsset}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
