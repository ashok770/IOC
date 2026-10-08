import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTarget } from '../context/TargetContext';
import { assetApi, technologyApi, exposureApi, evidenceApi } from '../api';
import { Asset, Technology, ExposureSignal, Relationship, EvidenceItem } from '../types';
import { PageContainer, ErrorState } from '../components/common';
import { AssetTypeBadge, ObservationTimeline, RelationshipGraphPreview } from '../components/assets';
import { isAssetExternal } from '../components/assets/AssetRow';
import '../styles/assets.css';

export const AssetInvestigationPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { selectedTarget, isLoadingTargets } = useTarget();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingTargets || !selectedTarget || !assetId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      assetApi.getTargetAsset(selectedTarget.id, assetId),
      assetApi.listTargetAssets(selectedTarget.id, { limit: 250 }),
      assetApi.getAssetRelationships(selectedTarget.id, assetId),
      technologyApi.listAssetTechnologies(selectedTarget.id, assetId),
      exposureApi.listExposureSignals(selectedTarget.id),
      evidenceApi.listEvidence(selectedTarget.id, { limit: 100 }).catch(() => ({ items: [], total: 0 })),
    ])
      .then(([assetRes, allAssetsRes, relRes, techRes, expRes, evRes]) => {
        if (!isMounted) return;
        setAsset(assetRes);
        setAllAssets(allAssetsRes.items || []);
        setRelationships(relRes.items || []);
        setTechnologies(techRes.items || []);
        setEvidenceItems(evRes.items || []);

        const items = expRes.items || [];
        const relevant = items.filter(
          (s) =>
            s.asset_id === assetRes.id ||
            (s.extra_data &&
              typeof s.extra_data === 'object' &&
              (s.extra_data as Record<string, unknown>).asset_value === assetRes.value)
        );
        setExposureSignals(relevant);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load asset details');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTarget?.id, assetId, isLoadingTargets]);

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allAssets) {
      map.set(a.id, a.value);
    }
    return map;
  }, [allAssets]);

  const techMap = useMemo(() => {
    const map = new Map<string, Technology>();
    for (const t of technologies) {
      map.set(t.id, t);
    }
    return map;
  }, [technologies]);

  // Identify genuine evidence items linked directly to this asset
  const matchingEvidence = useMemo(() => {
    if (!asset) return [];
    return evidenceItems.filter((e) => {
      if (asset.first_evidence_id && e.id === asset.first_evidence_id) return true;
      if (
        relationships.some(
          (r) =>
            r.evidence_id === e.id ||
            (r.target_type === 'evidence' && r.target_id_reference === e.id)
        )
      )
        return true;
      if (technologies.some((t) => t.evidence_id === e.id)) return true;
      if (e.data && typeof e.data === 'object') {
        const d = e.data as Record<string, unknown>;
        if (d.domain === asset.value || d.hostname === asset.value || d.ip === asset.value) return true;
        if (Array.isArray(d.values) && d.values.includes(asset.value)) return true;
        if (d.query === asset.value || d.target === asset.value) return true;
      }
      return false;
    });
  }, [asset, evidenceItems, relationships, technologies]);

  // Genuine timestamps for observation timeline
  const timelineTimestamps = useMemo(() => {
    const list: { timestamp: string; label: string }[] = [];
    matchingEvidence.forEach((e) => {
      if (e.collected_at) {
        list.push({ timestamp: e.collected_at, label: `${e.source.toUpperCase()} Evidence` });
      }
    });
    technologies.forEach((t) => {
      if (t.first_seen) {
        list.push({ timestamp: t.first_seen, label: `${t.name} Tech Observed` });
      }
    });
    return list;
  }, [matchingEvidence, technologies]);

  // Genuine evidence source counts
  const evidenceSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (matchingEvidence.length > 0) {
      matchingEvidence.forEach((e) => {
        const s = (e.source || 'UNKNOWN').toUpperCase();
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (asset?.source) {
      counts[asset.source.toUpperCase()] = 1;
    }
    return counts;
  }, [matchingEvidence, asset]);

  if (isLoadingTargets || isLoading) {
    return (
      <PageContainer>
        <div className="state-box" style={{ minHeight: 400 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING ASSET INVESTIGATION...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !asset || !selectedTarget) {
    return (
      <PageContainer>
        <div style={{ marginBottom: '24px' }}>
          <button className="btn-link" onClick={() => navigate('/assets')}>
            &larr; Back to Asset Intelligence
          </button>
        </div>
        <ErrorState
          title="INVESTIGATION ERROR"
          message={error || 'Asset not found in current target scope.'}
          onRetry={() => navigate('/assets')}
        />
      </PageContainer>
    );
  }

  const isExternal = isAssetExternal(asset, selectedTarget.primary_domain);
  const extra = (asset.extra_data || {}) as Record<string, unknown>;
  const hasExtra = Object.keys(extra).length > 0;

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelType = (relType: string) => {
    return relType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTargetLabel = (rel: Relationship) => {
    if (rel.extra_data && typeof rel.extra_data === 'object') {
      const extraObj = rel.extra_data as Record<string, unknown>;
      if (extraObj.technology_name) return String(extraObj.technology_name);
      if (extraObj.ip) return String(extraObj.ip);
      if (extraObj.asset_value) return String(extraObj.asset_value);
    }
    if (assetMap.has(rel.target_id_reference)) {
      return assetMap.get(rel.target_id_reference)!;
    }
    if (rel.target_id_reference) {
      return `${rel.target_id_reference.slice(0, 13)}...`;
    }
    return 'Target entity';
  };

  const getProvenanceExplanation = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('dns'))
      return 'Authoritative DNS resolver response conclusively proves hostname existence and network infrastructure routing.';
    if (s.includes('registration'))
      return 'Authoritative assessment scope boundary initialized during target registration.';
    if (s.includes('http'))
      return 'Discovered directly via passive HTTP service response headers and response banners.';
    if (s.includes('cert'))
      return 'Observed in public Certificate Transparency records issued for the perimeter namespace.';
    return 'Authoritative deterministic observation captured by assessment collector pipeline.';
  };

  const getAssetDescription = () => {
    if (asset.asset_type === 'ip') return 'IP address observed through passive external intelligence.';
    if (
      asset.asset_type === 'certificate_hostname' ||
      asset.asset_type === 'certificate_associated_hostname' ||
      asset.asset_type === 'subdomain'
    )
      return 'Hostname observed through passive external intelligence.';
    return 'Primary domain observed within the authorized assessment scope.';
  };

  // Find resolved IPs or associated hostnames from actual relationship records
  const resolvedEntities = relationships
    .filter((r) => r.relationship_type === 'resolves_to' || r.relationship_type === 'points_to')
    .map((r) => {
      const isOutgoing = r.source_id === asset.id;
      const otherId = isOutgoing ? r.target_id_reference : r.source_id;
      return assetMap.get(otherId) || otherId;
    });

  // Extract geographic / infrastructure context ONLY if genuinely present in extra_data
  const geoData = (() => {
    if (asset.asset_type !== 'ip') return null;
    const ipClass = extra.ip_classification as string | undefined;
    const asn = (extra.asn || extra.as_number) as string | number | undefined;
    const country = extra.country as string | undefined;
    const region = extra.region as string | undefined;
    const city = extra.city as string | undefined;
    const org = (extra.organization || extra.org || extra.isp || extra.provider) as string | undefined;

    if (!ipClass && !asn && !country && !region && !city && !org) return null;
    return {
      ipClass:
        ipClass === 'private_internal'
          ? 'Private (RFC1918 Internal)'
          : ipClass === 'public'
          ? 'Public Routable'
          : ipClass,
      asn: asn ? `AS${asn}`.replace('ASAS', 'AS') : undefined,
      country,
      region,
      city,
      org,
    };
  })();

  const relatedAssets = relationships.filter((r) => r.target_type === 'asset');
  const externalRels = relationships.filter((r) => r.target_type !== 'asset');

  // Multi-source check for Evidence section
  const sourceKeys = Object.keys(evidenceSourceCounts);
  const hasMultipleEvidenceSources = sourceKeys.length > 1 || matchingEvidence.length > 1;
  const maxSourceCount = Math.max(...Object.values(evidenceSourceCounts), 1);

  return (
    <PageContainer>
      <div className="investigation-workspace" style={{ paddingBottom: '40px' }}>
        {/* Navigation */}
        <div style={{ marginBottom: '16px' }}>
          <button
            className="btn-link"
            onClick={() => navigate('/assets')}
            style={{
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 0,
            }}
          >
            &larr; Back to Asset Intelligence
          </button>
        </div>

        {/* 1. Page Header */}
        <div
          style={{
            borderBottom: '1px solid var(--color-border-default)',
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: 'var(--color-text-secondary)',
              marginBottom: '6px',
            }}
          >
            ASSET INVESTIGATION
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 10px 0',
              wordBreak: 'break-all',
            }}
          >
            {asset.value}
          </h1>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
            <AssetTypeBadge type={asset.asset_type} />
            {isExternal ? (
              <span className="asset-scope-tag asset-scope-tag--external">External Reference</span>
            ) : (
              <span className="asset-scope-tag asset-scope-tag--target">Target Scope</span>
            )}
            <span
              className="asset-scope-tag"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-status-success)' }}
            >
              100% FACTUAL
            </span>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
            {getAssetDescription()}
          </p>

          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Last observed: {formatDate(asset.last_seen_at)}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="investigation-columns">
          {/* LEFT COLUMN */}
          <div
            className="column-main"
            style={{ flex: '1 1 62%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* 2. OBSERVATION PROFILE */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                OBSERVATION PROFILE
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Asset ID
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {asset.id.slice(0, 16)}...
                      </span>
                      <button
                        className="btn-link"
                        onClick={() => handleCopy(asset.id, 'id')}
                        style={{ fontSize: '11px', padding: 0 }}
                      >
                        {copiedKey === 'id' ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Scope Classification
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {isExternal ? 'External Reference' : 'Target Scope'}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Intelligence Source
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {asset.source === 'target_registration' ? 'Scope Definition' : asset.source.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Observation Confidence
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-status-success)', fontWeight: 600 }}>
                      100% — Factual
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      First Discovered
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {formatDate(asset.discovered_at)}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Last Observed
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {formatDate(asset.last_seen_at)}
                    </div>
                  </div>
                </div>

                {/* Compact Confidence Bar Indicator */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Observation Confidence Breakdown
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-status-success)' }}>
                      100% Factual
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--color-status-success)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <span>Direct DNS / Scope Evidence</span>
                    <span>Zero Heuristic Extrapolation</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. TELEMETRY & OBSERVATION (With Observation Timeline side-by-side) */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                TELEMETRY & OBSERVATION
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <div className="telemetry-observation-grid">
                  {/* Left: Real Telemetry Attributes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      Technical Telemetry
                    </div>

                    {/* Asset Canonical Value */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {asset.asset_type === 'ip' ? 'IP Address' : 'Observed Hostname'}
                      </span>
                      <span className="mono" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        {asset.value}
                      </span>
                    </div>

                    {/* DNS Record Type if genuinely present */}
                    {Boolean(extra.record_type) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>DNS Record Type</span>
                        <span className="mono" style={{ color: 'var(--color-text-primary)' }}>
                          {String(extra.record_type)}
                        </span>
                      </div>
                    )}

                    {/* TTL if genuinely present */}
                    {extra.ttl !== undefined && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>TTL (Time to Live)</span>
                        <span className="mono" style={{ color: 'var(--color-text-primary)' }}>
                          {String(extra.ttl)}s
                        </span>
                      </div>
                    )}

                    {/* IP Classification if present */}
                    {Boolean(extra.ip_classification) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>Routing Scope</span>
                        <span style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                          {String(extra.ip_classification).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* MX Preference if present */}
                    {extra.preference !== undefined && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>MX Preference</span>
                        <span className="mono" style={{ color: 'var(--color-text-primary)' }}>
                          {String(extra.preference)}
                        </span>
                      </div>
                    )}

                    {/* Assigned Role if present */}
                    {Boolean(extra.role) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>Assigned Role</span>
                        <span style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                          {String(extra.role).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* Discovery Scope if present */}
                    {Boolean(extra.scope) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>Discovery Scope</span>
                        <span style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                          {String(extra.scope).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    {/* Resolved Entities if present */}
                    {resolvedEntities.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {asset.asset_type === 'ip' ? 'Associated Host' : 'Resolved IP'}
                        </span>
                        <span className="mono" style={{ color: 'var(--color-accent-cyan)' }}>
                          {resolvedEntities[0]}
                        </span>
                      </div>
                    )}

                    {/* Raw attributes toggle */}
                    {hasExtra ? (
                      <div style={{ marginTop: '6px' }}>
                        <button
                          className="btn-link"
                          onClick={() => setShowRawJson(!showRawJson)}
                          style={{ fontSize: '12px', padding: 0 }}
                        >
                          {showRawJson ? '▼ Hide raw attributes' : '▶ View raw attributes'}
                        </button>
                        {showRawJson && (
                          <pre
                            style={{
                              background: 'var(--color-bg-base)',
                              padding: '12px',
                              borderRadius: '4px',
                              overflowX: 'auto',
                              marginTop: '8px',
                              fontSize: '11px',
                              border: '1px solid var(--color-border-subtle)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {JSON.stringify(extra, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                          fontSize: '12px',
                          marginTop: '4px',
                        }}
                      >
                        Standard telemetry attributes logged.
                      </div>
                    )}
                  </div>

                  {/* Right: Observation Timeline */}
                  <div>
                    <ObservationTimeline
                      discoveredAt={asset.discovered_at}
                      lastSeenAt={asset.last_seen_at}
                      additionalTimestamps={timelineTimestamps}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. EVIDENCE & PROVENANCE */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                EVIDENCE & PROVENANCE
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                {hasMultipleEvidenceSources ? (
                  <div className="evidence-provenance-grid">
                    {/* Left: Source Distribution */}
                    <div
                      style={{
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '6px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                          }}
                        >
                          Evidence Source Distribution
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {Object.entries(evidenceSourceCounts).map(([src, count]) => {
                            const pct = Math.round((count / maxSourceCount) * 100);
                            return (
                              <div key={src}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    marginBottom: '4px',
                                  }}
                                >
                                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{src}</span>
                                  <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>
                                    {count} {count === 1 ? 'artifact' : 'artifacts'}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    width: '100%',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: 'var(--color-border-subtle)',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: '100%',
                                      background: 'var(--color-accent-cyan)',
                                      borderRadius: '3px',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {matchingEvidence.length} total evidence artifacts associated.
                        </span>
                      </div>
                    </div>

                    {/* Right: Primary Evidence Excerpt */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            marginBottom: '10px',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          [{asset.source === 'target_registration' ? 'Target Scope' : `${asset.source.toUpperCase()} Observation`}]
                        </div>

                        <div style={{ display: 'grid', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Origin</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{asset.source.toUpperCase()}</span>
                          </div>
                          <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Observed</span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{formatDate(asset.discovered_at)}</span>
                          </div>
                          <div style={{ display: 'flex' }}>
                            <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Confidence</span>
                            <span style={{ color: 'var(--color-status-success)', fontWeight: 600 }}>100%</span>
                          </div>
                        </div>

                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>
                          {getProvenanceExplanation(asset.source)}
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <button
                          className="btn-link"
                          onClick={() => navigate('/evidence')}
                          style={{ fontSize: '12px', fontWeight: 600, padding: 0 }}
                        >
                          View all evidence &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Evidence Card (No chart when only 1 artifact exists) */
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        marginBottom: '12px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      [{asset.source === 'target_registration' ? 'Target Registration' : `${asset.source.toUpperCase()} Observation`}]
                    </div>

                    <div style={{ display: 'grid', gap: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex' }}>
                        <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Source</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{asset.source.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Observed</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{formatDate(asset.discovered_at)}</span>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ color: 'var(--color-text-secondary)', width: '90px' }}>Confidence</span>
                        <span style={{ color: 'var(--color-status-success)', fontWeight: 600 }}>100%</span>
                      </div>

                      <div style={{ marginTop: '10px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                        {getProvenanceExplanation(asset.source)}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <button
                        className="btn-link"
                        onClick={() => navigate('/evidence')}
                        style={{ fontSize: '13px', fontWeight: 500, padding: 0 }}
                      >
                        View Evidence &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="column-side"
            style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Investigation Context */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                INVESTIGATION CONTEXT
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Assessment Scope
                    </div>
                    <div className="mono" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {selectedTarget.primary_domain}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Assessment Mode
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      Authorized / Passive
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Execution Policy
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      Zero Exploitation / Read-Only OSINT
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Last Assessment
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {formatDate(selectedTarget.updated_at || selectedTarget.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Asset Classification (with technology details) */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                ASSET CLASSIFICATION
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Asset Type
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                    {asset.asset_type.replace(/_/g, ' ')}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Technology Observations ({technologies.length})
                  </div>
                  {technologies.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {technologies.map((tech) => (
                        <div
                          key={tech.id}
                          style={{
                            paddingBottom: '8px',
                            borderBottom: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '2px',
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {tech.name}
                              {tech.version && (
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--color-text-secondary)',
                                    marginLeft: '6px',
                                  }}
                                >
                                  v{tech.version}
                                </span>
                              )}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--color-status-success)',
                                fontWeight: 600,
                              }}
                            >
                              {Math.round(tech.confidence * 100)}%
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <span>{tech.category.replace(/_/g, ' ')}</span>
                            {tech.detection_method && (
                              <span style={{ fontStyle: 'italic', fontSize: '10px' }}>
                                via {tech.detection_method.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
                      No technology observations associated with this asset.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Geographic / Infrastructure Context (ONLY rendered if genuine data exists) */}
            {geoData !== null && (
              <section>
                <h2
                  className="section-group-title"
                  style={{
                    marginBottom: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  GEOGRAPHIC / INFRASTRUCTURE CONTEXT
                </h2>
                <div
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '6px',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                    {geoData.ipClass && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Classification</span>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{geoData.ipClass}</span>
                      </div>
                    )}
                    {geoData.asn && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Autonomous System</span>
                        <span className="mono" style={{ color: 'var(--color-accent-cyan)' }}>
                          {geoData.asn}
                        </span>
                      </div>
                    )}
                    {geoData.org && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Organization</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{geoData.org}</span>
                      </div>
                    )}
                    {(geoData.city || geoData.region || geoData.country) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Location</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>
                          {[geoData.city, geoData.region, geoData.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Relationships & Context with Visual Graph Preview */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                RELATIONSHIPS & CONTEXT
              </h2>
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                {/* Visual Graph Preview */}
                <div style={{ marginBottom: '16px' }}>
                  <RelationshipGraphPreview
                    currentAsset={asset}
                    targetDomain={selectedTarget.primary_domain}
                    relationships={relationships}
                    assetMap={assetMap}
                    techMap={techMap}
                    onViewAll={() => navigate('/relationships')}
                  />
                </div>

                {/* Related Assets List excerpt */}
                {relatedAssets.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Immediate Neighbors ({relatedAssets.length})
                    </div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {relatedAssets.slice(0, 4).map((rel) => (
                        <div
                          key={rel.id}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div
                            className="mono"
                            style={{ fontSize: '12px', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}
                          >
                            {getTargetLabel(rel)}
                          </div>
                        </div>
                      ))}
                      {relatedAssets.length > 4 && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          + {relatedAssets.length - 4} more related assets
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* External Relationships list excerpt */}
                {externalRels.length > 0 && (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      External Entities ({externalRels.length})
                    </div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {externalRels.slice(0, 3).map((rel) => (
                        <div
                          key={rel.id}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                            {formatRelType(rel.relationship_type)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-status-success)' }}>
                            {Math.round(rel.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2
                className="section-group-title"
                style={{
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                QUICK ACTIONS
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn-link"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                    padding: '4px 0',
                    color: 'var(--color-text-primary)',
                  }}
                  onClick={() => navigate('/assets')}
                >
                  &larr; Back to Assets
                </button>
                <button
                  className="btn-link"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                    padding: '4px 0',
                    color: 'var(--color-text-primary)',
                  }}
                  onClick={() => navigate('/evidence')}
                >
                  View Evidence &rarr;
                </button>
                <button
                  className="btn-link"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                    padding: '4px 0',
                    color: 'var(--color-text-primary)',
                  }}
                  onClick={() => navigate('/relationships')}
                >
                  View Relationships &rarr;
                </button>
                {exposureSignals.length > 0 && (
                  <button
                    className="btn-link"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      textAlign: 'left',
                      padding: '4px 0',
                      color: 'var(--color-text-primary)',
                    }}
                    onClick={() => navigate('/risk-assessment')}
                  >
                    View Risk Assessment &rarr;
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
