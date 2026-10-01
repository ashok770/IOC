import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/shell/Sidebar';
import { Topbar } from '../components/shell/Topbar';
import { CreateAssessmentModal } from '../components/targets/CreateAssessmentModal';
import { TargetProvider } from '../context/TargetContext';

export const AppShellContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Primary Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="app-main-wrapper">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="app-content">
          <Outlet />
        </div>
      </div>

      {/* New Assessment Modal Dialog */}
      <CreateAssessmentModal />
    </div>
  );
};

export const AppShell: React.FC = () => {
  return (
    <TargetProvider>
      <AppShellContent />
    </TargetProvider>
  );
};
