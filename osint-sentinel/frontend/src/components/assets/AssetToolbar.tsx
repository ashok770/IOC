import React from 'react';

export type ScopeFilter = 'all' | 'target_scope' | 'external_reference';

interface AssetToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedScope: ScopeFilter;
  onScopeChange: (scope: ScopeFilter) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

export const AssetToolbar: React.FC<AssetToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedScope,
  onScopeChange,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedType !== 'all' || selectedScope !== 'all';

  return (
    <div className="assets-toolbar" role="toolbar" aria-label="Asset inventory search and filters">
      <div className="assets-toolbar-controls">
        {/* Dominant Search Input */}
        <div className="assets-search-wrapper">
          <span className="assets-search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="assets-search-input"
            placeholder="Search discovered assets by hostname, domain, or IP address..."
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
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Secondary Filter: Asset Type */}
        <div className="assets-filter-group">
          <label htmlFor="asset-type-select" className="sr-only">Filter by Asset Type</label>
          <select
            id="asset-type-select"
            className="assets-filter-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter assets by type"
          >
            <option value="all">All Asset Types</option>
            <option value="domain">Domain (Apex)</option>
            <option value="subdomain">Subdomain</option>
            <option value="ip">IP Infrastructure</option>
            <option value="certificate_associated_hostname">Certificate Hostname</option>
          </select>
        </div>

        {/* Secondary Filter: Scope Classification */}
        <div className="assets-filter-group">
          <label htmlFor="asset-scope-select" className="sr-only">Filter by Scope</label>
          <select
            id="asset-scope-select"
            className="assets-filter-select"
            value={selectedScope}
            onChange={(e) => onScopeChange(e.target.value as ScopeFilter)}
            aria-label="Filter assets by scope classification"
          >
            <option value="all">All Scopes</option>
            <option value="target_scope">Target Scope Only</option>
            <option value="external_reference">External References</option>
          </select>
        </div>

        {/* Clear Filters CTA */}
        {hasActiveFilters && (
          <button
            type="button"
            className="assets-clear-btn"
            onClick={onClearFilters}
            title="Reset all active search and filter parameters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Right-side Count Display */}
      <div className="assets-toolbar-meta">
        <span className="assets-count-display">
          {hasActiveFilters ? (
            <>
              Showing <span className="assets-count-highlight">{filteredCount}</span> of {totalCount} assets
            </>
          ) : (
            <>
              <span className="assets-count-highlight">{totalCount}</span> assets in scope
            </>
          )}
        </span>
      </div>
    </div>
  );
};
