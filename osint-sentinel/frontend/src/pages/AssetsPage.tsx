import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { assetApi } from '../api';
import { Asset } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  AssetToolbar,
  AssetTable,
  AssetDetailDrawer,
  SortField,
  SortOrder,
} from '../components/assets';

export const AssetsPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
    isCollectionRunning,
  } = useTarget();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter, search & sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_seen_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selected asset for investigation drawer
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Load assets strictly scoped to the active target
  const loadAssets = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await assetApi.listTargetAssets(targetId, { limit: 250 });
      setAssets(res.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The asset inventory could not be retrieved from the assessment API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all states and reload for new target
  useEffect(() => {
    // Immediately clear previous target's data to prevent cross-target leakage
    setAssets([]);
    setSelectedAsset(null);
    setSearchQuery('');
    setSelectedType('all');
    setError(null);

    if (selectedTarget?.id) {
      loadAssets(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadAssets]);

  // Handle running passive assessment directly from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadAssets(selectedTarget.id);
    }
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & sorted asset list
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((a) => {
        if (selectedType === 'certificate_associated_hostname') {
          return (
            a.asset_type === 'certificate_associated_hostname' ||
            a.asset_type === 'certificate_hostname'
          );
        }
        return a.asset_type === selectedType;
      });
    }

    // Filter by search query (case-insensitive value matching)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((a) => a.value.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'value') {
        cmp = a.value.localeCompare(b.value);
      } else if (sortField === 'asset_type') {
        cmp = a.asset_type.localeCompare(b.asset_type);
      } else if (sortField === 'source') {
        cmp = a.source.localeCompare(b.source);
      } else if (sortField === 'last_seen_at') {
        const dateA = new Date(a.last_seen_at || 0).getTime();
        const dateB = new Date(b.last_seen_at || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [assets, selectedType, searchQuery, sortField, sortOrder]);

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
          message="Create or select an assessment target to view discovered assets."
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
        title="Asset Intelligence"
        subtitle="Discovered external assets within the authorized assessment scope."
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

      {/* Main Content Area */}
      {error ? (
        <ErrorState
          title="ASSET INVENTORY UNAVAILABLE"
          message={error}
          onRetry={() => loadAssets(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING ASSET INVENTORY...</span>
          <p className="state-message">Querying authoritative perimeter asset catalog.</p>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="NO DISCOVERED ASSETS"
          message="No perimeter assets have been recorded for this target yet. Initiate a passive assessment to discover DNS records, certificate hostnames, and IP infrastructure."
          actionText={isCollectionRunning ? 'COLLECTING INTELLIGENCE...' : 'RUN PASSIVE ASSESSMENT'}
          onAction={isCollectionRunning ? undefined : handleRunAssessment}
        />
      ) : (
        <>
          {/* Toolbar */}
          <AssetToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            totalCount={assets.length}
            filteredCount={filteredAssets.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
          />

          {/* Table or Filtered Empty State */}
          {filteredAssets.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING ASSETS</span>
              <p className="state-message">
                No assets match the current search query "{searchQuery}" and type filter.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <AssetTable
              assets={filteredAssets}
              primaryDomain={selectedTarget.primary_domain}
              selectedAsset={selectedAsset}
              onSelectAsset={(a) => setSelectedAsset(a)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Investigation Detail Drawer */}
      <AssetDetailDrawer
        asset={selectedAsset}
        primaryDomain={selectedTarget.primary_domain}
        onClose={() => setSelectedAsset(null)}
      />
    </PageContainer>
  );
};
