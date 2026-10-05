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
  AssessmentSummary,
  ExposureDriversChart,
  AssetCompositionChart,
  TechnologyOverview,
  PriorityInvestigation,
  RelationshipSnapshot,
  RecentActivity,
  MethodologySummary
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

      <CollectionBanner
        isRunning={isCollectionRunning}
        summary={collectionSummary}
        error={collectionError}
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
        <div className="overview-workspace-flow">
          <AssessmentSummary summary={summary} risk={risk} />
          
          <div className="overview-grid-main">
            <ExposureDriversChart risk={risk} />
            <AssetCompositionChart assets={assets} />
            <TechnologyOverview technologies={technologies} />
          </div>

          <PriorityInvestigation signals={exposureSignals} />

          <div className="overview-grid-secondary">
            <RelationshipSnapshot 
              relationships={relationships} 
              assets={assets} 
              technologies={technologies} 
            />
            <RecentActivity target={selectedTarget} summary={summary} />
            <MethodologySummary />
          </div>
        </div>
      )}
    </PageContainer>
  );
};
