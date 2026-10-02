import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { evidenceApi, assetApi } from '../api';
import { EvidenceItem, Asset } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  EvidenceToolbar,
  EvidenceTable,
  EvidenceDetailDrawer,
  EvidenceSortField,
  EvidenceSortOrder,
} from '../components/evidence';

export const EvidencePage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
    isCollectionRunning,
  } = useTarget();

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [assetValueMap, setAssetValueMap] = useState<Map<string, Asset>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortField, setSortField] = useState<EvidenceSortField>('collected_at');
  const [sortOrder, setSortOrder] = useState<EvidenceSortOrder>('desc');

  // Selected evidence for detail drawer
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Load evidence items and assets for active target
  const loadEvidenceData = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [evidenceRes, assetsRes] = await Promise.all([
        evidenceApi.listEvidence(targetId, { limit: 250 }),
        assetApi.listTargetAssets(targetId, { limit: 250 }).catch(() => ({ items: [] })),
      ]);

      setEvidenceItems(evidenceRes.items || []);

      // Build map for fast asset resolution by value
      const byVal = new Map<string, Asset>();
      (assetsRes.items || []).forEach((a) => {
        byVal.set(a.value.toLowerCase(), a);
      });
      setAssetValueMap(byVal);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The evidence observation inventory could not be retrieved from the assessment API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all state immediately to prevent cross-target leakage
  useEffect(() => {
    setEvidenceItems([]);
    setAssetValueMap(new Map());
    setSelectedEvidence(null);
    setSearchQuery('');
    setSelectedType('all');
    setSelectedSource('all');
    setError(null);

    if (selectedTarget?.id) {
      loadEvidenceData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadEvidenceData]);

  // Handle re-running passive assessment from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadEvidenceData(selectedTarget.id);
    }
  };

  // Sorting handler
  const handleSort = (field: EvidenceSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'confidence' || field === 'collected_at' ? 'desc' : 'asc');
    }
  };

  // Derive available types and sources from loaded evidence
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    evidenceItems.forEach((item) => {
      if (item.evidence_type) types.add(item.evidence_type);
    });
    return Array.from(types).sort();
  }, [evidenceItems]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    evidenceItems.forEach((item) => {
      if (item.source) sources.add(item.source);
    });
    return Array.from(sources).sort();
  }, [evidenceItems]);

  // Filtered & sorted evidence observations
  const filteredEvidence = useMemo(() => {
    let result = [...evidenceItems];

    // Filter by evidence type
    if (selectedType !== 'all') {
      result = result.filter(
        (i) => i.evidence_type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by collector source
    if (selectedSource !== 'all') {
      result = result.filter(
        (i) => i.source.toLowerCase() === selectedSource.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const typeMatch = item.evidence_type.toLowerCase().includes(query);
        const sourceMatch = item.source.toLowerCase().includes(query);
        const idMatch = item.id.toLowerCase().includes(query);
        const urlMatch = Boolean(item.source_url && item.source_url.toLowerCase().includes(query));
        const notesMatch = Boolean(item.notes && item.notes.toLowerCase().includes(query));

        // Search in data keys & values
        const data = (item.data || {}) as Record<string, unknown>;
        const domainMatch = typeof data.domain === 'string' && data.domain.toLowerCase().includes(query);
        const addressMatch = typeof data.address === 'string' && data.address.toLowerCase().includes(query);
        const exchangeMatch = typeof data.exchange === 'string' && data.exchange.toLowerCase().includes(query);
        const recordTypeMatch = typeof data.record_type === 'string' && data.record_type.toLowerCase().includes(query);
        const nameserverMatch = typeof data.nameserver === 'string' && data.nameserver.toLowerCase().includes(query);
        const registrarMatch = typeof data.registrar === 'string' && data.registrar.toLowerCase().includes(query);
        const probedUrlMatch = typeof data.probed_url === 'string' && data.probed_url.toLowerCase().includes(query);

        const headers = (data.headers || {}) as Record<string, string>;
        const serverMatch = typeof headers.server === 'string' && headers.server.toLowerCase().includes(query);

        return (
          typeMatch ||
          sourceMatch ||
          idMatch ||
          urlMatch ||
          notesMatch ||
          domainMatch ||
          addressMatch ||
          exchangeMatch ||
          recordTypeMatch ||
          nameserverMatch ||
          registrarMatch ||
          probedUrlMatch ||
          serverMatch
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'evidence_type') {
        cmp = a.evidence_type.localeCompare(b.evidence_type);
      } else if (sortField === 'source') {
        cmp = a.source.localeCompare(b.source);
      } else if (sortField === 'confidence') {
        cmp = (a.confidence || 0) - (b.confidence || 0);
      } else if (sortField === 'collected_at') {
        const dateA = new Date(a.collected_at || 0).getTime();
        const dateB = new Date(b.collected_at || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [evidenceItems, selectedType, selectedSource, searchQuery, sortField, sortOrder]);

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
          message="Select or create an assessment target to view evidence intelligence."
          actionText="+ CREATE ASSESSMENT"
          onAction={openCreateModal}
        />
      </PageContainer>
    );
  }

  // Resolve associated asset for selected evidence
  const selectedAssociatedAsset = selectedEvidence
    ? (() => {
        const data = (selectedEvidence.data || {}) as Record<string, unknown>;
        const dom = (data.domain as string) || '';
        const addr = (data.address as string) || '';
        return (
          assetValueMap.get(dom.toLowerCase()) ||
          assetValueMap.get(addr.toLowerCase()) ||
          assetValueMap.get(selectedTarget.primary_domain.toLowerCase())
        );
      })()
    : undefined;

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Evidence & Provenance"
        subtitle="Source-backed observations collected during the authorized passive assessment."
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
          title="EVIDENCE INTELLIGENCE UNAVAILABLE"
          message={error}
          onRetry={() => loadEvidenceData(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING EVIDENCE INTELLIGENCE...</span>
          <p className="state-message">
            Retrieving source-backed evidence records from assessment scope.
          </p>
        </div>
      ) : evidenceItems.length === 0 ? (
        <EmptyState
          title="NO EVIDENCE OBSERVATIONS"
          message="No source-backed evidence is currently available for the selected target scope."
          actionText={isCollectionRunning ? 'COLLECTING INTELLIGENCE...' : 'RUN PASSIVE ASSESSMENT'}
          onAction={isCollectionRunning ? undefined : handleRunAssessment}
        />
      ) : (
        <>
          {/* Toolbar */}
          <EvidenceToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            availableTypes={availableTypes}
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
            availableSources={availableSources}
            totalCount={evidenceItems.length}
            filteredCount={filteredEvidence.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedSource('all');
            }}
          />

          {/* Table or Filtered Empty State */}
          {filteredEvidence.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING EVIDENCE</span>
              <p className="state-message">
                No evidence items match the current search query "{searchQuery}" and active filters.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedSource('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <EvidenceTable
              items={filteredEvidence}
              selectedItem={selectedEvidence}
              onSelectItem={(item) => setSelectedEvidence(item)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Evidence Detail Drawer */}
      <EvidenceDetailDrawer
        item={selectedEvidence}
        targetDomain={selectedTarget.primary_domain}
        associatedAsset={selectedAssociatedAsset}
        onClose={() => setSelectedEvidence(null)}
      />
    </PageContainer>
  );
};
