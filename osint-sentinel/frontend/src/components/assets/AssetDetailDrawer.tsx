import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset, Relationship, Technology, ExposureSignal } from '../../types';
import { AssetTypeBadge } from './AssetTypeBadge';
import { isAssetExternal } from './AssetRow';
import { assetApi, technologyApi, exposureApi } from '../../api';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  primaryDomain?: string;
  allAssets?: Asset[];
  onClose: () => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  primaryDomain,
  allAssets = [],
  onClose,
}) => {
  const navigate = useNavigate();

  // Child intelligence telemetry states
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoadingRel, setIsLoadingRel] = useState<boolean>(false);

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [isLoadingTech, setIsLoadingTech] = useState<boolean>(false);

  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [isLoadingExp, setIsLoadingExp] = useState<boolean>(false);

  // Progressive disclosure & interaction states
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset states & fetch real telemetry when selected asset changes
  useEffect(() => {
    if (!asset) {
      setRelationships([]);
      setTechnologies([]);
      setExposureSignals([]);
      setShowRawJson(false);
      setCopiedKey(null);
      return;
    }

    let isMounted = true;
    setShowRawJson(false);
    setCopiedKey(null);

    // 1. Fetch relationships involving this asset
    setIsLoadingRel(true);
    assetApi
      .getAssetRelationships(asset.target_id, asset.id)
      .then((res) => {
        if (isMounted) {
          setRelationships(res.items || []);
          setIsLoadingRel(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRelationships([]);
          setIsLoadingRel(false);
        }
      });

    // 2. Fetch technologies observed on this asset
    setIsLoadingTech(true);
    technologyApi
      .listAssetTechnologies(asset.target_id, asset.id)
      .then((res) => {
        if (isMounted) {
          setTechnologies(res.items || []);
          setIsLoadingTech(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTechnologies([]);
          setIsLoadingTech(false);
        }
      });

    // 3. Fetch exposure signals scoped to target and filter by this asset
    setIsLoadingExp(true);
    exposureApi
      .listExposureSignals(asset.target_id)
      .then((res) => {
        if (isMounted) {
          const items = res.items || [];
          const relevant = items.filter(
            (s) =>
              s.asset_id === asset.id ||
              (s.extra_data &&
                typeof s.extra_data === 'object' &&
                (s.extra_data as Record<string, unknown>).asset_value === asset.value)
          );
          setExposureSignals(relevant);
          setIsLoadingExp(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setExposureSignals([]);
          setIsLoadingExp(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [asset?.id, asset?.target_id, asset?.value]);

  // Asset lookup map for human-readable relationship targets
  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allAssets) {
      map.set(a.id, a.value);
    }
    return map;
  }, [allAssets]);

  if (!asset) return null;

  const isExternal = isAssetExternal(asset, primaryDomain);
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
    switch (relType) {
      case 'references':
        return 'References';
      case 'resolves_to':
        return 'Resolves To';
      case 'technology_observed_on':
        return 'Technology Observed On';
      case 'contains':
        return 'Contains';
      case 'supported_by':
        return 'Supported By';
      case 'certificate_associated_with':
        return 'Certificate Associated With';
      case 'externally_referenced':
        return 'Externally Referenced';
      default:
        return relType.replace(/_/g, ' ');
    }
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
    if (s.includes('dns')) {
      return 'Authoritative DNS resolver response conclusively proves hostname existence and network infrastructure routing.';
    }
    if (s.includes('registration')) {
      return 'Authoritative assessment scope boundary initialized during target registration.';
    }
    if (s.includes('http')) {
      return 'Discovered directly via passive HTTP service response headers and response banners.';
    }
    if (s.includes('cert')) {
      return 'Observed in public Certificate Transparency records issued for the perimeter namespace.';
    }
    return 'Authoritative deterministic observation captured by assessment collector pipeline.';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="asset-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="asset-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Asset details for ${asset.value}`}
      >
        {/* Sticky Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span className="drawer-header-title">Asset Detail</span>
            <span className="drawer-header-sub">Investigation Workspace</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close asset details"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* 4.1 ASSET IDENTITY */}
          <div className="drawer-identity-section">
            <div className="drawer-identity-meta">
              <span className="drawer-meta-kicker">Asset Value</span>
              <button
                type="button"
                className="drawer-copy-btn"
                onClick={() => handleCopy(asset.value, 'value')}
                title="Copy asset value to clipboard"
              >
                {copiedKey === 'value' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <h2 className="drawer-asset-value">{asset.value}</h2>
            <div className="drawer-identity-tags">
              <AssetTypeBadge type={asset.asset_type} />
              {asset.asset_type === 'ip' && asset.extra_data?.ip_classification && asset.extra_data.ip_classification !== 'public' ? (
                <span className="asset-scope-tag asset-scope-tag--private" title="Private/internal address observed in passive intelligence.">
                  <span className="scope-dot" aria-hidden="true" />
                  PRIVATE / INTERNAL
                </span>
              ) : isExternal ? (
                <span className="asset-scope-tag asset-scope-tag--external">
                  <span className="scope-dot" aria-hidden="true" />
                  External Reference
                </span>
              ) : (
                <span className="asset-scope-tag asset-scope-tag--target">
                  <span className="scope-dot" aria-hidden="true" />
                  Target Scope
                </span>
              )}
            </div>
          </div>

          {/* 4.2 OBSERVATION SUMMARY */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title">Observation Summary</h3>
            </div>
            <div className="drawer-props-grid">
              <div className="drawer-prop-item">
                <span className="drawer-prop-label">Asset ID</span>
                <div className="drawer-prop-val-row">
                  <span className="drawer-prop-val-mono" title={asset.id}>
                    {asset.id.slice(0, 16)}...
                  </span>
                  <button
                    type="button"
                    className="drawer-copy-mini-btn"
                    onClick={() => handleCopy(asset.id, 'id')}
                    title="Copy full Asset ID"
                  >
                    {copiedKey === 'id' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="drawer-prop-item">
                <span className="drawer-prop-label">Scope Classification</span>
                <span className="drawer-prop-val">
                  {isExternal ? 'External Reference' : 'Target Scope'}
                </span>
              </div>

              <div className="drawer-prop-item">
                <span className="drawer-prop-label">Intelligence Source</span>
                <span className="drawer-prop-val">
                  {asset.source === 'target_registration' ? 'Scope Definition' : asset.source.toUpperCase()}
                </span>
              </div>

              <div className="drawer-prop-item">
                <span className="drawer-prop-label">Observation Confidence</span>
                <span className="drawer-prop-val drawer-prop-val--highlight">
                  100% — Factual
                </span>
              </div>

              <div className="drawer-prop-item">
                <span className="drawer-prop-label">First Discovered</span>
                <span className="drawer-prop-val">{formatDate(asset.discovered_at)}</span>
              </div>

              <div className="drawer-prop-item">
                <span className="drawer-prop-label">Last Observed</span>
                <span className="drawer-prop-val">{formatDate(asset.last_seen_at)}</span>
              </div>
            </div>
          </div>

          {/* 4.3 TELEMETRY / OBSERVATION */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title">Telemetry & Observation</h3>
            </div>

            {hasExtra ? (
              <div className="drawer-telemetry-block">
                <div className="drawer-telemetry-grid">
                  {Boolean(extra.record_type) && (
                    <div className="drawer-telemetry-row">
                      <span className="telemetry-label">DNS Record Type:</span>
                      <span className="telemetry-val-badge">{String(extra.record_type)}</span>
                    </div>
                  )}
                  {extra.ttl !== undefined && (
                    <div className="drawer-telemetry-row">
                      <span className="telemetry-label">TTL (Time to Live):</span>
                      <span className="telemetry-val">{String(extra.ttl)}s</span>
                    </div>
                  )}
                  {extra.preference !== undefined && (
                    <div className="drawer-telemetry-row">
                      <span className="telemetry-label">MX Preference:</span>
                      <span className="telemetry-val">{String(extra.preference)}</span>
                    </div>
                  )}
                  {Boolean(extra.role) && (
                    <div className="drawer-telemetry-row">
                      <span className="telemetry-label">Assigned Role:</span>
                      <span className="telemetry-val">{String(extra.role).replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {Boolean(extra.scope) && (
                    <div className="drawer-telemetry-row">
                      <span className="telemetry-label">Discovery Scope:</span>
                      <span className="telemetry-val">{String(extra.scope).replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Collapsed by default Raw Attributes */}
                <div className="drawer-raw-toggle-wrap">
                  <button
                    type="button"
                    className="drawer-raw-toggle-btn"
                    onClick={() => setShowRawJson(!showRawJson)}
                    aria-expanded={showRawJson}
                  >
                    <span>{showRawJson ? '▼ Hide Raw Attributes' : '▶ View Raw Attributes'}</span>
                  </button>
                  {showRawJson && (
                    <pre className="drawer-raw-json" role="region" aria-label="Raw attribute JSON">
                      {JSON.stringify(extra, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="drawer-quiet-state">
                <span>No additional telemetry attributes logged for this asset record.</span>
              </div>
            )}
          </div>

          {/* 4.4 EVIDENCE PROVENANCE */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title">Evidence Provenance</h3>
            </div>

            <div className="drawer-provenance-box">
              <div className="provenance-header">
                <span className="provenance-source-label">
                  {asset.source === 'target_registration' ? 'Target Registration' : `${asset.source.toUpperCase()} Observation`}
                </span>
                {asset.first_evidence_id && (
                  <span className="provenance-evidence-id">
                    ID: {asset.first_evidence_id.slice(0, 8)}...
                  </span>
                )}
              </div>

              <p className="provenance-explanation">
                {getProvenanceExplanation(asset.source)}
              </p>

              {asset.first_evidence_id ? (
                <div className="provenance-footer">
                  <span className="provenance-meta-text">
                    Supported by primary evidence artifact {asset.first_evidence_id.slice(0, 13)}...
                  </span>
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => {
                      onClose();
                      navigate('/evidence');
                    }}
                  >
                    View Supporting Evidence →
                  </button>
                </div>
              ) : (
                <div className="provenance-footer">
                  <span className="provenance-meta-text">
                    Root perimeter scope anchor validated upon assessment initialization.
                  </span>
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => {
                      onClose();
                      navigate('/evidence');
                    }}
                  >
                    View Target Evidence →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4.5 RELATIONSHIP INTELLIGENCE */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <div className="drawer-section-title-wrap">
                <h3 className="drawer-section-title">External Asset Relationships</h3>
                <span className="drawer-count-badge">
                  {isLoadingRel ? '...' : relationships.length}
                </span>
              </div>
            </div>

            {isLoadingRel ? (
              <div className="drawer-loading-inline">
                <div className="state-spinner-mini" />
                <span>Loading observed relationships...</span>
              </div>
            ) : relationships.length > 0 ? (
              <div className="drawer-relationships-list">
                {relationships.slice(0, 6).map((rel) => (
                  <div key={rel.id} className="drawer-rel-item">
                    <div className="drawer-rel-lead">
                      <span className="drawer-rel-type">{formatRelType(rel.relationship_type)}</span>
                      <span className="drawer-rel-arrow">→</span>
                      <span className="drawer-rel-target" title={rel.target_id_reference}>
                        {getTargetLabel(rel)}
                      </span>
                    </div>
                    <div className="drawer-rel-meta">
                      <span className="drawer-rel-target-type">{rel.target_type}</span>
                      <span className="drawer-rel-conf">
                        {Math.round(rel.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}

                {relationships.length > 6 && (
                  <div className="drawer-more-note">
                    + {relationships.length - 6} additional observed relationships
                  </div>
                )}

                <div className="drawer-action-row">
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => {
                      onClose();
                      navigate('/relationships');
                    }}
                  >
                    Explore in Relationship Graph →
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-quiet-state">
                <span>0 observed relationships involving this asset.</span>
              </div>
            )}
          </div>

          {/* 4.6 TECHNOLOGY INTELLIGENCE */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <div className="drawer-section-title-wrap">
                <h3 className="drawer-section-title">Technology Observations</h3>
                <span className="drawer-count-badge">
                  {isLoadingTech ? '...' : technologies.length}
                </span>
              </div>
            </div>

            {isLoadingTech ? (
              <div className="drawer-loading-inline">
                <div className="state-spinner-mini" />
                <span>Querying observed technologies...</span>
              </div>
            ) : technologies.length > 0 ? (
              <div className="drawer-tech-list">
                {technologies.map((tech) => (
                  <div key={tech.id} className="drawer-tech-item">
                    <div className="drawer-tech-header">
                      <span className="drawer-tech-name">{tech.name}</span>
                      <span className="drawer-tech-category">{tech.category}</span>
                    </div>
                    <div className="drawer-tech-details">
                      <span className="drawer-tech-method">
                        Method: {tech.detection_method.replace(/_/g, ' ')}
                      </span>
                      <span className="drawer-tech-confidence">
                        {Math.round(tech.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}

                <div className="drawer-action-row">
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => {
                      onClose();
                      navigate('/technologies');
                    }}
                  >
                    View in Technology Intelligence →
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-quiet-state">
                <span>0 technology observations associated with this asset.</span>
              </div>
            )}
          </div>

          {/* 4.7 EXPOSURE INTELLIGENCE */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <div className="drawer-section-title-wrap">
                <h3 className="drawer-section-title">Exposure Intelligence</h3>
                <span className="drawer-count-badge">
                  {isLoadingExp ? '...' : exposureSignals.length}
                </span>
              </div>
            </div>

            {isLoadingExp ? (
              <div className="drawer-loading-inline">
                <div className="state-spinner-mini" />
                <span>Checking exposure signals...</span>
              </div>
            ) : exposureSignals.length > 0 ? (
              <div className="drawer-exposure-list">
                {exposureSignals.map((signal) => (
                  <div key={signal.id} className="drawer-exposure-item">
                    <div className="drawer-exposure-header">
                      <span className="drawer-exposure-title">{signal.title}</span>
                      <span className={`drawer-severity-badge severity-${signal.severity.toLowerCase()}`}>
                        {signal.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="drawer-exposure-desc">{signal.description}</p>
                    <div className="drawer-exposure-meta">
                      <span className="drawer-signal-category">{signal.category}</span>
                      <span className="drawer-signal-conf">
                        {Math.round(signal.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}

                <div className="drawer-action-row">
                  <button
                    type="button"
                    className="drawer-action-btn"
                    onClick={() => {
                      onClose();
                      navigate('/exposure');
                    }}
                  >
                    View in Exposure Intelligence →
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-quiet-state drawer-quiet-state--exposure">
                <span className="quiet-primary">No prioritized exposure signals associated with this asset.</span>
                <span className="quiet-disclaimer">
                  Absence of a signal indicates no exposure conditions were detected during passive assessment.
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
