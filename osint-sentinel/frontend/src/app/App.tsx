import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { AuthProvider, useAuth } from '../context/AuthContext';
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
  AssetInvestigationPage,
  AssessmentHistoryPage,
  DesignSystemPage,
  MarketingHomePage,
} from '../pages';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, login } = useAuth();
  
  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading...</div>;
  }
  
  if (!user) {
    login();
    return null;
  }
  
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Commercial Marketing Website */}
          <Route path="/" element={<MarketingHomePage />} />

          {/* Design System Specifications */}
          <Route path="/design-system" element={<DesignSystemPage />} />

          {/* Authenticated Application Platform Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/assets">
              <Route index element={<AssetsPage />} />
              <Route path=":assetId" element={<AssetInvestigationPage />} />
            </Route>
            <Route path="/exposure" element={<ExposurePage />} />
            <Route path="/technologies" element={<TechnologiesPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/relationships" element={<RelationshipsPage />} />
            <Route path="/risk-assessment" element={<RiskAssessmentPage />} />
            <Route path="/risk" element={<Navigate to="/risk-assessment" replace />} />
            <Route path="/history" element={<AssessmentHistoryPage />} />
            <Route path="/assessments" element={<Navigate to="/history" replace />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Catch-all route redirects to /overview for authenticated app */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

