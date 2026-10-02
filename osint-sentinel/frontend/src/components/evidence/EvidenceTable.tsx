import React from 'react';
import { EvidenceItem } from '../../types';
import { EvidenceRow } from './EvidenceRow';

export type EvidenceSortField = 'evidence_type' | 'source' | 'confidence' | 'collected_at';
export type EvidenceSortOrder = 'asc' | 'desc';

interface EvidenceTableProps {
  items: EvidenceItem[];
  selectedItem: EvidenceItem | null;
  onSelectItem: (item: EvidenceItem) => void;
  sortField: EvidenceSortField;
  sortOrder: EvidenceSortOrder;
  onSort: (field: EvidenceSortField) => void;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  items,
  selectedItem,
  onSelectItem,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIndicator = (field: EvidenceSortField) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="evidence-table-container">
      <table className="evidence-table" role="table" aria-label="Evidence inventory">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort('evidence_type')}
              title="Sort by evidence type"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('evidence_type')}
              role="columnheader"
              aria-sort={sortField === 'evidence_type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Type {renderSortIndicator('evidence_type')}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('source')}
              title="Sort by collector source"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('source')}
              role="columnheader"
              aria-sort={sortField === 'source' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Source {renderSortIndicator('source')}
            </th>
            <th role="columnheader">Observation / Telemetry</th>
            <th
              className="sortable"
              onClick={() => onSort('confidence')}
              title="Sort by observation confidence"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('confidence')}
              role="columnheader"
              aria-sort={sortField === 'confidence' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Confidence {renderSortIndicator('confidence')}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('collected_at')}
              title="Sort by collection timestamp"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('collected_at')}
              role="columnheader"
              aria-sort={sortField === 'collected_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Collected At {renderSortIndicator('collected_at')}
            </th>
            <th role="columnheader">Evidence ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={onSelectItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
