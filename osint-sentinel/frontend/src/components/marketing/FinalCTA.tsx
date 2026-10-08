import React from 'react';
import { Link } from 'react-router-dom';

export const FinalCTA: React.FC = () => {
  return (
    <section className="marketing-section marketing-section-white" style={{ borderBottom: 'none' }}>
      <div className="marketing-container">
        <div className="final-cta-box">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--ds-font-sans, sans-serif)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#60A5FA',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#60A5FA',
              }}
            />
            AUTHORIZED ASSESSMENT PLATFORM
          </div>

          <h2 className="final-cta-headline">
            SEE WHAT THE INTERNET REVEALS ABOUT YOU.
          </h2>

          <p className="final-cta-sub">
            Begin an authorized external security assessment. Discover your organization's
            true public exposure with complete evidence provenance.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link
              to="/overview"
              className="final-cta-button"
              id="final-cta-button"
            >
              <span>START AN ASSESSMENT</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div
            style={{
              marginTop: '32px',
              fontSize: '0.8125rem',
              color: '#9CA3AF',
              fontFamily: 'var(--ds-font-mono, monospace)',
            }}
          >
            NON-INTRUSIVE • EVIDENCE-BACKED • DETERMINISTIC
          </div>
        </div>
      </div>
    </section>
  );
};
