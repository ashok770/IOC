import React from 'react';
import { Asset } from '../../types';
import { AssetRow } from './AssetRow';

export type SortField = 'value' | 'asset_type' | 'scope' | 'source' | 'last_seen_at';
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
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="sort-icon inactive" aria-hidden="true">
          ↕
        </span>
      );
    }
    return (
      <span className="sort-icon active" aria-hidden="true">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="assets-table-container">
      <table className="assets-table" role="table" aria-label="Authoritative discovered perimeter assets inventory">
        <thead>
          <tr>
            {/* ASSET */}
            <th
              className="sortable th-asset"
              onClick={() => onSort('value')}
              scope="col"
              aria-sort={sortField === 'value' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div className="th-content">
                <span>Asset</span>
                {renderSortIndicator('value')}
              </div>
            </th>

            {/* TYPE */}
            <th
              className="sortable th-type"
              onClick={() => onSort('asset_type')}
              scope="col"
              aria-sort={sortField === 'asset_type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div className="th-content">
                <span>Type</span>
                {renderSortIndicator('asset_type')}
              </div>
            </th>

            {/* SCOPE */}
            <th
              className="sortable th-scope"
              onClick={() => onSort('scope')}
              scope="col"
              aria-sort={sortField === 'scope' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div className="th-content">
                <span>Scope</span>
                {renderSortIndicator('scope')}
              </div>
            </th>

            {/* SOURCE */}
            <th
              className="sortable th-source"
              onClick={() => onSort('source')}
              scope="col"
              aria-sort={sortField === 'source' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div className="th-content">
                <span>Source</span>
                {renderSortIndicator('source')}
              </div>
            </th>

            {/* CONFIDENCE */}
            <th scope="col" className="th-confidence">
              <div className="th-content">
                <span>Confidence</span>
              </div>
            </th>

            {/* LAST OBSERVED */}
            <th
              className="sortable th-date"
              onClick={() => onSort('last_seen_at')}
              scope="col"
              aria-sort={sortField === 'last_seen_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <div className="th-content">
                <span>Last Observed</span>
                {renderSortIndicator('last_seen_at')}
              </div>
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
