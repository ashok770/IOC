import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal, Technology, Relationship } from '../../types';
import { evidenceApi } from '../../api';

interface EmailSecurityCardProps {
  targetId: string;
  exposureSignals: ExposureSignal[];
  technologies: Technology[];
  relationships: Relationship[];
}

interface ParsedEmailPosture {
  spf: {
    present: boolean;
    qualifier: string | null;
    rawRecord: string | null;
    includes: string[];
  };
  dmarc: {
    present: boolean;
    policy: string | null;
    rawRecord: string | null;
    rua: string | null;
    ruf: string | null;
  };
  mx: {
    records: Array<{ preference?: number; exchange?: string }>;
    providers: string[];
  };
  evidenceId: string | null;
}

export const EmailSecurityCard: React.FC<EmailSecurityCardProps> = ({
  targetId,
  exposureSignals,
  technologies,
  relationships,
}) => {
  const navigate = useNavigate();
  const [posture, setPosture] = useState<ParsedEmailPosture | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadDnsEvidence = async () => {
      setIsLoading(true);
      try {
        const res = await evidenceApi.listEvidence(targetId, { evidence_type: 'dns' });
        const dnsItems = res.items || [];
        
        let foundSpf = false;
        let spfQualifier: string | null = null;
        let rawSpf: string | null = null;
        let spfIncludes: string[] = [];

        let foundDmarc = false;
        let dmarcPolicy: string | null = null;
        let rawDmarc: string | null = null;
        let dmarcRua: string | null = null;
        let dmarcRuf: string | null = null;

        const mxRecords: Array<{ preference?: number; exchange?: string }> = [];
        let primaryEvidenceId: string | null = null;

        for (const item of dnsItems) {
          if (!primaryEvidenceId) {
            primaryEvidenceId = item.id;
          }
          const data = item.data || {};
          const records = (data.records as Record<string, unknown>) || data;

          // Check TXT records
          const txtRecords = Array.isArray(records.TXT) ? records.TXT : [];
          for (const raw of txtRecords) {
            const txtStr = String(raw).trim();
            if (txtStr.startsWith('v=spf1')) {
              foundSpf = true;
              rawSpf = txtStr;
              const parts = txtStr.split(/\s+/);
              for (const part of parts) {
                if (['-all', '~all', '?all', '+all'].includes(part)) {
                  spfQualifier = part;
                }
                if (part.startsWith('include:')) {
                  spfIncludes.push(part.substring(8));
                }
              }
            }
            if (txtStr.startsWith('v=DMARC1') || item.data.subdomain_type === 'dmarc') {
              foundDmarc = true;
              rawDmarc = txtStr;
              const parts = txtStr.split(';');
              for (const part of parts) {
                const trimmed = part.trim();
                if (trimmed.startsWith('p=')) {
                  dmarcPolicy = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('rua=')) {
                  dmarcRua = trimmed.substring(4).trim();
                } else if (trimmed.startsWith('ruf=')) {
                  dmarcRuf = trimmed.substring(4).trim();
                }
              }
            }
          }

          // Check MX records
          const mxList = Array.isArray(records.MX) ? records.MX : [];
          for (const mxItem of mxList) {
            if (typeof mxItem === 'object' && mxItem !== null) {
              mxRecords.push({
                preference: (mxItem as any).preference,
                exchange: (mxItem as any).exchange || (mxItem as any).host,
              });
            } else if (typeof mxItem === 'string') {
              mxRecords.push({ exchange: mxItem });
            }
          }
        }

        // Email providers from technologies or MX
        const emailTechs = technologies
          .filter(t => t.category === 'email' || t.category === 'email_provider')
          .map(t => t.name);

        // Additional SPF include domains from relationships
        const spfIncludeRels = relationships
          .filter(r => r.relationship_type === 'externally_referenced' || (r.extra_data && (r.extra_data as any).role === 'spf_include'))
          .map(r => r.target_id_reference);

        const mergedIncludes = Array.from(new Set([...spfIncludes, ...spfIncludeRels]));

        if (isMounted) {
          setPosture({
            spf: {
              present: foundSpf,
              qualifier: spfQualifier,
              rawRecord: rawSpf,
              includes: mergedIncludes,
            },
            dmarc: {
              present: foundDmarc,
              policy: dmarcPolicy,
              rawRecord: rawDmarc,
              rua: dmarcRua,
              ruf: dmarcRuf,
            },
            mx: {
              records: mxRecords,
              providers: Array.from(new Set(emailTechs)),
            },
            evidenceId: primaryEvidenceId,
          });
        }
      } catch (e) {
        if (isMounted) {
          setPosture(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDnsEvidence();
    return () => {
      isMounted = false;
    };
  }, [targetId, technologies, relationships]);

  // Relevant email exposure signals
  const emailSignals = exposureSignals.filter(s =>
    s.category === 'email_security' ||
    ['missing_spf', 'permissive_spf', 'softfail_spf', 'missing_dmarc', 'non_enforcing_dmarc'].includes(s.signal_type)
  );

  const getSpfBadge = (spf: ParsedEmailPosture['spf']) => {
    if (!spf.present) {
      return <span className="status-badge status-badge-critical">Missing</span>;
    }
    if (spf.qualifier === '-all') {
      return <span className="status-badge status-badge-success">Enforcing (-all)</span>;
    }
    if (spf.qualifier === '~all') {
      return <span className="status-badge status-badge-warning">Softfail (~all)</span>;
    }
    if (spf.qualifier === '+all') {
      return <span className="status-badge status-badge-critical">Permissive (+all)</span>;
    }
    return <span className="status-badge status-badge-neutral">Present ({spf.qualifier || 'Unknown'})</span>;
  };

  const getDmarcBadge = (dmarc: ParsedEmailPosture['dmarc']) => {
    if (!dmarc.present) {
      return <span className="status-badge status-badge-critical">Missing</span>;
    }
    if (dmarc.policy === 'reject') {
      return <span className="status-badge status-badge-success">Enforcing (reject)</span>;
    }
    if (dmarc.policy === 'quarantine') {
      return <span className="status-badge status-badge-warning">Quarantine</span>;
    }
    if (dmarc.policy === 'none') {
      return <span className="status-badge status-badge-warning">Non-enforcing (p=none)</span>;
    }
    return <span className="status-badge status-badge-neutral">Present ({dmarc.policy || 'Unknown'})</span>;
  };

  return (
    <div className="discovery-section" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)' }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <h3 className="discovery-title" style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Email Security Intelligence</h3>
        </div>
        {posture?.evidenceId && (
          <button
            className="btn-link"
            onClick={() => navigate('/evidence')}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Supporting Evidence
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>Analyzing email security records...</div>
      ) : posture ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* SPF Posture */}
          <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>SPF (Sender Policy Framework)</span>
              {getSpfBadge(posture.spf)}
            </div>
            {posture.spf.present ? (
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text-primary)' }}>Qualifier:</strong> {posture.spf.qualifier || 'None'}</div>
                {posture.spf.includes.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Includes ({posture.spf.includes.length}):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {posture.spf.includes.map((inc, i) => (
                        <span key={i} style={{ background: 'var(--color-bg-surface)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>No SPF record detected in public TXT records.</p>
            )}
          </div>

          {/* DMARC Posture */}
          <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>DMARC Posture</span>
              {getDmarcBadge(posture.dmarc)}
            </div>
            {posture.dmarc.present ? (
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text-primary)' }}>Policy (p=):</strong> {posture.dmarc.policy || 'none'}</div>
                <div>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Reporting:</strong>{' '}
                  {posture.dmarc.rua ? 'Configured (RUA)' : 'Not configured'}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>No DMARC record detected at _dmarc subdomain.</p>
            )}
          </div>

          {/* MX & Providers */}
          <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Mail Servers & Providers</span>
              <span className="status-badge status-badge-neutral">{posture.mx.records.length} MX</span>
            </div>
            {posture.mx.records.length > 0 || posture.mx.providers.length > 0 ? (
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-text-secondary)' }}>
                {posture.mx.providers.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Providers:</strong> {posture.mx.providers.join(', ')}
                  </div>
                )}
                {posture.mx.records.length > 0 && (
                  <div style={{ marginTop: '2px' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Exchanges:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      {posture.mx.records.slice(0, 3).map((mx, idx) => (
                        <span key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mx.preference !== undefined ? `[${mx.preference}] ` : ''}{mx.exchange}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>No MX records or mail providers identified.</p>
            )}
          </div>

          {/* Observed Signals */}
          <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Exposure Signals</span>
              <span className={`status-badge status-badge-${emailSignals.length > 0 ? 'warning' : 'success'}`}>
                {emailSignals.length} {emailSignals.length === 1 ? 'Signal' : 'Signals'}
              </span>
            </div>
            {emailSignals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {emailSignals.map((sig, idx) => (
                  <div key={idx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-warning)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{sig.title || sig.signal_type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>No active email security exposure signals.</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>No email security records available.</div>
      )}
    </div>
  );
};
