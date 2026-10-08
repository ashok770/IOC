import React, { useEffect, useState, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { useNavigate } from 'react-router-dom';
import {
  targetApi,
  riskApi,
  exposureApi,
  assetApi,
  technologyApi,
  relationshipApi,
} from '../api';
import {
  AnalysisSummary,
  RiskAssessment,
  ExposureSignal,
  Asset,
  Technology,
  Relationship,
} from '../types';
import { PageContainer, EmptyState, ErrorState } from '../components/common';
import {
  AssessmentHeader,
  AssessmentProgressModal,
  AssessmentSummary,
  ExposureDriversChart,
  AssetCompositionChart,
  TechnologyOverview,
  PriorityInvestigation,
  RelationshipSnapshot,
  RecentActivity,
  MethodologySummary,
  EmailSecurityCard,
  CertificateIntelligenceCard,
  ExternalDependenciesCard
} from '../components/overview';

export const OverviewPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    isCollectionRunning,
    collectionSummary,
    collectionError,
    triggerCollection,
  } = useTarget();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(false);

  const loadOverviewData = useCallback(async (targetId: string) => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [
        summaryRes,
        riskRes,
        signalsRes,
        assetsRes,
        techRes,
        relsRes,
      ] = await Promise.all([
        targetApi.getAnalysisSummary(targetId),
        riskApi.getTargetRisk(targetId),
        exposureApi.listExposureSignals(targetId),
        assetApi.listTargetAssets(targetId),
        technologyApi.listTargetTechnologies(targetId),
        relationshipApi.listTargetRelationships(targetId),
      ]);

      setSummary(summaryRes);
      setRisk(riskRes);
      setExposureSignals(signalsRes.items || []);
      setAssets(assetsRes.items || []);
      setTechnologies(techRes.items || []);
      setRelationships(relsRes.items || []);
    } catch (err) {
      setDataError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve assessment intelligence telemetry from backend.'
      );
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTarget?.id) {
      loadOverviewData(selectedTarget.id);
    } else {
      setSummary(null);
      setRisk(null);
      setExposureSignals([]);
      setAssets([]);
      setTechnologies([]);
      setRelationships([]);
    }
  }, [selectedTarget?.id, loadOverviewData]);

  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    setIsProgressModalOpen(true);
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadOverviewData(selectedTarget.id);
    }
  };

  if (isLoadingTargets && !selectedTarget) {
    return (
      <PageContainer>
        <div className="state-box">
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading assessment scope...</span>
        </div>
      </PageContainer>
    );
  }

  if (!selectedTarget) {
    return (
      <PageContainer>
        <EmptyState
          title="NO ASSESSMENT SELECTED"
          message="Create a new authorized domain assessment target or select an existing target from the top bar to begin external posture analysis."
          actionText="+ CREATE ASSESSMENT"
          onAction={openCreateModal}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AssessmentHeader
        target={selectedTarget}
        onRunAssessment={handleRunAssessment}
        isCollecting={isCollectionRunning}
      />

      <AssessmentProgressModal
        isOpen={isProgressModalOpen || isCollectionRunning}
        target={selectedTarget}
        isRunning={isCollectionRunning}
        error={collectionError}
        summary={collectionSummary}
        onClose={() => setIsProgressModalOpen(false)}
        onRetry={handleRunAssessment}
      />

      {isLoadingData ? (
        <div className="state-box">
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">Loading assessment telemetry...</span>
        </div>
      ) : dataError ? (
        <ErrorState
          title="Assessment Telemetry Unavailable"
          message={dataError}
          onRetry={() => loadOverviewData(selectedTarget.id)}
        />
      ) : (
        <div className="overview-vertical-flow">
          
          <AssessmentSummary summary={summary} risk={risk} />
          
          <div className="overview-two-column">
            <div className="column-main">
              <PriorityInvestigation signals={exposureSignals} />
            </div>
            <div className="column-side">
              <ExposureDriversChart risk={risk} />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <EmailSecurityCard
              targetId={selectedTarget.id}
              exposureSignals={exposureSignals}
              technologies={technologies}
              relationships={relationships}
            />
            <CertificateIntelligenceCard
              targetId={selectedTarget.id}
              exposureSignals={exposureSignals}
              relationships={relationships}
            />
            <ExternalDependenciesCard
              targetId={selectedTarget.id}
              relationships={relationships}
            />
          </div>

          <div className="overview-section-group">
            <h2 className="section-group-title">ASSETS & DISCOVERIES</h2>
            <div className="discovery-four-grid">
              <AssetCompositionChart assets={assets} />
              <TechnologyOverview technologies={technologies} />
              
              <div className="discovery-section" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 className="discovery-title" style={{ margin: 0, textTransform: 'none' }}>Evidence artifacts</h3>
                </div>
                <div className="discovery-stat-large">{summary?.evidence_items ?? '--'} <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>artifacts</span></div>
                
                <div className="evidence-visual" style={{ marginTop: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-base)', padding: '6px 10px', borderRadius: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', flexGrow: 1 }}>Raw Evidence Logs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-base)', padding: '6px 10px', borderRadius: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', flexGrow: 1 }}>Analysis Artifacts</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, marginTop: 'auto' }}>Artifacts confirming asset existence.</p>
                </div>

                <div className="discovery-action" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <button className="btn-link" onClick={() => navigate('/evidence')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }} aria-label="View raw evidence logs">
                    View evidence
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>

              <RelationshipSnapshot 
                relationships={relationships} 
                assets={assets} 
                technologies={technologies} 
              />
            </div>
          </div>

          <div className="overview-section-group" style={{ marginTop: '32px' }} id="methodology-section">
            <button 
              className="collapsible-header" 
              onClick={() => {
                setIsContextExpanded(!isContextExpanded);
                if (!isContextExpanded) {
                  setTimeout(() => {
                    const el = document.getElementById('methodology-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }
              }}
              aria-expanded={isContextExpanded}
              aria-controls="methodology-content"
              style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', cursor: 'pointer' }}
            >
              <h2 className="section-group-title" style={{ margin: 0 }}>ACTIVITY & METHODOLOGY</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isContextExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isContextExpanded && (
              <div id="methodology-content" className="context-grid" style={{ marginTop: '16px', padding: '24px', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', background: 'var(--color-bg-surface)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 className="section-group-title">Recent activity</h3>
                  <RecentActivity target={selectedTarget} summary={summary} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className="section-group-title">Assessment methodology</h3>
                  <MethodologySummary />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </PageContainer>
  );
};
