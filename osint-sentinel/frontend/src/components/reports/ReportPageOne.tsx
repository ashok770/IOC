import React from 'react';
import {
  Target,
  AnalysisSummary,
  RiskAssessment,
  Technology,
  ExposureSignal,
  EvidenceItem,
  Relationship,
} from '../../types';
import { AssessmentLevelBadge } from '../risk/AssessmentLevelBadge';

interface ReportPageOneProps {
  target: Target;
  summary: AnalysisSummary | null;
  riskAssessment: RiskAssessment | null;
  technologies: Technology[];
  exposureSignals: ExposureSignal[];
  evidenceItems: EvidenceItem[];
  relationships: Relationship[];
  generatedAt: string;
}

/**
 * Dynamically synthesizes factual, non-speculative key observations from assessment artifacts.
 */
function generateKeyObservations(
  targetDomain: string,
  technologies: Technology[],
  exposureSignals: ExposureSignal[],
  evidenceItems: EvidenceItem[],
  relationships: Relationship[]
): string[] {
  const observations: string[] = [];

  // 1. Authoritative DNS observation
  const hasDns = evidenceItems.some(
    (e) => e.evidence_type === 'dns_record' || e.source.toLowerCase().includes('dns')
  );
  if (hasDns) {
    observations.push(
      'Public authoritative DNS infrastructure was observed and indexed across apex domain and hostnames.'
    );
  } else {
    observations.push(
      `Public domain infrastructure records were indexed for the scope boundary ${targetDomain}.`
    );
  }

  // 2. Specific technology observations (web servers, mail systems, CDNs)
  const webServers = technologies.filter((t) => t.category === 'web_server');
  const emailTechs = technologies.filter((t) => t.category === 'email');
  const otherTechs = technologies.filter(
    (t) => t.category !== 'web_server' && t.category !== 'email'
  );

  if (webServers.length > 0) {
    const t = webServers[0];
    const methodStr = t.detection_method.replace(/_/g, ' ');
    observations.push(
      `${t.name} was identified through passive ${methodStr}s.`
    );
  } else if (otherTechs.length > 0) {
    const t = otherTechs[0];
    const methodStr = t.detection_method.replace(/_/g, ' ');
    observations.push(
      `${t.name} was identified through passive ${methodStr} telemetry.`
    );
  }

  if (emailTechs.length > 0) {
    const t = emailTechs[0];
    observations.push(
      `${t.name} was identified through public MX mail infrastructure.`
    );
  } else if (otherTechs.length > 1) {
    const t = otherTechs[1];
    observations.push(
      `${t.name} was identified within the public technology footprint.`
    );
  }

  // 3. Exposure signals / External dependencies
  if (exposureSignals.length > 0) {
    const sigTypeLabel = exposureSignals[0].signal_type.replace(/_/g, ' ');
    const countWord = exposureSignals.length === 1 ? 'One' : `${exposureSignals.length}`;
    const noun = exposureSignals.length === 1 ? 'exposure signal was' : 'exposure signals were';
    observations.push(
      `${countWord} ${sigTypeLabel} ${noun} generated for defensive triage.`
    );
  } else {
    observations.push(
      'Zero prioritized exposure signals (remote-access gateways or pre-production hosts) were identified.'
    );
  }

  // Ensure 4 concise factual items
  if (observations.length < 4) {
    const extCount = relationships.filter(
      (r) => r.relationship_type === 'externally_referenced'
    ).length;
    if (extCount > 0) {
      observations.push(
        `${extCount} external infrastructure dependencies were identified in authoritative delegations.`
      );
    } else {
      observations.push(
        'Assessment findings reflect public DNS configurations and passive HTTP response telemetry.'
      );
    }
  }

  return observations.slice(0, 4);
}

