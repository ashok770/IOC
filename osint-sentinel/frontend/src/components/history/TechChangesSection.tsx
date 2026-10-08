import React, { useState } from 'react';
import { TechnologyComparisonResult } from '../../types/history';

interface Props {
  technologies: TechnologyComparisonResult;
}

export const TechChangesSection: React.FC<Props> = ({ technologies }) => {
  const [showUnchanged, setShowUnchanged] = useState(false);

  const hasChanges =
    technologies.added.length > 0 ||
    technologies.removed.length > 0 ||
    technologies.version_changes.length > 0;

  return (
    <div className="change-section" aria-label="Technology Changes Section">
      <h3 className="change-section-title">
        TECHNOLOGY CHANGES
      </h3>

      {!hasChanges ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
          No technology changes detected between these assessments.
        </div>
      ) : (
        <>
          {/* Version Changes */}
          {technologies.version_changes.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8', marginBottom: '8px' }}>
                VERSION UPDATES ({technologies.version_changes.length})
              </div>
              <div className="change-list">
                {technologies.version_changes.map((item, idx) => (
                  <div key={`tech-ver-${idx}`} className="change-item changed">
                    <div>
                      <strong>{item.technology}</strong>{' '}
                      {item.asset_value && <span style={{ fontSize: '11px', opacity: 0.8 }}>({item.asset_value})</span>}
                    </div>
                    <div className="tech-version-pill">
                      <span>{item.previous_version || 'unknown'}</span>
                      <span>→</span>
                      <span>{item.current_version || 'unknown'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Technologies */}
          {technologies.added.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginBottom: '8px' }}>
                NEW TECHNOLOGIES (+{technologies.added.length})
              </div>
              <div className="change-list">
                {technologies.added.map((item, idx) => (
                  <div key={`tech-add-${idx}`} className="change-item added">
                    <div>
                      <strong>+ {item.name}</strong>{' '}
                      {item.version && <span style={{ fontSize: '11px' }}>v{item.version}</span>}{' '}
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>[{item.category}]</span>
                    </div>
                    {item.asset_value && (
                      <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        Asset: {item.asset_value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Technologies */}
          {technologies.removed.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', marginBottom: '8px' }}>
                REMOVED TECHNOLOGIES (-{technologies.removed.length})
              </div>
              <div className="change-list">
                {technologies.removed.map((item, idx) => (
                  <div key={`tech-rem-${idx}`} className="change-item removed">
                    <div>
                      <strong>- {item.name}</strong>{' '}
                      {item.version && <span style={{ fontSize: '11px' }}>v{item.version}</span>}{' '}
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>[{item.category}]</span>
                    </div>
                    {item.asset_value && (
                      <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        Asset: {item.asset_value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Unchanged Collapsible */}
      {technologies.unchanged.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => setShowUnchanged(!showUnchanged)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {showUnchanged ? '▼ Hide' : '► Show'} Unchanged Technologies ({technologies.unchanged.length})
          </button>
          {showUnchanged && (
            <div className="change-list" style={{ marginTop: '8px' }}>
              {technologies.unchanged.map((item, idx) => (
                <div key={`tech-un-${idx}`} className="change-item unchanged">
                  <div>
                    {item.name} {item.version && <span style={{ fontSize: '11px' }}>v{item.version}</span>}{' '}
                    <span style={{ fontSize: '11px', color: '#64748b' }}>[{item.category}]</span>
                  </div>
                  {item.asset_value && (
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                      {item.asset_value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
