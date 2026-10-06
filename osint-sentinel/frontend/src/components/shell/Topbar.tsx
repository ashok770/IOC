import React from 'react';
import { TargetSelector } from './TargetSelector';
import { useTarget } from '../../context/TargetContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { openCreateModal } = useTarget();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Real Dynamic Target Selector */}
        <TargetSelector />
      </div>

      <div className="topbar-right">
        {/* Quick New Assessment Action */}
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={openCreateModal}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New assessment
        </button>
      </div>
    </header>
  );
};