export const ReportPageOne: React.FC<ReportPageOneProps> = ({
  target,
  summary,
  riskAssessment,
  technologies,
  exposureSignals,
  evidenceItems,
  relationships,
  generatedAt,
}) => {
  const score =
    riskAssessment?.overall_score ?? summary?.overall_risk_score ?? 0.0;
  const level =
    riskAssessment?.risk_level ?? summary?.risk_level ?? 'low';

  const observations = generateKeyObservations(
    target.primary_domain,
    technologies,
    exposureSignals,
    evidenceItems,
    relationships
  );

  return (
    <div className="report-page report-page-1" id="report-page-1">
      {/* ------------------------------------------------------------------ */}
      {/* Top Section: Header & Title & Metadata                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="p1-top-block">
        {/* Header */}
        <header className="p1-header">
          <div className="p1-header-brand-row">
            <div className="p1-brand-identity">
              <span className="p1-brand-name">OSINT SENTINEL</span>
              <span className="p1-brand-separator" aria-hidden="true">|</span>
              <span className="p1-brand-tagline">SECURITY INTELLIGENCE PLATFORM</span>
            </div>
            <div className="p1-auth-badge">
              <span>AUTHORIZED USE ONLY</span>
            </div>
          </div>
        </header>

        {/* Document Title Block */}
        <div className="p1-title-block">
          <h1 className="p1-main-title">AUTHORIZED EXTERNAL SECURITY ASSESSMENT</h1>
          <div className="p1-target-indicator">
            <span className="p1-target-prefix">Target:</span>
            <span className="p1-target-domain monospace highlight-cyan">
              {target.primary_domain}
            </span>
          </div>
          <p className="p1-title-subtitle">
            Evidence-backed assessment of publicly observable external exposure and defensive configuration signals.
          </p>
        </div>

        {/* Assessment Metadata */}
        <div className="p1-metadata-grid">
          <div className="p1-meta-item">
            <span className="p1-meta-label">ASSESSED TARGET</span>
            <span className="p1-meta-value monospace highlight-cyan">
              {target.primary_domain}
            </span>
          </div>

          <div className="p1-meta-item">
            <span className="p1-meta-label">ASSESSMENT STATUS</span>
            <span className="p1-meta-value status-completed">
              <span className="p1-status-dot" aria-hidden="true" />
              {target.assessment_status.charAt(0).toUpperCase() + target.assessment_status.slice(1)}
            </span>
          </div>

          <div className="p1-meta-item">
            <span className="p1-meta-label">ASSESSMENT MODE</span>
            <span className="p1-meta-value">Authorized / Passive (Non-Intrusive)</span>
          </div>

          <div className="p1-meta-item">
            <span className="p1-meta-label">EXECUTION POLICY</span>
            <span className="p1-meta-value">Zero Exploitation / Read-Only OSINT</span>
          </div>

          <div className="p1-meta-item p1-meta-item--span">
            <span className="p1-meta-label">REPORT GENERATED</span>
            <span className="p1-meta-value monospace">{generatedAt}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Middle Section: Primary Assessment & Snapshot & Narrative           */}
      {/* ------------------------------------------------------------------ */}
      <div className="p1-middle-block">
        {/* Primary Assessment Block */}
        <div className="p1-primary-assessment-card">
          <div className="p1-assessment-header-row">
            <span className="p1-assessment-eyebrow">EXTERNAL EXPOSURE ASSESSMENT</span>
            <span className="p1-assessment-badge-wrap">
              <AssessmentLevelBadge level={level} size="sm" />
            </span>
          </div>

          <div className="p1-assessment-body-row">
            <div className="p1-score-cluster">
              <div className="p1-score-numbers">
                <span className="p1-score-value monospace">{score.toFixed(1)}</span>
                <span className="p1-score-total monospace">/ 100</span>
              </div>
              <span className="p1-score-level-name">
                {level.toUpperCase()} INVESTIGATION PRIORITY
              </span>
            </div>

            <div className="p1-score-explanation">
              <p className="p1-score-disclaimer-text">
                Investigation-priority heuristic derived from observed external exposure factors.
                This score is not a vulnerability score, CVSS score, compromise probability, or security guarantee.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Snapshot */}
        <div className="p1-snapshot-bar">
          <div className="p1-snapshot-cell">
            <span className="p1-snapshot-number monospace">{summary?.assets ?? 0}</span>
            <span className="p1-snapshot-label">ASSESSED ASSETS</span>
          </div>

          <div className="p1-snapshot-separator" aria-hidden="true" />

          <div className="p1-snapshot-cell">
            <span className="p1-snapshot-number monospace">{summary?.evidence_items ?? 0}</span>
            <span className="p1-snapshot-label">EVIDENCE ARTIFACTS</span>
          </div>

          <div className="p1-snapshot-separator" aria-hidden="true" />

          <div className="p1-snapshot-cell">
            <span className="p1-snapshot-number monospace">{summary?.technologies ?? 0}</span>
            <span className="p1-snapshot-label">TECHNOLOGY OBSERVATIONS</span>
          </div>

          <div className="p1-snapshot-separator" aria-hidden="true" />

          <div className="p1-snapshot-cell">
            <span className="p1-snapshot-number monospace">{summary?.exposure_signals ?? 0}</span>
            <span className="p1-snapshot-label">EXPOSURE SIGNALS</span>
          </div>

          <div className="p1-snapshot-separator" aria-hidden="true" />

          <div className="p1-snapshot-cell">
            <span className="p1-snapshot-number monospace">{summary?.relationships ?? 0}</span>
            <span className="p1-snapshot-label">RELATIONSHIPS</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p1-section">
          <div className="p1-section-title-row">
            <span className="p1-section-num">01</span>
            <h2 className="p1-section-title">EXECUTIVE SUMMARY</h2>
          </div>
          <div className="p1-narrative-box">
            <p>
              OSINT Sentinel performed an authorized, non-intrusive external exposure assessment of{' '}
              <strong className="monospace highlight-cyan">{target.primary_domain}</strong>. All observations
              were gathered exclusively from publicly accessible external sources, including authoritative DNS records,
              RDAP domain registries, Certificate Transparency logs, and passive HTTP response headers. Zero intrusive probing,
              port scanning, credential testing, or exploitation was conducted. The assessment produced an External Exposure Assessment
              Score of <strong className="monospace">{score.toFixed(1)} / 100</strong> (<span className="p1-level-tag">{level.toUpperCase()}</span> investigation priority),
              reflecting observable external surface area, email authentication defenses, and disclosed technology footprints.
            </p>
          </div>
        </div>

        {/* Key Observations */}
        <div className="p1-section">
          <div className="p1-section-title-row">
            <span className="p1-section-num">02</span>
            <h2 className="p1-section-title">KEY OBSERVATIONS</h2>
          </div>
          <ul className="p1-observations-list">
            {observations.map((obs, idx) => (
              <li key={idx} className="p1-observation-item">
                <span className="p1-obs-bullet" aria-hidden="true" />
                <span className="p1-obs-text">{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Section: Formal Deliverable Footer                          */}
      {/* ------------------------------------------------------------------ */}
      <footer className="p1-footer">
        <div className="p1-footer-left">
          <span className="p1-footer-brand">OSINT SENTINEL</span>
        </div>
        <div className="p1-footer-center">
          <span>Authorized External Security Assessment • Target: {target.primary_domain}</span>
        </div>
        <div className="p1-footer-right">
          <span className="p1-footer-page">Page 1</span>
        </div>
      </footer>
    </div>
  );
};
