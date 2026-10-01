import React, { useEffect, useState, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { targetApi, riskApi, exposureApi, assetApi } from '../api';
import {
  AnalysisSummary,
  RiskAssessment,
  ExposureSignal,
  Asset,
} from '../types';
import { PageContainer, EmptyState, ErrorState } from '../components/common';
import {
  AssessmentHeader,
  CollectionBanner,
  ExposureAssessmentCard,
  FactorBreakdownCard,
  IntelligenceMetricsGrid,
  PriorityInvestigationList,
  AssetSummaryList,
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

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadOverviewData = useCallback(async (targetId: string) => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [summaryRes, riskRes, signalsRes, assetsRes] = await Promise.all([
        targetApi.getAnalysisSummary(targetId).catch(() => null),
        riskApi.getTargetRisk(targetId).catch(() => null),
        exposureApi.listExposureSignals(targetId).catch(() => ({ items: [] })),
        assetApi.listTargetAssets(targetId).catch(() => ({ items: [] })),
      ]);

      setSummary(summaryRes);
      setRisk(riskRes);
      setExposureSignals(signalsRes?.items || []);
      setAssets(assetsRes?.items || []);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to retrieve assessment data from backend.');
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
    }
  }, [selectedTarget?.id, loadOverviewData]);

  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      // Reload overview metrics after real collection completion
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
      {/* Overview Assessment Header */}
      <AssessmentHeader
        target={selectedTarget}
        onRunAssessment={handleRunAssessment}
        isCollecting={isCollectionRunning}
      />

      {/* Real-time Collection Progress & Completion Banner */}
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
        <>
          {/* External Exposure Assessment & Contributing Factors */}
          <div className="exposure-section-grid">
            <ExposureAssessmentCard risk={risk} isLoading={isLoadingData} />
            <FactorBreakdownCard risk={risk} isLoading={isLoadingData} />
          </div>

          {/* KPI Intelligence Counters */}
          <IntelligenceMetricsGrid summary={summary} isLoading={isLoadingData} />

          {/* Priority Investigation Triage */}
          <PriorityInvestigationList
            recommendations={risk?.recommendations || []}
            exposureSignals={exposureSignals}
            isLoading={isLoadingData}
          />

          {/* Discovered Perimeter Surface Summary */}
          <AssetSummaryList assets={assets} isLoading={isLoadingData} />

          {/* Assessment Integrity & Policy */}
          <AssessmentIntegrityCard />
        </>
      )}
    </PageContainer>
  );
};
