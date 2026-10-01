import React, { useState, useRef, useEffect } from 'react';
import { useTarget } from '../../context/TargetContext';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { Target } from '../../types';

export const TargetSelector: React.FC = () => {
  const {
    targets,
    selectedTarget,
    selectTarget,
    isLoadingTargets,
    openCreateModal,
  } = useTarget();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getStatusVariant = (status: string): StatusBadgeVariant => {
    switch (status.toLowerCase()) {
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

  if (isLoadingTargets && targets.length === 0) {
    return (
      <div className="target-selector-btn" style={{ opacity: 0.7 }}>
        <span className="target-selector-label">TARGET:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>Loading...</span>
      </div>
    );
  }

  if (targets.length === 0) {
    return (
      <div className="target-selector-container">
        <button
          type="button"
          className="target-selector-btn"
          onClick={openCreateModal}
          title="Register a new authorized assessment target"
        >
          <span className="target-selector-label">TARGET:</span>
          <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            NO TARGET REGISTERED
          </span>
          <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 600 }}>
            + CREATE ASSESSMENT
          </span>
        </button>
      </div>
    );
  }

  const handleSelect = (target: Target) => {
    selectTarget(target);
    setIsOpen(false);
  };

  const currentDomain = selectedTarget?.primary_domain || 'Select target';

  return (
    <div className="target-selector-container" ref={containerRef}>
      <button
        type="button"
        className="target-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Switch assessment target"
      >
        <span className="target-selector-label">TARGET:</span>
        <div className="target-selector-content">
          <span className="target-selector-domain">{currentDomain}</span>
          {selectedTarget?.name && (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
              ({selectedTarget.name})
            </span>
          )}
          {selectedTarget && (
            <StatusBadge
              label={selectedTarget.assessment_status}
              variant={getStatusVariant(selectedTarget.assessment_status)}
              showDot={false}
            />
          )}
        </div>
        <svg
          className={`target-selector-chevron ${isOpen ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="target-selector-dropdown" role="listbox">
          <div className="target-dropdown-header">
            <span>Assessment Targets ({targets.length})</span>
            <span style={{ fontSize: '0.65rem' }}>Active Scope</span>
          </div>

          <div className="target-dropdown-list">
            {targets.map((t) => {
              const isSelected = selectedTarget?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`target-dropdown-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(t)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="target-dropdown-item-info">
                    <span className="target-dropdown-item-domain">{t.primary_domain}</span>
                    <span className="target-dropdown-item-org">{t.name || 'Unspecified Organization'}</span>
                  </div>
                  <StatusBadge
                    label={t.assessment_status}
                    variant={getStatusVariant(t.assessment_status)}
                  />
                </button>
              );
            })}
          </div>

          <div className="target-dropdown-footer">
            <button
              type="button"
              className="target-dropdown-create-btn"
              onClick={() => {
                setIsOpen(false);
                openCreateModal();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + New Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
