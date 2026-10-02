import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { relationshipApi, assetApi, technologyApi } from '../api';
import { Relationship, Asset, Technology } from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  RelationshipToolbar,
  RelationshipTable,
  RelationshipDetailDrawer,
  RelationshipSortField,
  RelationshipSortOrder,
  resolveEntityLabel,
  getRelationshipScope,
} from '../components/relationships';

export const RelationshipsPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
    isCollectionRunning,
  } = useTarget();

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, Asset>>(new Map());
  const [techMap, setTechMap] = useState<Map<string, Technology>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [sortField, setSortField] = useState<RelationshipSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<RelationshipSortOrder>('desc');

  // Selected relationship for detail drawer
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);

  // Load relationships, assets, and technologies for active target
  const loadRelationshipData = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [relRes, assetsRes, techRes] = await Promise.all([
        relationshipApi.listTargetRelationships(targetId, { limit: 250 }),
        assetApi.listTargetAssets(targetId, { limit: 250 }).catch(() => ({ items: [] })),
        technologyApi.listTargetTechnologies(targetId, { limit: 250 }).catch(() => ({ items: [] })),
      ]);

      setRelationships(relRes.items || []);

      // Build maps for fast label resolution
      const aMap = new Map<string, Asset>();
      (assetsRes.items || []).forEach((a) => aMap.set(a.id, a));
      setAssetMap(aMap);

      const tMap = new Map<string, Technology>();
      (techRes.items || []).forEach((t) => tMap.set(t.id, t));
      setTechMap(tMap);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The external asset relationship inventory could not be retrieved from the assessment API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all state immediately to prevent cross-target leakage
  useEffect(() => {
    setRelationships([]);
    setAssetMap(new Map());
    setTechMap(new Map());
    setSelectedRel(null);
    setSearchQuery('');
    setSelectedType('all');
    setSelectedScope('all');
    setError(null);

    if (selectedTarget?.id) {
      loadRelationshipData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadRelationshipData]);

  // Handle re-running passive assessment from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadRelationshipData(selectedTarget.id);
    }
  };

  // Sorting handler
  const handleSort = (field: RelationshipSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'confidence' || field === 'created_at' ? 'desc' : 'asc');
    }
  };

  // Derive available relationship types from loaded relationships
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    relationships.forEach((r) => {
      if (r.relationship_type) types.add(r.relationship_type);
    });
    return Array.from(types).sort();
  }, [relationships]);

  // Filtered & sorted relationships
  const filteredRelationships = useMemo(() => {
    let result = [...relationships];

    // Filter by relationship type
    if (selectedType !== 'all') {
      result = result.filter(
        (r) => r.relationship_type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by scope classification
    if (selectedScope !== 'all') {
      result = result.filter((r) => {
        const scope = getRelationshipScope(r);
        return scope.variant === selectedScope;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const targetDomain = selectedTarget ? selectedTarget.primary_domain : '';

      result = result.filter((r) => {
        const typeMatch = r.relationship_type.toLowerCase().includes(query);
        const idMatch = r.id.toLowerCase().includes(query);
        const evMatch = Boolean(r.evidence_id && r.evidence_id.toLowerCase().includes(query));

        const sourceInfo = resolveEntityLabel(
          r.source_type,
          r.source_id,
          targetDomain,
          assetMap,
          techMap,
          r.extra_data
        );
        const sourceMatch =
          sourceInfo.name.toLowerCase().includes(query) ||
          sourceInfo.type.toLowerCase().includes(query);

        const targetInfo = resolveEntityLabel(
          r.target_type,
          r.target_id_reference,
          targetDomain,
          assetMap,
          techMap,
          r.extra_data
        );
        const targetMatch =
          targetInfo.name.toLowerCase().includes(query) ||
          targetInfo.type.toLowerCase().includes(query);

        // Search inside extra_data attributes
        const extra = (r.extra_data || {}) as Record<string, unknown>;
        const extraMatch = Object.values(extra).some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(query)
        );

        return typeMatch || idMatch || evMatch || sourceMatch || targetMatch || extraMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'relationship_type') {
        cmp = a.relationship_type.localeCompare(b.relationship_type);
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
  }, [relationships, assetMap, techMap, selectedTarget, selectedType, selectedScope, searchQuery, sortField, sortOrder]);

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
          message="Select or create an assessment target to view external asset relationships."
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
        title="External Asset Relationships"
        subtitle="Observed relationships connecting assets, evidence, technologies, and external references."
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
          title="RELATIONSHIP INTELLIGENCE UNAVAILABLE"
          message={error}
          onRetry={() => loadRelationshipData(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING RELATIONSHIP INTELLIGENCE...</span>
          <p className="state-message">
            Retrieving observed directed relationship edges from assessment scope.
          </p>
        </div>
      ) : relationships.length === 0 ? (
        <EmptyState
          title="NO OBSERVED RELATIONSHIPS"
          message="No observed relationships are currently available for the selected target scope."
          actionText={isCollectionRunning ? 'COLLECTING INTELLIGENCE...' : 'RUN PASSIVE ASSESSMENT'}
          onAction={isCollectionRunning ? undefined : handleRunAssessment}
        />
      ) : (
        <>
          {/* Toolbar */}
          <RelationshipToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            availableTypes={availableTypes}
            selectedScope={selectedScope}
            onScopeChange={setSelectedScope}
            totalCount={relationships.length}
            filteredCount={filteredRelationships.length}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedScope('all');
            }}
          />

          {/* Table or Filtered Empty State */}
          {filteredRelationships.length === 0 ? (
            <div className="state-box" style={{ minHeight: 200 }}>
              <span className="state-title">NO MATCHING RELATIONSHIPS</span>
              <p className="state-message">
                No observed relationships match the current search query "{searchQuery}" and active filters.
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
            <RelationshipTable
              relationships={filteredRelationships}
              targetDomain={selectedTarget.primary_domain}
              assetMap={assetMap}
              techMap={techMap}
              selectedRel={selectedRel}
              onSelectRel={(rel) => setSelectedRel(rel)}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </>
      )}

      {/* Relationship Detail Drawer */}
      <RelationshipDetailDrawer
        rel={selectedRel}
        targetDomain={selectedTarget.primary_domain}
        assetMap={assetMap}
        techMap={techMap}
        onClose={() => setSelectedRel(null)}
      />
    </PageContainer>
  );
};
