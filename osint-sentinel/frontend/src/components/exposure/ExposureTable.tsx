import React from 'react';
import { ExposureSignal, Asset } from '../../types';
import { ExposureRow } from './ExposureRow';

export type ExposureSortField = 'signal_type' | 'confidence' | 'created_at';
export type ExposureSortOrder = 'asc' | 'desc';

interface ExposureTableProps {
  signals: ExposureSignal[];
  assetMap: Map<string, Asset>;
  selectedSignal: ExposureSignal | null;
  onSelectSignal: (signal: ExposureSignal) => void;
  sortField: ExposureSortField;
  sortOrder: ExposureSortOrder;
  onSort: (field: ExposureSortField) => void;
}

export const ExposureTable: React.FC<ExposureTableProps> = ({
  signals,
  assetMap,
  selectedSignal,
  onSelectSignal,
  sortField,
  sortOrder,
  onSort,
}) => {
  const getSortIndicator = (field: ExposureSortField) => {
    if (sortField !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="exposure-table-container">
      <table className="exposure-table" role="table" aria-label="Observed exposure signals">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort('signal_type')}
              scope="col"
              style={{ width: '48%' }}
              aria-sort={sortField === 'signal_type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Observed Signal & Telemetry{getSortIndicator('signal_type')}
            </th>
            <th scope="col" style={{ width: '26%' }}>
              Affected Asset
            </th>
            <th
              className="sortable"
              onClick={() => onSort('confidence')}
              scope="col"
              style={{ width: '16%' }}
              aria-sort={sortField === 'confidence' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Confidence{getSortIndicator('confidence')}
            </th>
            <th scope="col" style={{ width: '10%' }}>
              Severity
            </th>
          </tr>
        </thead>
        <tbody>
          {signals.map((sig) => (
            <ExposureRow
              key={sig.id}
              signal={sig}
              affectedAsset={sig.asset_id ? assetMap.get(sig.asset_id) : undefined}
              isSelected={selectedSignal?.id === sig.id}
              onSelect={onSelectSignal}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
