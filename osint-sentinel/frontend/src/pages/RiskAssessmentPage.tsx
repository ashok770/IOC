import React, { useEffect, useState, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { riskApi, assetApi, exposureApi, technologyApi } from '../api';
import {
  RiskAssessment,
  AssetRiskScore,
  Asset,
  ExposureSignal,
  Technology,
} from '../types';
import { PageContainer, PageHeader, EmptyState, ErrorState } from '../components/common';
import {
  ExposureScoreCard,
  FactorBreakdownList,
  AssessmentBasisCard,
  ObservedSignalsSection,
  AssetPriorityTable,
} from '../components/risk';

export const RiskAssessmentPage: React.FC = () => {
  const {
    selectedTarget,
    isLoadingTargets,
    openCreateModal,
    triggerCollection,
  } = useTarget();

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assetPriorities, setAssetPriorities] = useState<AssetRiskScore[]>([]);
  const [exposureSignals, setExposureSignals] = useState<ExposureSignal[]>([]);
  const [assetMap, setAssetMap] = useState<Map<string, Asset>>(new Map());
  const [techMap, setTechMap] = useState<Map<string, Technology[]>>(new Map());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load deterministic risk assessment data for active target
  const loadRiskData = useCallback(async (targetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [riskRes, prioritiesRes, assetsRes, signalsRes, techsRes] = await Promise.all([
        riskApi.getTargetRisk(targetId),
        riskApi.listTargetAssetPriorities(targetId, undefined, 0, 250).catch(() => ({ items: [], total: 0 })),
        assetApi.listTargetAssets(targetId, { limit: 250 }).catch(() => ({ items: [] as Asset[] })),
        exposureApi.listExposureSignals(targetId, { limit: 250 }).catch(() => ({ items: [] as ExposureSignal[] })),
        technologyApi.listTargetTechnologies(targetId, { limit: 250 }).catch(() => ({ items: [] as Technology[] })),
      ]);

      setAssessment(riskRes);
      setAssetPriorities(prioritiesRes.items || []);
      setExposureSignals(signalsRes.items || []);

      // Build asset map for quick reference
      const aMap = new Map<string, Asset>();
      (assetsRes.items || []).forEach((a: Asset) => aMap.set(a.id, a));
      setAssetMap(aMap);

      // Group technologies by asset ID
      const tMap = new Map<string, Technology[]>();
      (techsRes.items || []).forEach((t: Technology) => {
        if (t.asset_id) {
          const list = tMap.get(t.asset_id) || [];
          list.push(t);
          tMap.set(t.asset_id, list);
        }
      });
      setTechMap(tMap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve external exposure assessment.';
      setError(msg);
      setAssessment(null);
      setAssetPriorities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Target switching: reset all state immediately to prevent cross-target leakage
  useEffect(() => {
    setAssessment(null);
    setAssetPriorities([]);
    setExposureSignals([]);
    setAssetMap(new Map());
    setTechMap(new Map());
    setError(null);

    if (selectedTarget?.id) {
      loadRiskData(selectedTarget.id);
    }
  }, [selectedTarget?.id, loadRiskData]);

  // Handle re-running passive assessment from empty state
  const handleRunAssessment = async () => {
    if (!selectedTarget) return;
    const res = await triggerCollection(selectedTarget.id);
    if (res) {
      await loadRiskData(selectedTarget.id);
    }
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
          message="Select or create an authorized assessment target to view external exposure assessment."
          actionText="+ CREATE ASSESSMENT"
          onAction={openCreateModal}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="External Exposure Assessment"
        subtitle="Evidence-backed prioritization of observed external exposure signals."
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

      {/* Main Content States */}
      {error ? (
        <ErrorState
          title="EXPOSURE ASSESSMENT UNAVAILABLE"
          message={error}
          onRetry={() => loadRiskData(selectedTarget.id)}
        />
      ) : isLoading ? (
        <div className="state-box" style={{ minHeight: 280 }}>
          <div className="state-spinner" aria-hidden="true" />
          <span className="state-title">LOADING EXPOSURE ASSESSMENT...</span>
          <p className="state-message">
            Retrieving deterministic exposure score and factor breakdown from assessment scope.
          </p>
        </div>
      ) : !assessment ? (
        <EmptyState
          title="NO EXPOSURE ASSESSMENT AVAILABLE"
          message="Run an authorized passive assessment to generate evidence-backed prioritization."
          actionText="RUN PASSIVE ASSESSMENT"
          onAction={handleRunAssessment}
        />
      ) : (
        <div className="risk-page-content">
          {/* Executive Assessment Card */}
          <ExposureScoreCard
            score={assessment.overall_score}
            level={assessment.risk_level}
            targetDomain={selectedTarget.primary_domain}
            assessmentDate={assessment.updated_at || assessment.created_at}
          />

          {/* Factor Breakdown ("WHY THIS SCORE?") */}
          <FactorBreakdownList factorsBreakdown={assessment.factors_breakdown} />

          {/* Assessment Basis & Integrity Side-by-Side */}
          <AssessmentBasisCard
            primaryDomain={selectedTarget.primary_domain}
            assessmentStatus={selectedTarget.assessment_status}
            totalAssets={assetMap.size}
            totalSignals={exposureSignals.length}
          />

          {/* Observed Exposure Signals & Guidance */}
          <ObservedSignalsSection
            signals={exposureSignals}
            recommendations={assessment.recommendations || []}
            assetMap={assetMap}
          />

          {/* Priority Investigation List */}
          <AssetPriorityTable
            items={assetPriorities}
            assetMap={assetMap}
            techMap={techMap}
            isLoading={isLoading}
          />
        </div>
      )}
    </PageContainer>
  );
};
