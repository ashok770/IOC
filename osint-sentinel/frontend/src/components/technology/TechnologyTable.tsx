import React from 'react';
import { Technology, Asset } from '../../types';
import { TechnologyRow } from './TechnologyRow';

export type TechnologySortField = 'name' | 'category' | 'confidence' | 'last_seen';
export type TechnologySortOrder = 'asc' | 'desc';

interface TechnologyTableProps {
  technologies: Technology[];
  assetMap: Map<string, Asset>;
  selectedTech: Technology | null;
  onSelectTech: (tech: Technology) => void;
  sortField: TechnologySortField;
  sortOrder: TechnologySortOrder;
  onSort: (field: TechnologySortField) => void;
}

export const TechnologyTable: React.FC<TechnologyTableProps> = ({
  technologies,
  assetMap,
  selectedTech,
  onSelectTech,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIndicator = (field: TechnologySortField) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="technology-table-container">
      <table className="technology-table" role="table" aria-label="Technology observations inventory">
        <thead>
          <tr>
            <th
              className="sortable"
              onClick={() => onSort('name')}
              title="Sort by technology name"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('name')}
              role="columnheader"
              aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Technology {renderSortIndicator('name')}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('category')}
              title="Sort by category"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('category')}
              role="columnheader"
              aria-sort={sortField === 'category' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Category {renderSortIndicator('category')}
            </th>
            <th role="columnheader">Observed On</th>
            <th role="columnheader">Detection Method</th>
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
              onClick={() => onSort('last_seen')}
              title="Sort by last observed timestamp"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSort('last_seen')}
              role="columnheader"
              aria-sort={sortField === 'last_seen' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Last Observed {renderSortIndicator('last_seen')}
            </th>
          </tr>
        </thead>
        <tbody>
          {technologies.map((tech) => (
            <TechnologyRow
              key={tech.id}
              tech={tech}
              associatedAsset={tech.asset_id ? assetMap.get(tech.asset_id) : undefined}
              isSelected={selectedTech?.id === tech.id}
              onSelect={onSelectTech}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
