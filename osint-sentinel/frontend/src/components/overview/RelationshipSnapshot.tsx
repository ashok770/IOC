import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Relationship, Asset, Technology } from '../../types';

interface RelationshipSnapshotProps {
  relationships: Relationship[];
  assets: Asset[];
  technologies: Technology[];
}

export const RelationshipSnapshot: React.FC<RelationshipSnapshotProps> = ({ relationships }) => {
  const navigate = useNavigate();
  return (
    <div className="discovery-section" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="discovery-title" style={{ margin: 0, textTransform: 'none' }}>Relationships graph</h3>
      </div>
      <div className="discovery-stat-large">{relationships.length} <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>relationships</span></div>
      
      <div className="mini-graph-wrapper" style={{ flexGrow: 1, position: 'relative' }}>
        <svg viewBox="0 0 200 120" className="mini-graph-svg" aria-label="Relationships mini graph">
          {/* Target Center */}
          <line x1="100" y1="60" x2="40" y2="30" stroke="var(--color-border-subtle)" strokeWidth="2" />
          <line x1="100" y1="60" x2="160" y2="30" stroke="var(--color-border-subtle)" strokeWidth="2" />
          <line x1="100" y1="60" x2="160" y2="90" stroke="var(--color-border-subtle)" strokeWidth="2" />
          <line x1="100" y1="60" x2="40" y2="90" stroke="var(--color-border-subtle)" strokeWidth="2" />

          <circle cx="100" cy="60" r="14" fill="var(--color-bg-base)" stroke="var(--color-border-strong)" strokeWidth="2">
            <title>Target Apex Entity</title>
          </circle>
          <circle cx="100" cy="60" r="6" fill="var(--color-text-primary)" />
          
          <circle cx="40" cy="30" r="8" fill="var(--color-status-success)">
            <title>Domain Asset</title>
          </circle>
          <circle cx="160" cy="30" r="8" fill="var(--color-accent-cyan)">
            <title>IP Asset</title>
          </circle>
          <circle cx="160" cy="90" r="8" fill="var(--color-status-warning)">
            <title>Subdomain Asset</title>
          </circle>
          <circle cx="40" cy="90" r="8" fill="var(--color-text-muted)">
            <title>Technology</title>
          </circle>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px', fontSize: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-text-primary)' }}/> Target</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-status-success)' }}/> Domain</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-accent-cyan)' }}/> IP</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-text-muted)' }}/> Tech</span>
        </div>
        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-secondary)', background: 'linear-gradient(to top, var(--color-bg-base) 0%, transparent 100%)', paddingTop: '16px' }}>
          Preview: 4 of {relationships.length} nodes
        </div>
      </div>
      
      <div className="discovery-action" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button className="btn-link" onClick={() => navigate('/relationships')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }} aria-label="Open full relationship graph">
          Open graph
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};
