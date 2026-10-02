import React from 'react';

interface ExposureToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

export const ExposureToolbar: React.FC<ExposureToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedType !== 'all';

  return (
    <div className="exposure-toolbar" role="toolbar" aria-label="Exposure signals search and filters">
      <div className="exposure-toolbar-left">
        {/* Search */}
        <div className="exposure-search-wrapper">
          <span className="exposure-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="exposure-search-input"
            placeholder="Search exposure signals (e.g. remote, test, cloudflare)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search exposure signals by keyword, asset, or title"
          />
          {searchQuery && (
            <button
              type="button"
              className="exposure-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
            >
              ×
            </button>
          )}
        </div>

        {/* Signal Type Filter */}
        <select
          className="exposure-filter-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter exposure signals by signal type"
        >
          <option value="all">ALL TYPES</option>
          <option value="remote_access_indicator">Remote Access Indicator</option>
          <option value="development_test_indicator">Development / Test Indicator</option>
          <option value="technology_disclosure">Technology Disclosure</option>
          <option value="external_dependency_reference">External Dependency Reference</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="exposure-clear-btn"
            onClick={onClearFilters}
            title="Reset search and filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="exposure-toolbar-right">
        <span className="exposure-count-label">
          {hasActiveFilters ? (
            <>
              <span className="exposure-count-number">{filteredCount}</span> of {totalCount} OBSERVED SIGNALS
            </>
          ) : (
            <>
              <span className="exposure-count-number">{totalCount}</span> OBSERVED EXPOSURE SIGNALS
            </>
          )}
        </span>
      </div>
    </div>
  );
};
