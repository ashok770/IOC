import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/shell/Sidebar';
import { Topbar } from '../components/shell/Topbar';
import { targetApi } from '../api';
import { Target } from '../types';

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<Target | null>(null);

  // Retrieve initial target context from the real backend
  useEffect(() => {
    let isMounted = true;
    async function loadActiveTarget() {
      try {
        const response = await targetApi.listTargets(0, 1);
        if (isMounted && response.items && response.items.length > 0) {
          setActiveTarget(response.items[0]);
        }
      } catch {
        // Backend offline or no targets registered; retain null state honestly
      }
    }
    loadActiveTarget();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Primary Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="app-main-wrapper">
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTarget={activeTarget}
        />
        <div className="app-content">
          <Outlet context={{ activeTarget }} />
        </div>
      </div>
    </div>
  );
};
