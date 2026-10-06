import React, { useEffect, useState } from 'react';
import { Target, CollectionSummaryResponse } from '../../types';

interface Props {
  isOpen: boolean;
  target: Target | null;
  isRunning: boolean;
  error: string | null;
  summary: CollectionSummaryResponse | null;
  onClose: () => void;
  onRetry: () => void;
}

export const AssessmentProgressModal: React.FC<Props> = ({
  isOpen, target, isRunning, error, summary, onClose, onRetry
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActivePhase(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRunning) {
      if (!error && summary) {
        setActivePhase(5);
      }
      return;
    }
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev < 5 ? prev + 1 : 5));
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, error, summary]);

  if (!isOpen || !target) return null;

  const isFailed = !!error;
  const isComplete = !isRunning && !isFailed && !!summary;

  const stages = [
    'TARGET',
    'PUBLIC SOURCES',
    'EVIDENCE',
    'ASSETS',
    'CORRELATION',
    'EXPOSURE ASSESSMENT'
  ];

  const phaseMessages = [
    'Initializing assessment...',
    'Collecting public intelligence...',
    'Processing collected evidence...',
    'Normalizing discovered assets...',
    'Correlating intelligence...',
    'Evaluating external exposure...'
  ];

  const currentStatusMsg = isFailed 
    ? 'Failed to complete assessment.' 
    : isComplete 
      ? 'Processing complete.' 
      : phaseMessages[activePhase];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="progress-title">
      <div className="assessment-progress-panel">
        <div className="progress-header">
          {isRunning && <h2 id="progress-title" className="progress-title">ASSESSMENT IN PROGRESS</h2>}
          {isComplete && <h2 id="progress-title" className="progress-title success">✓ ASSESSMENT COMPLETE</h2>}
          {isFailed && <h2 id="progress-title" className="progress-title error">ASSESSMENT INTERRUPTED</h2>}
          
          <div className="progress-target">Target: <span className="mono">{target.primary_domain}</span></div>
          
          <div className="progress-status" aria-live="polite">
            <div className="status-primary">{currentStatusMsg}</div>
            <div className="status-secondary">Authorized passive assessment &bull; Read-only OSINT</div>
          </div>
        </div>

        {isRunning && (
          <div className={`pipeline-visualization ${reducedMotion ? 'reduced-motion' : ''}`} aria-hidden="true">
            <div className="pipeline-stages-container">
              {stages.map((stage, i) => {
                const isCompleted = isComplete || (i < activePhase && isRunning);
                const isActive = isRunning && i === activePhase;
                
                let nodeClass = "pending";
                if (isCompleted) nodeClass = "completed";
                if (isActive) nodeClass = "active";

                return (
                  <React.Fragment key={i}>
                    <div className={`pipeline-stage ${nodeClass}`}>
                      <div className="stage-icon-container">
                        {isCompleted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : isActive ? (
                          <span className="stage-active-pulse"></span>
                        ) : (
                          <span className="stage-dot-empty"></span>
                        )}
                      </div>
                      <span className="stage-label">{stage}</span>
                    </div>
                    {i < stages.length - 1 && (
                      <div className={`pipeline-connector ${i < activePhase ? 'completed' : isActive ? 'active' : 'pending'}`}>
                        {!reducedMotion && isActive && (
                          <div className="connector-pulse"></div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {isComplete && summary && (
          <div className="progress-summary">
            <div className="summary-grid">
              <div className="summary-stat">
                <span className="stat-value">{summary.evidence_items_created ?? 0}</span>
                <span className="stat-label">Evidence collected</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{summary.assets_discovered ?? 0}</span>
                <span className="stat-label">Assets discovered</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{summary.technologies_discovered ?? 0}</span>
                <span className="stat-label">Technologies detected</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{summary.findings_created ?? 0}</span>
                <span className="stat-label">Exposure signals</span>
              </div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="progress-error-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="progress-actions">
          {isComplete && (
            <button className="btn btn-primary" onClick={onClose} autoFocus>
              View Assessment
            </button>
          )}
          {isFailed && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={onRetry} autoFocus>Retry Assessment</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
