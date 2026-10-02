import React from 'react';

interface AssetToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

export const AssetToolbar: React.FC<AssetToolbarProps> = ({
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
    <div className="assets-toolbar" role="toolbar" aria-label="Asset inventory filters and search">
      <div className="assets-toolbar-left">
        {/* Search Input */}
        <div className="assets-search-wrapper">
          <span className="assets-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="assets-search-input"
            placeholder="Search assets (e.g. domain, subdomain, IP)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search assets by domain, hostname, or IP"
          />
          {searchQuery && (
            <button
              type="button"
              className="assets-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
            >
              ×
            </button>
          )}
        </div>

        {/* Type Filter */}
        <select
          className="assets-filter-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter assets by type"
        >
          <option value="all">ALL TYPES</option>
          <option value="domain">Domain</option>
          <option value="subdomain">Subdomain</option>
          <option value="ip">IP Address</option>
          <option value="certificate_associated_hostname">Certificate Hostname</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="assets-clear-btn"
            onClick={onClearFilters}
            title="Reset search and type filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="assets-toolbar-right">
        <span className="assets-count-label">
          {hasActiveFilters ? (
            <>
              <span className="assets-count-number">{filteredCount}</span> of {totalCount} ASSETS
            </>
          ) : (
            <>
              <span className="assets-count-number">{totalCount}</span> ASSETS DISCOVERED
            </>
          )}
        </span>
      </div>
    </div>
  );
};
