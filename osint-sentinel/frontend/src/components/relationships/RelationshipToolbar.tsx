import React from 'react';

interface RelationshipToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  availableTypes: string[];
  selectedScope: string;
  onScopeChange: (scope: string) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

const formatTypeLabel = (type: string): string => {
  return type.replace(/_/g, ' ').toUpperCase();
};

export const RelationshipToolbar: React.FC<RelationshipToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableTypes,
  selectedScope,
  onScopeChange,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedType !== 'all' ||
    selectedScope !== 'all';

  return (
    <div className="relationship-toolbar">
      {/* Left: Search & Filter dropdowns */}
      <div className="relationship-toolbar-left">
        {/* Search */}
        <div className="relationship-search-wrapper">
          <span className="relationship-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="relationship-search-input"
            placeholder="Search source, target, relationship, evidence..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search observed relationships"
          />
          {searchQuery && (
            <button
              type="button"
              className="relationship-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Relationship Type filter */}
        <select
          className="relationship-filter-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter relationships by type"
        >
          <option value="all">ALL RELATIONSHIP TYPES</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {formatTypeLabel(t)}
            </option>
          ))}
        </select>

        {/* Scope filter */}
        <select
          className="relationship-filter-select"
          value={selectedScope}
          onChange={(e) => onScopeChange(e.target.value)}
          aria-label="Filter relationships by scope classification"
        >
          <option value="all">ALL SCOPES</option>
          <option value="target">TARGET SCOPE</option>
          <option value="external">EXTERNAL REFERENCE</option>
          <option value="tech">TECHNOLOGY OBSERVATION</option>
          <option value="evidence">EVIDENCE PROVENANCE</option>
        </select>
      </div>

      {/* Right: Counter & Clear button */}
      <div className="relationship-toolbar-right">
        <span className="relationship-count-label">
          {hasActiveFilters ? (
            <>
              <span className="relationship-count-number">{filteredCount}</span> OF{' '}
              <span className="relationship-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'OBSERVED RELATIONSHIP' : 'OBSERVED RELATIONSHIPS'}
            </>
          ) : (
            <>
              <span className="relationship-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'OBSERVED RELATIONSHIP' : 'OBSERVED RELATIONSHIPS'}
            </>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            className="relationship-clear-btn"
            onClick={onClearFilters}
            aria-label="Clear all relationship filters"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
