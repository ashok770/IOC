import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import {
  OverviewPage,
  AssetsPage,
  ExposurePage,
  TechnologiesPage,
  EvidencePage,
  RelationshipsPage,
  RiskAssessmentPage,
  ReportsPage,
  SettingsPage,
} from '../pages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          {/* Default entrypoint redirects to /overview */}
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="exposure" element={<ExposurePage />} />
          <Route path="technologies" element={<TechnologiesPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="relationships" element={<RelationshipsPage />} />
          <Route path="risk-assessment" element={<RiskAssessmentPage />} />
          <Route path="risk" element={<Navigate to="/risk-assessment" replace />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
