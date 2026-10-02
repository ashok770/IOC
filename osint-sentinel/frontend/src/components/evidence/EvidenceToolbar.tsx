import React from 'react';

interface EvidenceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  availableTypes: string[];
  selectedSource: string;
  onSourceChange: (source: string) => void;
  availableSources: string[];
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

const formatTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    dns_record: 'DNS Record',
    rdap_registration: 'RDAP Registration',
    http_headers: 'HTTP Headers',
    certificate_hostnames: 'Certificate Hostnames',
    certificate_log_sample: 'Certificate Log Sample',
  };
  return map[type.toLowerCase()] || type.replace(/_/g, ' ').toUpperCase();
};

export const EvidenceToolbar: React.FC<EvidenceToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  availableTypes,
  selectedSource,
  onSourceChange,
  availableSources,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedType !== 'all' ||
    selectedSource !== 'all';

  return (
    <div className="evidence-toolbar">
      {/* Left: Search & Filter dropdowns */}
      <div className="evidence-toolbar-left">
        {/* Search */}
        <div className="evidence-search-wrapper">
          <span className="evidence-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="evidence-search-input"
            placeholder="Search evidence, source, domain, value..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search evidence items"
          />
          {searchQuery && (
            <button
              type="button"
              className="evidence-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Evidence Type filter */}
        <select
          className="evidence-filter-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filter observations by evidence type"
        >
          <option value="all">ALL EVIDENCE TYPES</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {formatTypeLabel(t)}
            </option>
          ))}
        </select>

        {/* Source filter */}
        {availableSources.length > 1 && (
          <select
            className="evidence-filter-select"
            value={selectedSource}
            onChange={(e) => onSourceChange(e.target.value)}
            aria-label="Filter observations by source"
          >
            <option value="all">ALL SOURCES</option>
            {availableSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Counter & Clear button */}
      <div className="evidence-toolbar-right">
        <span className="evidence-count-label">
          {hasActiveFilters ? (
            <>
              <span className="evidence-count-number">{filteredCount}</span> OF{' '}
              <span className="evidence-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'EVIDENCE RECORD' : 'EVIDENCE RECORDS'}
            </>
          ) : (
            <>
              <span className="evidence-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'EVIDENCE RECORD' : 'EVIDENCE RECORDS'}
            </>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            className="evidence-clear-btn"
            onClick={onClearFilters}
            aria-label="Clear all evidence filters"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
