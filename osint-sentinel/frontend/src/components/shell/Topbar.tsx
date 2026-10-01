import React, { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import { HealthResponse } from '../../types';
import { TargetSelector } from './TargetSelector';
import { useTarget } from '../../context/TargetContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { openCreateModal } = useTarget();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const data = await healthApi.getHealth();
        if (isMounted) {
          setHealth(data);
          setIsHealthLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealth(null);
          setIsHealthLoading(false);
        }
      }
    }

    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const getStatusDotClass = () => {
    if (isHealthLoading) return 'health-dot--degraded';
    if (!health) return 'health-dot--offline';
    if (health.database?.connected) return 'health-dot--ok';
    return 'health-dot--degraded';
  };

  const getStatusLabel = () => {
    if (isHealthLoading) return 'PROBING API...';
    if (!health) return 'BACKEND OFFLINE';
    if (health.database?.connected) return 'API ONLINE • DB CONNECTED';
    return 'API ONLINE • DB DEGRADED';
  };

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
          className="btn-primary"
          style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
          onClick={openCreateModal}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          + New Assessment
        </button>

        {/* Real Backend / Database Health Status */}
        <div
          className="health-status-indicator"
          title={health ? `Connected to ${health.project} (${health.environment})` : 'Backend service unreachable'}
        >
          <span className={`health-dot ${getStatusDotClass()}`} aria-hidden="true" />
          <span>{getStatusLabel()}</span>
        </div>
      </div>
    </header>
  );
};
