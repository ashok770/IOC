import React, { useState } from 'react';
import { ExposureSignalComparisonResult } from '../../types/history';

interface Props {
  signals: ExposureSignalComparisonResult;
}

export const SignalChangesSection: React.FC<Props> = ({ signals }) => {
  const [showUnchanged, setShowUnchanged] = useState(false);

  const hasChanges = signals.new.length > 0 || signals.resolved.length > 0;

  return (
    <div className="change-section" aria-label="Exposure Signal Changes Section">
      <h3 className="change-section-title">
        EXPOSURE SIGNAL CHANGES
      </h3>

      {!hasChanges ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
          No exposure signal changes detected between these assessments.
        </div>
      ) : (
        <>
          {/* New Exposure Signals */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', marginBottom: '8px' }}>
              NEW EXPOSURE SIGNALS (⚠ {signals.new.length})
            </div>
            {signals.new.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                No new exposure signals detected.
              </div>
            ) : (
              <div className="change-list">
                {signals.new.map((item, idx) => (
                  <div key={`sig-new-${idx}`} className="change-item removed">
                    <div>
                      <strong>⚠ New exposure signal:</strong> {item.title}{' '}
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        [{item.severity}]
                      </span>
                    </div>
                    {item.asset_value && (
                      <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        Asset: {item.asset_value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Exposure Signals */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginBottom: '8px' }}>
              RESOLVED EXPOSURE SIGNALS (✓ {signals.resolved.length})
            </div>
            {signals.resolved.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                No resolved exposure signals detected.
              </div>
            ) : (
              <div className="change-list">
                {signals.resolved.map((item, idx) => (
                  <div key={`sig-res-${idx}`} className="change-item added">
                    <div>
                      <strong>✓ Resolved exposure signal:</strong> {item.title}{' '}
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        [{item.severity}]
                      </span>
                    </div>
                    {item.asset_value && (
                      <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        Asset: {item.asset_value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Unchanged Collapsible */}
      {signals.unchanged.length > 0 && (
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
            {showUnchanged ? '▼ Hide' : '► Show'} Unchanged Exposure Signals ({signals.unchanged.length})
          </button>
          {showUnchanged && (
            <div className="change-list" style={{ marginTop: '8px' }}>
              {signals.unchanged.map((item, idx) => (
                <div key={`sig-un-${idx}`} className="change-item unchanged">
                  <div>
                    {item.title} <span style={{ fontSize: '11px', color: '#64748b' }}>[{item.severity}]</span>
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
