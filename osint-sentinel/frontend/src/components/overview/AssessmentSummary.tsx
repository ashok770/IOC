import React from 'react';
import { AnalysisSummary, RiskAssessment } from '../../types';
import { AssessmentGauge } from './AssessmentGauge';
import { Link } from 'react-router-dom';

interface AssessmentSummaryProps {
  summary: AnalysisSummary | null;
  risk: RiskAssessment | null;
}

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ summary, risk }) => {
  const score = risk ? risk.overall_score : null;
  const level = risk ? risk.risk_level.toUpperCase() : 'PENDING';
  
  // Calculate dynamic executive statement
  let statementText = 'No assessment data available to summarize posture.';
  if (risk) {
    const levelStr = risk.risk_level.toLowerCase();
    const factors = Object.entries(risk.factors_breakdown || {})
      .filter(([_, val]) => val > 0)
      .sort((a, b) => b[1] - a[1]);
      
    if (factors.length === 0) {
      statementText = `${levelStr.charAt(0).toUpperCase() + levelStr.slice(1)} external exposure was identified from the observed public footprint. There were no significant contributing risk factors observed.`;
    } else {
      const topFactors = factors.slice(0, 2).map(([key]) => key.replace(/_/g, ' '));
      const factorsStr = topFactors.join(' and ');
      statementText = `${levelStr.charAt(0).toUpperCase() + levelStr.slice(1)} external exposure was identified from the observed public footprint. The primary contributing factors were ${factorsStr}.`;
    }
  }

  return (
    <div className="assessment-hero-container">
      <div className="hero-left-gauge">
        <AssessmentGauge score={score} level={level} />
      </div>
      <div className="hero-right-content">
        <p className="hero-lead-text">{statementText}</p>
        
        <div className="hero-stat-tiles" style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
          <Link to="/risk-assessment" className="stat-tile" style={{ flex: 1, padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'border-color 0.2s' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{level.toUpperCase() === 'PENDING' ? '--' : level === 'INFO' || level === 'LOW' ? 'P4' : level === 'MEDIUM' ? 'P3' : level === 'HIGH' ? 'P2' : 'P1'}</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Investigation priority</span>
            <div style={{ flexGrow: 1 }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>P1=Crit, P2=High, P3=Med, P4=Low</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-accent-cyan)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
          <Link to="/exposure" className="stat-tile" style={{ flex: 1, padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'border-color 0.2s' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{summary?.exposure_signals ?? '--'}</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Exposure signals</span>
            <div style={{ flexGrow: 1 }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Informational findings</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-accent-cyan)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
          <Link to="/assets" className="stat-tile" style={{ flex: 1, padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'border-color 0.2s' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{summary?.assets ?? '--'}</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>External assets</span>
            <div style={{ flexGrow: 1 }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Domains, subdomains, IPs</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-accent-cyan)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
        </div>
      </div>
    </div>
  );
};
