import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { exposureApi, assetApi } from '../api';
import { ExposureSignal, Asset } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  ExposureToolbar,
  ExposureTable,
  ExposureDetailDrawer,
  ExposureSortField,
  ExposureSortOrder,
} from '../components/exposure';

export const ExposurePage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
    isCollectionRunning,
  } = useTarget();

  const [signals, setSignals] = useState<ExposureSignal[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, Asset>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortField, setSortField] = useState<ExposureSortField>('confidence');
  const [sortOrder, setSortOrder] = useState<ExposureSortOrder>('desc');

  // Selected signal for investigation drawer
  const [selectedSignal, setSelectedSignal] = useState<ExposureSignal | null>(null);

  // Load exposure signals and assets for the active target
  const loadExposureData = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [signalsRes, assetsRes] = await Promise.all([
        exposureApi.listExposureSignals(targetId, { limit: 200 }),
        assetApi.listTargetAssets(targetId, { limit: 250 }).catch(() => ({ items: [] })),
      ]);

      setSignals(signalsRes.items || []);

      // Build map of assets for fast resolution of affected asset details
      const map = new Map<string, Asset>();
      (assetsRes.items || []).forEach((a) => map.set(a.id, a));
      setAssetMap(map);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The exposure signal inventory could not be retrieved from the assessment API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all state immediately to prevent cross-target leakage
  useEffect(() => {
    setSignals([]);
    setAssetMap(new Map());
    setSelectedSignal(null);
    setSearchQuery('');
    setSelectedType('all');
    setError(null);

    if (selectedTarget?.id) {
      loadExposureData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadExposureData]);

  // Handle re-running passive assessment from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadExposureData(selectedTarget.id);
    }
  };

  // Sorting handler
  const handleSort = (field: ExposureSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'confidence' ? 'desc' : 'asc');
    }
  };

  // Filtered & sorted signals
  const filteredSignals = useMemo(() => {
    let result = [...signals];

    // Filter by signal type
    if (selectedType !== 'all') {
      result = result.filter((s) => s.signal_type === selectedType);
    }

    // Filter by search query (case-insensitive across title, description, asset, extra_data)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(query);
        const descMatch = s.description.toLowerCase().includes(query);
        const typeMatch = s.signal_type.toLowerCase().includes(query);
        const assetObj = s.asset_id ? assetMap.get(s.asset_id) : undefined;
        const assetMatch = assetObj?.value.toLowerCase().includes(query);
        const extraHostnameMatch =
          typeof s.extra_data?.hostname === 'string' &&
          s.extra_data.hostname.toLowerCase().includes(query);
        const extraEntityMatch =
          typeof s.extra_data?.referenced_entity === 'string' &&
          s.extra_data.referenced_entity.toLowerCase().includes(query);
        const extraTechMatch =
          typeof s.extra_data?.technology_name === 'string' &&
          s.extra_data.technology_name.toLowerCase().includes(query);

        return (
          titleMatch ||
          descMatch ||
          typeMatch ||
          assetMatch ||
          extraHostnameMatch ||
          extraEntityMatch ||
          extraTechMatch
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'signal_type') {
        cmp = a.signal_type.localeCompare(b.signal_type);
      } else if (sortField === 'confidence') {
        cmp = (a.confidence || 0) - (b.confidence || 0);
      } else if (sortField === 'created_at') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [signals, assetMap, selectedType, searchQuery, sortField, sortOrder]);

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
          message="Select or create an assessment target to view exposure intelligence."
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
        title="Exposure Intelligence"
        subtitle="Deterministic security-relevant observations derived from the authorized external assessment."
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

      {/* Main Content */}
      {error ? (
        <ErrorState
          title="EXPOSURE INTELLIGENCE UNAVAILABLE"
          message={error}
          onRetry={() => loadExposureData(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING EXPOSURE INTELLIGENCE...</span>
          <p className="state-message">Analyzing deterministic public exposure observations.</p>
        </div>
      ) : signals.length === 0 ? (
        <EmptyState
          title="NO EXPOSURE SIGNALS OBSERVED"
          message="The passive assessment returned no deterministic exposure signals for the selected target scope."
          actionText={isCollectionRunning ? 'COLLECTING INTELLIGENCE...' : 'RUN PASSIVE ASSESSMENT'}
          onAction={isCollectionRunning ? undefined : handleRunAssessment}
        />
      ) : (
        <>
          {/* Toolbar */}
          <ExposureToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            totalCount={signals.length}
            filteredCount={filteredSignals.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
          />

          {/* Table or Filtered Empty State */}
          {filteredSignals.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING SIGNALS</span>
              <p className="state-message">
                No observed exposure signals match the current search query "{searchQuery}" and type filter.
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
            <ExposureTable
              signals={filteredSignals}
              assetMap={assetMap}
              selectedSignal={selectedSignal}
              onSelectSignal={(sig) => setSelectedSignal(sig)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Investigation Detail Drawer */}
      <ExposureDetailDrawer
        signal={selectedSignal}
        affectedAsset={selectedSignal?.asset_id ? assetMap.get(selectedSignal.asset_id) : undefined}
        onClose={() => setSelectedSignal(null)}
      />
    </PageContainer>
  );
};
