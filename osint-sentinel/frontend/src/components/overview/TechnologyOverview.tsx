import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Technology } from '../../types';

interface TechnologyOverviewProps {
  technologies: Technology[];
}

export const TechnologyOverview: React.FC<TechnologyOverviewProps> = ({ technologies }) => {
  const navigate = useNavigate();
  if (technologies.length === 0) {
    return (
      <div className="discovery-section">
        <h3 className="discovery-title">TECHNOLOGY INTELLIGENCE</h3>
        <p className="discovery-empty">No technology observations available.</p>
      </div>
    );
  }

  // Count technologies by category
  const techCounts: Record<string, number> = {};
  technologies.forEach(t => {
    techCounts[t.name] = (techCounts[t.name] || 0) + 1;
  });

  const techList = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="discovery-section" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 className="discovery-title" style={{ margin: 0, textTransform: 'none' }}>Technologies</h3>
      </div>
      <div className="discovery-stat-large">{technologies.length} <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>technologies</span></div>
      
      <div className="tech-visual-list" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {techList.slice(0, 5).map((tech, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-base)', padding: '6px 10px', borderRadius: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tech.name}</span>
            {tech.count > 1 && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{tech.count}</span>}
          </div>
        ))}
      </div>
      <div className="discovery-action" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button className="btn-link" onClick={() => navigate('/technologies')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }} aria-label="View all discovered technologies">
          View technologies
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};
