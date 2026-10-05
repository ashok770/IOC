import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisSummary, RiskAssessment } from '../../types';

interface IntelligencePipelineProps {
  primaryDomain: string;
  summary: AnalysisSummary | null;
  risk: RiskAssessment | null;
  isLoading: boolean;
}

interface PipelineNode {
  id: string;
  order: string;
  label: string;
  countLabel: string;
  detail: string;
  icon: string;
  to?: string;
  status: 'verified' | 'evaluated' | 'scoped';
}

export const IntelligencePipeline: React.FC<IntelligencePipelineProps> = ({
  primaryDomain,
  summary,
  risk,
  isLoading,
}) => {
  const navigate = useNavigate();

  const nodes: PipelineNode[] = [
    {
      id: 'target',
      order: '01',
      label: 'Target Scope',
      countLabel: primaryDomain || 'Scope Domain',
      detail: 'Apex perimeter scope',
      icon: '🎯',
      status: 'scoped',
    },
    {
      id: 'evidence',
      order: '02',
      label: 'Public Evidence',
      countLabel: `${summary?.evidence_items ?? 0} Artifacts`,
      detail: 'DNS, RDAP, CT & Headers',
      icon: '📜',
      to: '/evidence',
      status: 'verified',
    },
    {
      id: 'assets',
      order: '03',
      label: 'Perimeter Assets',
      countLabel: `${summary?.assets ?? 0} Cataloged`,
      detail: 'Domains, subdomains, IPs',
      icon: '🌐',
      to: '/assets',
      status: 'verified',
    },
    {
      id: 'technologies',
      order: '04',
      label: 'Observed Stacks',
      countLabel: `${summary?.technologies ?? 0} Fingerprints`,
      detail: 'Passive detection rules',
      icon: '⚙️',
      to: '/technologies',
      status: 'verified',
    },
    {
      id: 'exposure',
      order: '05',
      label: 'Exposure Signals',
      countLabel: `${summary?.exposure_signals ?? 0} Prioritized`,
      detail: 'Observable attack vectors',
      icon: '⚡',
      to: '/exposure',
      status: 'verified',
    },
    {
      id: 'assessment',
      order: '06',
      label: 'Exposure Heuristic',
      countLabel: risk ? `${risk.overall_score.toFixed(1)} ${risk.risk_level.toUpperCase()}` : '-- PENDING',
      detail: 'Deterministic evaluation',
      icon: '🛡️',
      to: '/risk',
      status: 'evaluated',
    },
  ];

  return (
    <section className="intelligence-pipeline-section" aria-label="Assessment Intelligence Pipeline">
      <div className="pipeline-header-row">
        <div className="pipeline-header-left">
          <div className="pipeline-title-group">
            <span className="pipeline-badge-icon" aria-hidden="true">⚡</span>
            <h2 className="pipeline-title">Intelligence Pipeline Flow</h2>
          </div>
          <p className="pipeline-subtitle">
            Deterministic pipeline transforming publicly observable external telemetry into actionable exposure intelligence
          </p>
        </div>

        <div className="pipeline-header-badges">
          <span className="pipeline-mode-badge">
            Zero Exploitation • Read-Only
          </span>
        </div>
      </div>

      <div className="pipeline-diagram-track">
        {nodes.map((node, index) => {
          const isClickable = Boolean(node.to);
          return (
            <React.Fragment key={node.id}>
              {index > 0 && (
                <div className="pipeline-step-arrow" aria-hidden="true">
                  <span className="arrow-line" />
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}

              <div
                className={`pipeline-node-card ${isClickable ? 'pipeline-node-card--clickable' : ''}`}
                onClick={isClickable && node.to ? () => navigate(node.to!) : undefined}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={
                  isClickable && node.to
                    ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(node.to!)
                    : undefined
                }
                title={isClickable ? `Navigate to ${node.label} (${node.to})` : undefined}
              >
                <div className="pipeline-node-top">
                  <span className="pipeline-node-icon" aria-hidden="true">{node.icon}</span>
                  <span className="pipeline-node-order">STEP {node.order}</span>
                </div>

                <div className="pipeline-node-label">{node.label}</div>

                <div className="pipeline-node-count">
                  {isLoading ? '...' : node.countLabel}
                </div>

                <div className="pipeline-node-detail">{node.detail}</div>

                <div className="pipeline-node-footer">
                  <span className="pipeline-status-indicator">
                    <span className="pipeline-status-dot" />
                    <span>Active</span>
                  </span>
                  {isClickable && (
                    <span className="pipeline-node-affordance" aria-hidden="true">
                      Explore →
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
