import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExposureSignal } from '../../types';

interface PriorityInvestigationProps {
  signals: ExposureSignal[];
}

export const PriorityInvestigation: React.FC<PriorityInvestigationProps> = ({ signals }) => {
  const navigate = useNavigate();

  const getLevelColor = (lvl: string) => {
    switch (lvl.toLowerCase()) {
      case 'info': return 'var(--color-status-info, #3b82f6)';
      case 'low': return 'var(--color-status-success, #22c55e)';
      case 'medium': return 'var(--color-status-warning, #eab308)';
      case 'high': return 'var(--color-status-high, #f97316)';
      case 'critical': return 'var(--color-status-critical, #ef4444)';
      default: return 'var(--color-border-strong, #cbd5e1)';
    }
  };

  if (signals.length === 0) {
    return (
      <div className="investigation-section">
        <h3 className="section-group-title">PRIORITY FINDINGS</h3>
        <p className="card-empty-text">No prioritized exposure signals identified.</p>
      </div>
    );
  }

  const sorted = [...signals].sort((a, b) => {
    const severities: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    const sevA = severities[a.severity.toLowerCase()] ?? 0;
    const sevB = severities[b.severity.toLowerCase()] ?? 0;
    return sevB - sevA;
  });
  
  const displaySignals = sorted.slice(0, 3);

  const allInfo = sorted.every(s => s.severity.toLowerCase() === 'info');

  return (
    <div className="investigation-section">
      <h3 className="section-group-title">PRIORITY FINDINGS</h3>
      {allInfo && <p className="card-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No elevated findings - informational items only.</p>}
      
      <div className="investigation-queue-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {displaySignals.map(sig => {
          const sevColor = getLevelColor(sig.severity);
          return (
            <div key={sig.id} className="priority-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ backgroundColor: sevColor, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{sig.severity.toUpperCase()}</span>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{sig.title}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', overflowWrap: 'anywhere' }}>{sig.description}</p>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ background: 'var(--color-bg-base)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Confidence: {Math.round(sig.confidence * 100)}%</span>
                <span style={{ background: 'var(--color-bg-base)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Evidence: {sig.evidence_id ? '1 artifact' : '0 artifacts'}</span>
                
                <button 
                  className="btn-link" 
                  style={{ marginLeft: 'auto', fontSize: '12px', padding: 0 }}
                  onClick={() => navigate('/exposure')}
                >
                  View details &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {signals.length > 3 && (
        <div className="queue-more">
          <button className="btn-link" onClick={() => navigate('/exposure')}>
            View all exposure signals &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
