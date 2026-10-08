import React, { useEffect, useState, useCallback } from 'react';
import { useTarget } from '../context/TargetContext';
import { historyApi } from '../api/historyApi';
import { AssessmentRun, AssessmentComparisonResponse } from '../types/history';
import { PageContainer, EmptyState, ErrorState } from '../components/common';
import {
  AssessmentRunSummaryHeader,
  AssessmentTimeline,
  AssessmentSelector,
  ChangeIntelligenceSummary,
  AssetChangesSection,
  TechChangesSection,
  SignalChangesSection,
  RiskChangeSection,
} from '../components/history';
import '../styles/history.css';

export const AssessmentHistoryPage: React.FC = () => {
  const { selectedTarget, isLoadingTargets } = useTarget();

  const [runs, setRuns] = useState<AssessmentRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);
  const [runsError, setRunsError] = useState<string | null>(null);

  const [baseRunId, setBaseRunId] = useState<string>('');
  const [targetRunId, setTargetRunId] = useState<string>('');

  const [comparison, setComparison] = useState<AssessmentComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!selectedTarget) return;

    setIsLoadingRuns(true);
    setRunsError(null);
    setComparison(null);
    setComparisonError(null);

    try {
      const response = await historyApi.getAssessmentRuns(selectedTarget.id, 0, 50);
      const fetchedRuns = response.items || [];
      setRuns(fetchedRuns);

      // Default selection logic:
      // Filter for valid completed/partial runs if possible, or all runs
      const completedRuns = fetchedRuns.filter(
        (r) => r.status === 'completed' || r.status === 'partial'
      );

      if (completedRuns.length >= 2) {
        // Latest = completedRuns[0], Previous = completedRuns[1] (assuming newest first)
        const targetId = completedRuns[0].id;
        const baseId = completedRuns[1].id;
        setTargetRunId(targetId);
        setBaseRunId(baseId);

        // Trigger default comparison automatically
        runComparison(baseId, targetId);
      } else if (fetchedRuns.length >= 2) {
        setTargetRunId(fetchedRuns[0].id);
        setBaseRunId(fetchedRuns[1].id);
        runComparison(fetchedRuns[1].id, fetchedRuns[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load assessment history runs:', err);
      setRunsError(
        err.response?.data?.detail || err.message || 'Failed to load assessment runs for target.'
      );
    } finally {
      setIsLoadingRuns(false);
    }
  }, [selectedTarget]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const runComparison = async (bId: string, tId: string) => {
    if (!selectedTarget || !bId || !tId || bId === tId) return;

    setIsComparing(true);
    setComparisonError(null);

    try {
      const res = await historyApi.compareAssessments(selectedTarget.id, bId, tId);
      setComparison(res);
    } catch (err: any) {
      console.error('Failed to compare assessments:', err);
      setComparisonError(
        err.response?.data?.detail || err.message || 'Failed to generate assessment comparison.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  const handleManualCompare = () => {
    if (baseRunId && targetRunId && baseRunId !== targetRunId) {
      runComparison(baseRunId, targetRunId);
    }
  };

  if (isLoadingTargets || isLoadingRuns) {
    return (
      <PageContainer>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading assessment history...
        </div>
      </PageContainer>
    );
  }

  if (!selectedTarget) {
    return (
      <PageContainer>
        <EmptyState
          title="No Target Selected"
          message="Please select or create a target to view its assessment history."
        />
      </PageContainer>
    );
  }

  if (runsError) {
    return (
      <PageContainer>
        <ErrorState
          title="Assessment History Error"
          message={runsError}
          onRetry={fetchRuns}
        />
      </PageContainer>
    );
  }

  // Derive latest and previous run for header summary
  const completedOrPartialRuns = runs.filter(
    (r) => r.status === 'completed' || r.status === 'partial'
  );
  const latestRun = completedOrPartialRuns.length > 0 ? completedOrPartialRuns[0] : runs[0] || null;
  const previousRun = completedOrPartialRuns.length > 1 ? completedOrPartialRuns[1] : null;

  return (
    <PageContainer>
      <div className="history-workspace">
        {/* Page Header */}
        <header className="history-header">
          <h1 className="history-title">ASSESSMENT HISTORY</h1>
          <p className="history-subtitle">
            Track how the external exposure of this target changes across assessments.
          </p>
          <div className="history-target-badge">
            Target: <strong>{selectedTarget.primary_domain || selectedTarget.name}</strong> ({selectedTarget.id.substring(0, 8)})
          </div>
        </header>

        {/* Current Assessment Summary Banner */}
        <AssessmentRunSummaryHeader latestRun={latestRun} previousRun={previousRun} />

        {/* Zero / One Run Empty States */}
        {runs.length === 0 ? (
          <div className="history-empty-state">
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-primary)' }}>
              No assessments have been completed for this target yet.
            </h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Run an assessment scan on this target to establish a security posture baseline.
            </p>
          </div>
        ) : runs.length === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="history-empty-state">
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                Baseline assessment available.
              </h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Run another assessment to compare exposure changes, technology updates, and risk progression over time.
              </p>
            </div>
            <AssessmentTimeline runs={runs} />
          </div>
        ) : (
          <>
            {/* Assessment Selection Panel */}
            <AssessmentSelector
              runs={runs}
              baseRunId={baseRunId}
              targetRunId={targetRunId}
              onBaseChange={setBaseRunId}
              onTargetChange={setTargetRunId}
              onCompare={handleManualCompare}
              isLoading={isComparing}
            />

            {/* Comparison Results or Errors */}
            {isComparing ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: 'var(--color-bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Computing deterministic comparison between selected runs...
              </div>
            ) : comparisonError ? (
              <div className="history-error-state">
                <strong>Comparison Failed:</strong> {comparisonError}
              </div>
            ) : comparison ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Change Intelligence Summary */}
                <ChangeIntelligenceSummary comparison={comparison} />

                {/* Risk Change & Factors */}
                <RiskChangeSection risk={comparison.risk} />

                {/* Asset Changes */}
                <AssetChangesSection assets={comparison.assets} />

                {/* Technology Changes */}
                <TechChangesSection technologies={comparison.technologies} />

                {/* Exposure Signal Changes */}
                <SignalChangesSection signals={comparison.exposure_signals} />
              </div>
            ) : null}

            {/* Assessment Timeline */}
            <AssessmentTimeline
              runs={runs}
              selectedBaseId={baseRunId}
              selectedTargetId={targetRunId}
              onSelectRun={(id) => {
                if (id !== targetRunId) {
                  setBaseRunId(id);
                }
              }}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
};
