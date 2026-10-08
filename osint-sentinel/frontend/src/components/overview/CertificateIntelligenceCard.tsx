import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal, Relationship } from '../../types';
import { evidenceApi } from '../../api';

interface CertificateIntelligenceCardProps {
  targetId: string;
  exposureSignals: ExposureSignal[];
  relationships: Relationship[];
}

interface ParsedCertItem {
  id?: string | number;
  issuer_name?: string;
  common_name?: string;
  sans: string[];
  not_before?: string;
  not_after?: string;
  lifecycle_status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
  days_until_expiration?: number;
  evidenceId?: string;
}

interface CertSummary {
  totalObserved: number;
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  certificates: ParsedCertItem[];
  primaryEvidenceId: string | null;
}

export const CertificateIntelligenceCard: React.FC<CertificateIntelligenceCardProps> = ({
  targetId,
  exposureSignals: _exposureSignals,
  relationships: _relationships,
}) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CertSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadCtEvidence = async () => {
      setIsLoading(true);
      try {
        const res = await evidenceApi.listEvidence(targetId, { limit: 100 });
        const items = res.items || [];
        const ctItems = items.filter(i =>
          ['certificate_log_sample', 'certificate_transparency', 'certificate_entry', 'certificate_hostnames'].includes(i.evidence_type)
        );

        const certs: ParsedCertItem[] = [];
        let firstEvId: string | null = null;
        const now = new Date();

        for (const item of ctItems) {
          if (!firstEvId) {
            firstEvId = item.id;
          }
          const data = item.data || {};
          const sampleEntries = (data.sample_entries || data.certificates || []) as any[];

          for (const entry of sampleEntries) {
            if (typeof entry === 'object' && entry !== null) {
              const cn = entry.common_name || entry.cn;
              const issuer = entry.issuer_name || entry.issuer;
              const nbStr = entry.not_before;
              const naStr = entry.not_after;

              let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN' = 'UNKNOWN';
              let daysUntilExp: number | undefined = undefined;

              if (naStr) {
                const naDate = new Date(naStr);
                if (!isNaN(naDate.getTime())) {
                  const diffMs = naDate.getTime() - now.getTime();
                  daysUntilExp = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                  if (naDate < now) {
                    status = 'EXPIRED';
                  } else if (daysUntilExp <= 30) {
                    status = 'EXPIRING_SOON';
                  } else {
                    status = 'ACTIVE';
                  }
                }
              }

              // Extract SANs
              const sans: string[] = [];
              const rawNameVal = entry.name_value || entry.dns_names || entry.sans;
              if (typeof rawNameVal === 'string') {
                rawNameVal.split('\n').forEach(s => {
                  const clean = s.trim().toLowerCase().replace(/^\*\./, '');
                  if (clean && !sans.includes(clean)) sans.push(clean);
                });
              } else if (Array.isArray(rawNameVal)) {
                rawNameVal.forEach(s => {
                  if (typeof s === 'string') {
                    const clean = s.trim().toLowerCase().replace(/^\*\./, '');
                    if (clean && !sans.includes(clean)) sans.push(clean);
                  }
                });
              }

              if (cn && !sans.includes(cn.trim().toLowerCase().replace(/^\*\./, ''))) {
                sans.unshift(cn.trim().toLowerCase().replace(/^\*\./, ''));
              }

              certs.push({
                id: entry.id,
                issuer_name: issuer,
                common_name: cn,
                sans,
                not_before: nbStr,
                not_after: naStr,
                lifecycle_status: status,
                days_until_expiration: daysUntilExp,
                evidenceId: item.id,
              });
            }
          }
        }

        const activeCount = certs.filter(c => c.lifecycle_status === 'ACTIVE').length;
        const expiringSoonCount = certs.filter(c => c.lifecycle_status === 'EXPIRING_SOON').length;
        const expiredCount = certs.filter(c => c.lifecycle_status === 'EXPIRED').length;

        if (isMounted) {
          setSummary({
            totalObserved: certs.length,
            activeCount,
            expiringSoonCount,
            expiredCount,
            certificates: certs,
            primaryEvidenceId: firstEvId,
          });
        }
      } catch (e) {
        if (isMounted) {
          setSummary(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCtEvidence();
    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const getStatusBadge = (status: ParsedCertItem['lifecycle_status'], days?: number) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-badge status-badge-success">Active</span>;
      case 'EXPIRING_SOON':
        return <span className="status-badge status-badge-warning">Expiring Soon ({days !== undefined ? `${days}d` : '<30d'})</span>;
      case 'EXPIRED':
        return <span className="status-badge status-badge-critical">Expired</span>;
      default:
        return <span className="status-badge status-badge-neutral">Unknown</span>;
    }
  };

  return (
    <div className="discovery-section" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3 className="discovery-title" style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Certificate Transparency Intelligence</h3>
        </div>
        {summary?.primaryEvidenceId && (
          <button
            className="btn-link"
            onClick={() => navigate('/evidence')}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Supporting CT Evidence
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>Analyzing Certificate Transparency records...</div>
      ) : summary && summary.totalObserved > 0 ? (
        <div>
          {/* Summary Metric Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Observed</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{summary.totalObserved}</div>
            </div>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)' }}>{summary.activeCount}</div>
            </div>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Expiring Soon</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: summary.expiringSoonCount > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                {summary.expiringSoonCount}
              </div>
            </div>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Expired</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: summary.expiredCount > 0 ? 'var(--color-critical)' : 'var(--color-text-primary)' }}>
                {summary.expiredCount}
              </div>
            </div>
          </div>

          {/* Certificate Entries Table / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.certificates.slice(0, 5).map((cert, idx) => (
              <div key={idx} style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0, flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cert.common_name || 'Unspecified Certificate'}
                    </span>
                    {getStatusBadge(cert.lifecycle_status, cert.days_until_expiration)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <strong style={{ color: 'var(--color-text-muted)' }}>Issuer:</strong> {cert.issuer_name || 'Unknown Issuer'}
                  </div>
                </div>
                {cert.not_after && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Expires</span>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                      {cert.not_after.split('T')[0]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>
          No certificate lifecycle metadata available from collected CT evidence.
        </div>
      )}
    </div>
  );
};
