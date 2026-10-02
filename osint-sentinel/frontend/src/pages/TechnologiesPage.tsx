import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { technologyApi, assetApi } from '../api';
import { Technology, Asset } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  TechnologyToolbar,
  TechnologyTable,
  TechnologyDetailDrawer,
  TechnologySortField,
  TechnologySortOrder,
} from '../components/technology';

export const TechnologiesPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
    isCollectionRunning,
  } = useTarget();

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, Asset>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [sortField, setSortField] = useState<TechnologySortField>('last_seen');
  const [sortOrder, setSortOrder] = useState<TechnologySortOrder>('desc');

  // Selected technology for investigation drawer
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  // Load technology observations and assets for active target
  const loadTechnologyData = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [techRes, assetsRes] = await Promise.all([
        technologyApi.listTargetTechnologies(targetId, { limit: 250 }),
        assetApi.listTargetAssets(targetId, { limit: 250 }).catch(() => ({ items: [] })),
      ]);

      setTechnologies(techRes.items || []);

      // Build map of assets for fast resolution of associated asset details
      const map = new Map<string, Asset>();
      (assetsRes.items || []).forEach((a) => map.set(a.id, a));
      setAssetMap(map);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The technology observation inventory could not be retrieved from the assessment API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all state immediately to prevent cross-target leakage
  useEffect(() => {
    setTechnologies([]);
    setAssetMap(new Map());
    setSelectedTech(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMethod('all');
    setError(null);

    if (selectedTarget?.id) {
      loadTechnologyData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadTechnologyData]);

  // Handle re-running passive assessment from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadTechnologyData(selectedTarget.id);
    }
  };

  // Sorting handler
  const handleSort = (field: TechnologySortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'confidence' || field === 'last_seen' ? 'desc' : 'asc');
    }
  };

  // Derive available categories and detection methods from the actual loaded data
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    technologies.forEach((t) => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }, [technologies]);

  const availableMethods = useMemo(() => {
    const methods = new Set<string>();
    technologies.forEach((t) => {
      if (t.detection_method) methods.add(t.detection_method);
    });
    return Array.from(methods).sort();
  }, [technologies]);

  // Filtered & sorted technology observations
  const filteredTechnologies = useMemo(() => {
    let result = [...technologies];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by detection method
    if (selectedMethod !== 'all') {
      result = result.filter(
        (t) => t.detection_method.toLowerCase() === selectedMethod.toLowerCase()
      );
    }

    // Filter by search query (case-insensitive across name, category, version, asset, detection_method, extra_data)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(query);
        const catMatch = t.category.toLowerCase().includes(query);
        const verMatch = Boolean(t.version && t.version.toLowerCase().includes(query));
        const methodMatch = t.detection_method.toLowerCase().includes(query);
        const assetObj = t.asset_id ? assetMap.get(t.asset_id) : undefined;
        const assetMatch = Boolean(assetObj && assetObj.value.toLowerCase().includes(query));

        // Search in extra_data fields
        const extra = (t.extra_data || {}) as Record<string, unknown>;
        const headerMatch =
          typeof extra.matched_header === 'string' &&
          extra.matched_header.toLowerCase().includes(query);
        const rawValMatch =
          typeof extra.raw_value === 'string' &&
          extra.raw_value.toLowerCase().includes(query);
        const probedUrlMatch =
          typeof extra.probed_url === 'string' &&
          extra.probed_url.toLowerCase().includes(query);

        return (
          nameMatch ||
          catMatch ||
          verMatch ||
          methodMatch ||
          assetMatch ||
          headerMatch ||
          rawValMatch ||
          probedUrlMatch
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'category') {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === 'confidence') {
        cmp = (a.confidence || 0) - (b.confidence || 0);
      } else if (sortField === 'last_seen') {
        const dateA = new Date(a.last_seen || a.first_seen || 0).getTime();
        const dateB = new Date(b.last_seen || b.first_seen || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [technologies, assetMap, selectedCategory, selectedMethod, searchQuery, sortField, sortOrder]);

  // Loading targets check
  if (isLoadingTargets && !selectedTarget) {
    return (
      <PageContainer>
        <div className="state-box">
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading assessment scope...</span>
        </div>
      </PageContainer>
    );
  }

  // No target selected
  if (!selectedTarget) {
    return (
      <PageContainer>
        <EmptyState
          title="NO ASSESSMENT SELECTED"
          message="Select or create an assessment target to view technology intelligence."
          actionText="+ CREATE ASSESSMENT"
          onAction={openCreateModal}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Technology Intelligence"
        subtitle="Passively observed technology fingerprints across the assessed external perimeter."
        badge={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--color-accent-cyan)',
              backgroundColor: 'var(--color-accent-cyan-subtle)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 200, 229, 0.25)',
            }}
          >
            TARGET: {selectedTarget.primary_domain}
          </span>
        }
      />

      {/* Main Content States */}
      {error ? (
        <ErrorState
          title="TECHNOLOGY INTELLIGENCE UNAVAILABLE"
          message={error}
          onRetry={() => loadTechnologyData(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING TECHNOLOGY INTELLIGENCE...</span>
          <p className="state-message">
            Retrieving passive technology fingerprints from assessment scope.
          </p>
        </div>
      ) : technologies.length === 0 ? (
        <EmptyState
          title="NO TECHNOLOGY OBSERVATIONS"
          message="The passive assessment returned no technology observations for the selected target scope."
          actionText={isCollectionRunning ? 'COLLECTING INTELLIGENCE...' : 'RUN PASSIVE ASSESSMENT'}
          onAction={isCollectionRunning ? undefined : handleRunAssessment}
        />
      ) : (
        <>
          {/* Toolbar */}
          <TechnologyToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            availableCategories={availableCategories}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            availableMethods={availableMethods}
            totalCount={technologies.length}
            filteredCount={filteredTechnologies.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedMethod('all');
            }}
          />

          {/* Table or Filtered Empty State */}
          {filteredTechnologies.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING TECHNOLOGIES</span>
              <p className="state-message">
                No technology observations match the current search query "{searchQuery}" and active filters.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedMethod('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <TechnologyTable
              technologies={filteredTechnologies}
              assetMap={assetMap}
              selectedTech={selectedTech}
              onSelectTech={(tech) => setSelectedTech(tech)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Technology Detail Drawer */}
      <TechnologyDetailDrawer
        tech={selectedTech}
        associatedAsset={selectedTech?.asset_id ? assetMap.get(selectedTech.asset_id) : undefined}
        onClose={() => setSelectedTech(null)}
      />
    </PageContainer>
  );
};
