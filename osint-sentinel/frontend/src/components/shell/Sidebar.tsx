import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTarget } from '../../context/TargetContext';
import { targetApi } from '../../api';
import { AnalysisSummary } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { selectedTarget } = useTarget();
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);

  useEffect(() => {
    if (selectedTarget) {
      targetApi.getAnalysisSummary(selectedTarget.id).then(setSummary).catch(() => {});
    } else {
      setSummary(null);
    }
  }, [selectedTarget]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-header">
          <NavLink to="/overview" className="sidebar-brand" onClick={onClose}>
            <div className="brand-icon">
              {/* Vector Shield Mark */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">OSINT Sentinel</span>
              <span className="brand-tag">Defensive Posture</span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {/* Section: Overview */}
          <div className="nav-section">
            <span className="nav-section-title">Overview</span>
            <NavLink
              to="/overview"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Overview</span>
            </NavLink>
          </div>

          {/* Section: Assessment */}
          <div className="nav-section">
            <span className="nav-section-title">Assessment</span>
            
            <NavLink
              to="/assets"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ flexGrow: 1 }}>Assets</span>
              {summary && <span className="nav-badge" style={{ marginLeft: 'auto', background: summary.assets > 0 ? 'var(--color-bg-surface)' : 'transparent', color: summary.assets > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontVariantNumeric: 'tabular-nums', border: summary.assets > 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border-subtle)' }}>{summary.assets}</span>}
            </NavLink>

            <NavLink
              to="/exposure"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ flexGrow: 1 }}>Exposure</span>
              {summary && <span className="nav-badge" style={{ marginLeft: 'auto', background: summary.exposure_signals > 0 ? 'var(--color-bg-surface)' : 'transparent', color: summary.exposure_signals > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontVariantNumeric: 'tabular-nums', border: summary.exposure_signals > 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border-subtle)' }}>{summary.exposure_signals}</span>}
            </NavLink>

            <NavLink
              to="/technologies"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span style={{ flexGrow: 1 }}>Technologies</span>
              {summary && <span className="nav-badge" style={{ marginLeft: 'auto', background: summary.technologies > 0 ? 'var(--color-bg-surface)' : 'transparent', color: summary.technologies > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontVariantNumeric: 'tabular-nums', border: summary.technologies > 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border-subtle)' }}>{summary.technologies}</span>}
            </NavLink>

            <NavLink
              to="/evidence"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span style={{ flexGrow: 1 }}>Evidence</span>
              {summary && <span className="nav-badge" style={{ marginLeft: 'auto', background: summary.evidence_items > 0 ? 'var(--color-bg-surface)' : 'transparent', color: summary.evidence_items > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontVariantNumeric: 'tabular-nums', border: summary.evidence_items > 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border-subtle)' }}>{summary.evidence_items}</span>}
            </NavLink>

            <NavLink
              to="/relationships"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span style={{ flexGrow: 1 }}>Relationships</span>
              {summary && <span className="nav-badge" style={{ marginLeft: 'auto', background: summary.relationships > 0 ? 'var(--color-bg-surface)' : 'transparent', color: summary.relationships > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontVariantNumeric: 'tabular-nums', border: summary.relationships > 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border-subtle)' }}>{summary.relationships}</span>}
            </NavLink>

            <NavLink
              to="/risk-assessment"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Risk Assessment</span>
            </NavLink>
          </div>

          {/* Section: Output */}
          <div className="nav-section">
            <span className="nav-section-title">Output</span>
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Reports</span>
            </NavLink>
          </div>

          {/* Section: System */}
          <div className="nav-section">
            <span className="nav-section-title">System</span>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Operational Scope Guardrail Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div className="tooltip-container" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="status-dot online"></span>
              <span className="tooltip-text" style={{ bottom: '100%', left: '0' }}>API Online / DB Connected</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Passive Only</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>v0.1.0</span>
        </div>
      </aside>
    </>
  );
};
