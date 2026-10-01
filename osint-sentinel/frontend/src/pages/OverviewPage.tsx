import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageContainer, PageHeader, StatusBadge } from '../components/common';
import { Target } from '../types';

interface OutletContextType {
  activeTarget: Target | null;
}

export const OverviewPage: React.FC = () => {
  const { activeTarget } = useOutletContext<OutletContextType>();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'cyan';
      case 'partial':
        return 'warning';
      case 'failed':
        return 'critical';
      default:
        return 'neutral';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Security Exposure Overview"
        subtitle="Executive external attack surface assessment and defensive posture telemetry."
        badge={
          activeTarget ? (
            <StatusBadge
              label={`STATUS: ${activeTarget.assessment_status}`}
              variant={getStatusBadgeVariant(activeTarget.assessment_status)}
            />
          ) : (
            <StatusBadge label="NO TARGET REGISTERED" variant="neutral" />
          )
        }
      />

      <div className="placeholder-card">
        <StatusBadge label="CHECKPOINT 1 FOUNDATION" variant="violet" className="placeholder-badge" />
        <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          Assessment Overview Foundation Established
        </h2>
        <p className="placeholder-desc">
          The application shell, navigation, API client, and layout foundation are active.
          The complete posture dashboard (including overall exposure scoring, category breakdowns,
          and prioritized action items) will be implemented in subsequent checkpoints.
        </p>
        <p className="placeholder-desc" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          OSINT Sentinel adheres strictly to deterministic, explainable intelligence. Zero mock metrics,
          simulated risk scores, or speculative vulnerabilities are fabricated.
        </p>

        {activeTarget && (
          <div className="placeholder-meta-grid">
            <div className="placeholder-meta-item">
              <span className="placeholder-meta-label">Active Target Domain</span>
              <span className="placeholder-meta-value">{activeTarget.primary_domain}</span>
            </div>
            <div className="placeholder-meta-item">
              <span className="placeholder-meta-label">Organization</span>
              <span className="placeholder-meta-value">{activeTarget.name || 'Unspecified'}</span>
            </div>
            <div className="placeholder-meta-item">
              <span className="placeholder-meta-label">Target ID</span>
              <span className="placeholder-meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {activeTarget.id}
              </span>
            </div>
            <div className="placeholder-meta-item">
              <span className="placeholder-meta-label">Registered At</span>
              <span className="placeholder-meta-value">
                {new Date(activeTarget.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
