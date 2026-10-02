import React from 'react';

interface TechnologyToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availableCategories: string[];
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  availableMethods: string[];
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

const formatMethodLabel = (method: string): string => {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    cdn: 'CDN',
    web_server: 'Web Server',
    framework: 'Framework',
    cms: 'CMS',
    cloud: 'Cloud',
    email: 'Email',
    other: 'Other',
  };
  return map[category.toLowerCase()] || category.replace(/_/g, ' ').toUpperCase();
};

export const TechnologyToolbar: React.FC<TechnologyToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedMethod,
  onMethodChange,
  availableMethods,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    selectedMethod !== 'all';

  return (
    <div className="technology-toolbar">
      {/* Left: Search & Filter dropdowns */}
      <div className="technology-toolbar-left">
        {/* Search */}
        <div className="technology-search-wrapper">
          <span className="technology-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="technology-search-input"
            placeholder="Search technology, version, asset..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search technology observations"
          />
          {searchQuery && (
            <button
              type="button"
              className="technology-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          className="technology-filter-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter observations by category"
        >
          <option value="all">ALL CATEGORIES</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategoryLabel(cat)}
            </option>
          ))}
        </select>

        {/* Detection method filter */}
        {availableMethods.length > 1 && (
          <select
            className="technology-filter-select"
            value={selectedMethod}
            onChange={(e) => onMethodChange(e.target.value)}
            aria-label="Filter observations by detection method"
          >
            <option value="all">ALL DETECTION METHODS</option>
            {availableMethods.map((method) => (
              <option key={method} value={method}>
                {formatMethodLabel(method)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Counter & Clear button */}
      <div className="technology-toolbar-right">
        <span className="technology-count-label">
          {hasActiveFilters ? (
            <>
              <span className="technology-count-number">{filteredCount}</span> OF{' '}
              <span className="technology-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'TECHNOLOGY OBSERVATION' : 'TECHNOLOGY OBSERVATIONS'}
            </>
          ) : (
            <>
              <span className="technology-count-number">{totalCount}</span>{' '}
              {totalCount === 1 ? 'TECHNOLOGY OBSERVATION' : 'TECHNOLOGY OBSERVATIONS'}
            </>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            className="technology-clear-btn"
            onClick={onClearFilters}
            aria-label="Clear all technology filters"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
