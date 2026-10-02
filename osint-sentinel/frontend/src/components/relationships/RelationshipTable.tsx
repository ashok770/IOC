import React from 'react';
import { Relationship, Asset, Technology } from '../../types';
import { RelationshipRow } from './RelationshipRow';

export type RelationshipSortField = 'relationship_type' | 'confidence' | 'created_at';
export type RelationshipSortOrder = 'asc' | 'desc';

interface RelationshipTableProps {
  relationships: Relationship[];
  targetDomain: string;
  assetMap: Map<string, Asset>;
  techMap: Map<string, Technology>;
  selectedRel: Relationship | null;
  onSelectRel: (rel: Relationship) => void;
  sortField: RelationshipSortField;
  sortOrder: RelationshipSortOrder;
  onSort: (field: RelationshipSortField) => void;
}

export const RelationshipTable: React.FC<RelationshipTableProps> = ({
  relationships,
  targetDomain,
  assetMap,
  techMap,
  selectedRel,
  onSelectRel,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIndicator = (field: RelationshipSortField) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="relationship-table-container">
      <table className="relationship-table" role="table" aria-label="External asset relationships inventory">
        <thead>
          <tr>
            <th role="columnheader">Source Entity</th>
            <th
              className="sortable"
              onClick={() => onSort('relationship_type')}
              title="Sort by relationship type"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('relationship_type')}
              role="columnheader"
              aria-sort={sortField === 'relationship_type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Relationship Type {renderSortIndicator('relationship_type')}
            </th>
            <th role="columnheader">Target Entity</th>
            <th role="columnheader">Scope</th>
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
            <th role="columnheader">Evidence ID</th>
            <th
              className="sortable"
              onClick={() => onSort('created_at')}
              title="Sort by observation timestamp"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('created_at')}
              role="columnheader"
              aria-sort={sortField === 'created_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Observed At {renderSortIndicator('created_at')}
            </th>
          </tr>
        </thead>
        <tbody>
          {relationships.map((rel) => (
            <RelationshipRow
              key={rel.id}
              rel={rel}
              targetDomain={targetDomain}
              assetMap={assetMap}
              techMap={techMap}
              isSelected={selectedRel?.id === rel.id}
              onSelect={onSelectRel}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
