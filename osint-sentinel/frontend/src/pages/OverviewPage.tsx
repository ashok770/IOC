import React, { useEffect, useState, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
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
  CollectionBanner,
  PrimaryAssessmentSection,
  IntelligenceSnapshot,
  IntelligencePipeline,
  PriorityInvestigationList,
  AssetCompositionCard,
  RelationshipStructureCard,
  AssessmentIntegrityCard,
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

  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

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
        targetApi.getAnalysisSummary(targetId).catch(() => null),
        riskApi.getTargetRisk(targetId).catch(() => null),
        exposureApi.listExposureSignals(targetId).catch(() => ({ items: [] })),
        assetApi.listTargetAssets(targetId).catch(() => ({ items: [] })),
        technologyApi.listTargetTechnologies(targetId).catch(() => ({ items: [] })),
        relationshipApi.listTargetRelationships(targetId).catch(() => ({ items: [] })),
      ]);

      setSummary(summaryRes);
      setRisk(riskRes);
      setExposureSignals(signalsRes?.items || []);
      setAssets(assetsRes?.items || []);
      setTechnologies(techRes?.items || []);
      setRelationships(relsRes?.items || []);
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
      {/* SECTION 1: Target Header */}
      <AssessmentHeader
        target={selectedTarget}
        onRunAssessment={handleRunAssessment}
        isCollecting={isCollectionRunning}
      />

      {/* Real-time Collection Progress & Completion Notification */}
      <CollectionBanner
        isRunning={isCollectionRunning}
        summary={collectionSummary}
        error={collectionError}
      />

      {dataError ? (
        <ErrorState
          title="Assessment Telemetry Unavailable"
          message={dataError}
          onRetry={() => selectedTarget && loadOverviewData(selectedTarget.id)}
        />
      ) : (
        <div className="overview-workspace-flow">
          {/* SECTION 2 & 3: Primary Assessment & Contributing Factors */}
          <PrimaryAssessmentSection risk={risk} isLoading={isLoadingData} />

          {/* SECTION 4: Intelligence Snapshot */}
          <IntelligenceSnapshot summary={summary} isLoading={isLoadingData} />

          {/* SECTION 5: Intelligence Pipeline */}
          <IntelligencePipeline
            primaryDomain={selectedTarget.primary_domain}
            summary={summary}
            risk={risk}
            isLoading={isLoadingData}
          />

          {/* Mid-Section Grid: Priority Investigation (Sec 7) & Relationships (Sec 9) */}
          <div className="overview-mid-analytical-grid">
            <PriorityInvestigationList
              recommendations={risk?.recommendations || []}
              exposureSignals={exposureSignals}
              isLoading={isLoadingData}
            />

            <RelationshipStructureCard
              primaryDomain={selectedTarget.primary_domain}
              relationships={relationships}
              assets={assets}
              technologies={technologies}
              isLoading={isLoadingData}
            />
          </div>

          {/* SECTION 6 & 8: Asset Intelligence & Perimeter Surface */}
          <AssetCompositionCard
            assets={assets}
            primaryDomain={selectedTarget.primary_domain}
            isLoading={isLoadingData}
          />

          {/* SECTION 10: Methodology & Provenance Strip */}
          <AssessmentIntegrityCard />
        </div>
      )}
    </PageContainer>
  );
};
