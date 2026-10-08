import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTarget } from '../context/TargetContext';
import { assetApi } from '../api';
import { Asset } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  AssetToolbar,
  AssetTable,
  AssetSummaryStrip,
  SortField,
  SortOrder,
  ScopeFilter,
  isAssetExternal,
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

  // Search, filter & sorting states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<ScopeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('last_seen_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const navigate = useNavigate();

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
    setSearchQuery('');
    setSelectedType('all');
    setSelectedScope('all');
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
    const primaryDomain = selectedTarget?.primary_domain;

    // 1. Filter by Type
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

    // 2. Filter by Scope
    if (selectedScope !== 'all') {
      result = result.filter((a) => {
        const isExternal = isAssetExternal(a, primaryDomain);
        if (selectedScope === 'target_scope') return !isExternal;
        if (selectedScope === 'external_reference') return isExternal;
        return true;
      });
    }

    // 3. Filter by Search query (case-insensitive value matching)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.value.toLowerCase().includes(query) ||
          a.source.toLowerCase().includes(query) ||
          a.asset_type.toLowerCase().includes(query)
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'value') {
        cmp = a.value.localeCompare(b.value);
      } else if (sortField === 'asset_type') {
        cmp = a.asset_type.localeCompare(b.asset_type);
      } else if (sortField === 'scope') {
        const extA = isAssetExternal(a, primaryDomain) ? 1 : 0;
        const extB = isAssetExternal(b, primaryDomain) ? 1 : 0;
        cmp = extA - extB;
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
  }, [assets, selectedType, selectedScope, searchQuery, sortField, sortOrder, selectedTarget?.primary_domain]);

  // Loading targets state
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
      {/* SECTION 1 — Compact Page Header */}
      <PageHeader
        title="Asset Intelligence"
        subtitle="Discovered external assets within the authorized assessment scope."
        badge={
          <span className="asset-header-target-tag">
            TARGET: {selectedTarget.primary_domain}
          </span>
        }
        actions={
          <div className="asset-header-meta">
            <span className="asset-header-count-indicator">
              <span className="count-number">{assets.length}</span> Assets Discovered
            </span>
          </div>
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
        <div className="assets-content-stack">
          {/* Asset Type Composition Summary */}
          <AssetSummaryStrip
            assets={assets}
            primaryDomain={selectedTarget.primary_domain}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />

          {/* SECTION 2 — Search / Filter Toolbar */}
          <AssetToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedScope={selectedScope}
            onScopeChange={setSelectedScope}
            totalCount={assets.length}
            filteredCount={filteredAssets.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedScope('all');
            }}
          />

          {/* SECTION 3 — Primary Asset Table */}
          {filteredAssets.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING ASSETS</span>
              <p className="state-message">
                No assets match the active search and scope criteria.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedScope('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <AssetTable
              assets={filteredAssets}
              primaryDomain={selectedTarget.primary_domain}
              selectedAsset={null}
              onSelectAsset={(a) => navigate(`/assets/${a.id}`)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
};
