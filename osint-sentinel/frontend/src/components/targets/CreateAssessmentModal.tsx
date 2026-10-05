import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTarget } from '../../context/TargetContext';
import { targetApi } from '../../api';
import { validateDomainInput } from '../../utils/domainValidation';

export const CreateAssessmentModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, refreshTargets } = useTarget();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCreateModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, closeCreateModal]);

  if (!isCreateModalOpen) return null;

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDomainInput(val);
    setValidationError(null);
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    // 1. Client-side domain validation
    const validation = validateDomainInput(domainInput);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid domain syntax.');
      return;
    }

    const cleanDomain = validation.normalizedDomain || domainInput.trim().toLowerCase();
    const cleanOrg = orgName.trim() || undefined;

    setIsSubmitting(true);
    try {
      // 2. Submit to backend API
      const created = await targetApi.createTarget({
        primary_domain: cleanDomain,
        organization_name: cleanOrg,
      });

      // 3. Reset form, close modal, refresh target state and select new target
      setOrgName('');
      setDomainInput('');
      closeCreateModal();
      await refreshTargets(created.id);
      navigate('/overview');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to register assessment target.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setValidationError(null);
      setApiError(null);
      closeCreateModal();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <h2 className="modal-title">New Assessment Scope</h2>
            <p className="modal-subtitle">Register an authorized perimeter domain for external exposure evaluation.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="policy-notice">
              <strong>Authorized Scope Requirement:</strong> Assessments must only be executed against target assets
              with explicit authorization. Intelligence collection operates exclusively via passive public records.
            </div>

            <div className="form-group">
              <label htmlFor="target-org-name" className="form-label">
                <span>Organization Name</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
              </label>
              <input
                id="target-org-name"
                type="text"
                className="form-input"
                placeholder="e.g. Acme Corporation"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={isSubmitting}
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="target-primary-domain" className="form-label">
                <span>Primary Domain</span>
                <span className="form-label-required">* Required</span>
              </label>
              <input
                id="target-primary-domain"
                type="text"
                className={`form-input mono ${validationError || apiError ? 'error' : ''}`}
                placeholder="e.g. acme.com (no https://, paths, or ports)"
                value={domainInput}
                onChange={handleDomainChange}
                disabled={isSubmitting}
                autoFocus
                required
              />
              <span className="form-hint">
                Enter the fully qualified root domain (FQDN). Protocols (http://), IP addresses, and URLs are rejected.
              </span>
              {validationError && (
                <div className="form-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}
              {apiError && (
                <div className="form-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{apiError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !domainInput.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="banner-spinner" style={{ width: 14, height: 14 }} aria-hidden="true" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create Assessment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
