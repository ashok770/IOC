import React, { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import { HealthResponse, Target } from '../../types';

interface TopbarProps {
  onToggleSidebar: () => void;
  activeTarget: Target | null;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, activeTarget }) => {
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
    // Re-check periodically every 30s
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

        {/* Current Assessment Target Context */}
        <div className="target-context-chip" title="Current Active Assessment Target">
          <span className="target-context-label">Target:</span>
          <span className="target-context-domain">
            {activeTarget ? activeTarget.primary_domain : 'No target selected'}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real Backend / Database Health Status */}
        <div className="health-status-indicator" title={health ? `Connected to ${health.project} (${health.environment})` : 'Backend service unreachable'}>
          <span className={`health-dot ${getStatusDotClass()}`} aria-hidden="true" />
          <span>{getStatusLabel()}</span>
        </div>
      </div>
    </header>
  );
};
