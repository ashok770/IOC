import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTarget } from '../context/TargetContext';
import {
  targetApi,
  riskApi,
  assetApi,
  exposureApi,
  technologyApi,
  evidenceApi,
  relationshipApi,
} from '../api';
import {
  AnalysisSummary,
  RiskAssessment,
  AssetRiskScore,
  Asset,
  ExposureSignal,
  Technology,
  EvidenceItem,
  Relationship,
} from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  ReportPageOne,
  ScopeMethodologySection,
  AssetInventorySection,
  ObservedExposureSection,
  TechnologyIntelligenceSection,
  EvidenceProvenanceSection,
  RelationshipsSection,
  ExposureAssessmentSection,
  InvestigationPrioritiesSection,
  DefensiveRecommendationsSection,
  AssessmentLimitationsSection,
  ReportWorkspace,
} from '../components/reports';

type ReportViewMode = 'workspace' | 'preview';

export const ReportsPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
  } = useTarget();

  const [viewMode, setViewMode] = useState<ReportViewMode>('workspace');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Target summary & risk for workspace card
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);

  // Comprehensive report datasets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [priorities, setPriorities] = useState<AssetRiskScore[]>([]);
  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [hasGeneratedReport, setHasGeneratedReport] = useState<boolean>(false);
  const [generatedTimestamp, setGeneratedTimestamp] = useState<string>('');

  // Maps for fast entity label lookup
  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  const techMap = useMemo(() => {
    const map = new Map<string, Technology>();
    technologies.forEach((t) => map.set(t.id, t));
    return map;
  }, [technologies]);

  // Load workspace baseline summary when target changes
  const loadWorkspaceData = useCallback(async (targetId: string) => {
    setIsLoadingWorkspace(true);
    setError(null);

    try {
      const [sumRes, riskRes] = await Promise.all([
        targetApi.getAnalysisSummary(targetId).catch(() => null),
        riskApi.getTargetRisk(targetId).catch(() => null),
      ]);

      setSummary(sumRes);
      setRiskAssessment(riskRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve assessment metrics.';
      setError(msg);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  // Synthesize complete report dataset
  const generateReport = useCallback(async () => {
    if (!selectedTarget) return;

    setIsGenerating(true);
    setError(null);

    try {
      const targetId = selectedTarget.id;

      const [
        sumRes,
        riskRes,
        prioritiesRes,
        assetsRes,
        signalsRes,
        techsRes,
        evidenceRes,
        relRes,
      ] = await Promise.all([
        targetApi.getAnalysisSummary(targetId).catch(() => null),
        riskApi.getTargetRisk(targetId).catch(() => null),
        riskApi.listTargetAssetPriorities(targetId, undefined, 0, 200).catch(() => ({ items: [], total: 0 })),
        assetApi.listTargetAssets(targetId, { limit: 200 }).catch(() => ({ items: [] as Asset[] })),
        exposureApi.listExposureSignals(targetId, { limit: 100 }).catch(() => ({ items: [] as ExposureSignal[] })),
        technologyApi.listTargetTechnologies(targetId, { limit: 100 }).catch(() => ({ items: [] as Technology[] })),
        evidenceApi.listEvidence(targetId, { limit: 100 }).catch(() => ({ items: [] as EvidenceItem[] })),
        relationshipApi.listTargetRelationships(targetId, { limit: 100 }).catch(() => ({ items: [] as Relationship[] })),
      ]);

      setSummary(sumRes);
      setRiskAssessment(riskRes);
      setPriorities(prioritiesRes.items || []);
      setAssets(assetsRes.items || []);
      setExposureSignals(signalsRes.items || []);
      setTechnologies(techsRes.items || []);
      setEvidenceItems(evidenceRes.items || []);
      setRelationships(relRes.items || []);

      setHasGeneratedReport(true);
      setGeneratedTimestamp(new Date().toLocaleString());
      setViewMode('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate comprehensive assessment report.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTarget]);

  // Target switching: reset all report state immediately to prevent cross-target leakage
  useEffect(() => {
    setViewMode('workspace');
    setSummary(null);
    setRiskAssessment(null);
    setAssets([]);
    setPriorities([]);
    setExposureSignals([]);
    setTechnologies([]);
    setEvidenceItems([]);
    setRelationships([]);
    setHasGeneratedReport(false);
    setGeneratedTimestamp('');
    setError(null);

    if (selectedTarget?.id) {
      loadWorkspaceData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadWorkspaceData]);

  // Handle browser print export
  const handlePrint = () => {
    window.print();
  };

  // Export report data as JSON
  const handleDownloadJson = () => {
    if (!selectedTarget) return;

    const reportData = {
      platform: 'OSINT Sentinel',
      document: 'Authorized External Security Assessment Report',
      generated_at: generatedTimestamp || new Date().toISOString(),
      target: {
        id: selectedTarget.id,
        primary_domain: selectedTarget.primary_domain,
        assessment_status: selectedTarget.assessment_status,
      },
      executive_summary: summary,
      risk_assessment: riskAssessment,
      asset_priorities: priorities,
      discovered_assets: assets,
      observed_exposure_signals: exposureSignals,
      technology_observations: technologies,
      evidence_artifacts: evidenceItems,
      observed_relationships: relationships,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `osint-sentinel-report-${selectedTarget.primary_domain}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Target loading state
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

  // No target selected
  if (!selectedTarget) {
    return (
      <PageContainer>
        <EmptyState
          title="NO ASSESSMENT SELECTED"
          message="Select or create an authorized assessment target to generate structured assessment reports."
          actionText="+ CREATE ASSESSMENT"
          onAction={openCreateModal}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Page Header (Hidden during print via @media print) */}
      <PageHeader
        title="Assessment Reports"
        subtitle="Structured output from the selected authorized external security assessment."
        badge={
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--color-accent-cyan)',
              backgroundColor: 'var(--color-accent-cyan-subtle)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 200, 229, 0.25)',
            }}
          >
            TARGET: {selectedTarget.primary_domain}
          </span>
        }
      />

      {/* Error state */}
      {error && (
        <ErrorState
          title="REPORT GENERATION ERROR"
          message={error}
          onRetry={generateReport}
        />
      )}

      {/* Workspace View */}
      {viewMode === 'workspace' && (
        <>
          {isLoadingWorkspace ? (
            <div className="state-box" style={{ minHeight: 220 }}>
              <div className="state-spinner" aria-hidden="true" />
              <span className="state-title">Loading assessment baseline...</span>
            </div>
          ) : (
            <ReportWorkspace
              target={selectedTarget}
              summary={summary}
              riskAssessment={riskAssessment}
              isGenerating={isGenerating}
              onGenerate={generateReport}
              onPreview={() => setViewMode('preview')}
              hasGeneratedReport={hasGeneratedReport}
            />
          )}
        </>
      )}

      {/* Report Document Preview */}
      {viewMode === 'preview' && (
        <div className="report-preview-wrapper">
          {/* Action Bar (Hidden during print) */}
          <div className="report-action-bar">
            <div className="report-action-bar-left">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewMode('workspace')}
              >
                ← BACK TO WORKSPACE
              </button>
              <span className="monospace" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                PREVIEW MODE • {selectedTarget.primary_domain}
              </span>
            </div>

            <div className="report-action-bar-right">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadJson}
              >
                <svg
                  className="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>EXPORT JSON</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handlePrint}
              >
                <svg
                  className="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>PRINT / SAVE AS PDF</span>
              </button>
            </div>
          </div>

          {/* Actual Report Document Container */}
          <article className="report-document" aria-label="Security Assessment Report">
            {/* PAGE 1: Executive Assessment Deliverable */}
            <ReportPageOne
              target={selectedTarget}
              summary={summary}
              riskAssessment={riskAssessment}
              technologies={technologies}
              exposureSignals={exposureSignals}
              evidenceItems={evidenceItems}
              relationships={relationships}
              generatedAt={generatedTimestamp || 'Live Telemetry'}
            />

            {/* Visual Page Break on Screen */}
            <div className="report-page-break-indicator" aria-hidden="true">
              <span className="break-line" />
              <span className="break-label">PAGE BREAK • DETAILED INTELLIGENCE (PAGES 2+)</span>
              <span className="break-line" />
            </div>

            {/* Pages 2+ (Detailed Intelligence Sections - to be redesigned in subsequent phases) */}
            <div className="report-pages-continuation">
              {/* 02. Scope & Methodology */}
              <ScopeMethodologySection
                target={selectedTarget}
                evidenceItems={evidenceItems}
              />

            {/* 03. Asset Inventory */}
            <AssetInventorySection
              assets={assets}
              primaryDomain={selectedTarget.primary_domain}
            />

            {/* 04. Observed Exposure Signals */}
            <ObservedExposureSection
              signals={exposureSignals}
              assetMap={assetMap}
            />

            {/* 05. Technology Intelligence */}
            <TechnologyIntelligenceSection
              technologies={technologies}
              assetMap={assetMap}
            />

            {/* 06. Evidence & Provenance */}
            <EvidenceProvenanceSection
              evidenceItems={evidenceItems}
              totalEvidenceCount={summary?.evidence_items ?? evidenceItems.length}
            />

            {/* 07. External Asset Relationships */}
            <RelationshipsSection
              relationships={relationships}
              assetMap={assetMap}
              techMap={techMap}
              totalRelationshipCount={summary?.relationships ?? relationships.length}
            />

            {/* 08. External Exposure Assessment */}
            <ExposureAssessmentSection riskAssessment={riskAssessment} />

            {/* 09. Investigation Priorities */}
            <InvestigationPrioritiesSection
              priorities={priorities}
              assetMap={assetMap}
            />

            {/* 10. Defensive Recommendations */}
            <DefensiveRecommendationsSection
              recommendations={riskAssessment?.recommendations || []}
            />

            {/* 11. Assessment Limitations */}
            <AssessmentLimitationsSection />
          </div>
        </article>
        </div>
      )}
    </PageContainer>
  );
};
