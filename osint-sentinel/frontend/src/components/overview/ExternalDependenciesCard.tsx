import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Relationship } from '../../types';
import { apiClient } from '../../api/client';

interface ExternalDependenciesCardProps {
  targetId: string;
  relationships: Relationship[];
}

interface ExternalDependencyItem {
  target_id: string;
  referenced_entity: string;
  provider_name: string;
  dependency_type: string;
  source: string;
  relationship_type: string;
  evidence_id?: string | null;
  confidence: number;
  is_external: boolean;
}

interface ExternalDependencyResult {
  target_domain: string;
  dependencies: ExternalDependencyItem[];
  total_dependencies: number;
  external_count: number;
  provider_summary: Record<string, number>;
}

export const ExternalDependenciesCard: React.FC<ExternalDependenciesCardProps> = ({
  targetId,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<ExternalDependencyResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchDependencies = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<ExternalDependencyResult>(`/v1/targets/${targetId}/dependencies`);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDependencies();
    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const filteredDependencies = (data?.dependencies || []).filter(item => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'DNS') return ['DNS_CNAME', 'DNS_NAMESERVER'].includes(item.dependency_type);
    if (activeFilter === 'EMAIL') return ['EMAIL_MX', 'EMAIL_SPF_INCLUDE', 'EMAIL_PROVIDER'].includes(item.dependency_type);
    if (activeFilter === 'CDN') return ['CDN', 'CLOUD', 'SAAS'].includes(item.dependency_type);
    if (activeFilter === 'CERT') return item.dependency_type === 'CERTIFICATE_EXTERNAL_REFERENCE';
    return true;
  });

  const getDepTypeBadge = (depType: string) => {
    switch (depType) {
      case 'EMAIL_SPF_INCLUDE':
        return <span className="status-badge status-badge-info">SPF Include</span>;
      case 'EMAIL_MX':
        return <span className="status-badge status-badge-info">Mail MX</span>;
      case 'DNS_CNAME':
        return <span className="status-badge status-badge-neutral">CNAME Alias</span>;
      case 'DNS_NAMESERVER':
        return <span className="status-badge status-badge-neutral">Nameserver</span>;
      case 'CDN':
        return <span className="status-badge status-badge-success">CDN Edge</span>;
      case 'CLOUD':
        return <span className="status-badge status-badge-success">Cloud Host</span>;
      case 'CERTIFICATE_EXTERNAL_REFERENCE':
        return <span className="status-badge status-badge-warning">CT SAN Reference</span>;
      default:
        return <span className="status-badge status-badge-neutral">{depType}</span>;
    }
  };

  return (
    <div className="discovery-section" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)' }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <h3 className="discovery-title" style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>External Dependency Intelligence</h3>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['ALL', 'DNS', 'EMAIL', 'CDN', 'CERT'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                background: activeFilter === cat ? 'var(--color-brand-primary)' : 'var(--color-bg-base)',
                color: activeFilter === cat ? '#fff' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat === 'CERT' ? 'Certificate' : cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>Cataloging third-party infrastructure references...</div>
      ) : data && data.total_dependencies > 0 ? (
        <div>
          {/* Summary Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Dependencies</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{data.total_dependencies}</div>
            </div>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Providers</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                {Object.keys(data.provider_summary || {}).filter(p => p !== 'Unknown').length}
              </div>
            </div>
          </div>

          {/* Dependency List Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDependencies.slice(0, 6).map((item, idx) => (
              <div key={idx} style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0, flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.referenced_entity}
                    </span>
                    {getDepTypeBadge(item.dependency_type)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    <strong style={{ color: 'var(--color-text-muted)' }}>Provider:</strong> {item.provider_name} | <strong style={{ color: 'var(--color-text-muted)' }}>Source:</strong> {item.source}
                  </div>
                </div>

                {item.evidence_id && (
                  <button
                    className="btn-link"
                    onClick={() => navigate('/evidence')}
                    style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                  >
                    Evidence
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>
          No external infrastructure dependencies observed from collected telemetry.
        </div>
      )}
    </div>
  );
};
