import React, { useState } from 'react';
import { AssetComparisonResult } from '../../types/history';

interface Props {
  assets: AssetComparisonResult;
}

export const AssetChangesSection: React.FC<Props> = ({ assets }) => {
  const [showUnchanged, setShowUnchanged] = useState(false);

  return (
    <div className="change-section" aria-label="Asset Changes Section">
      <h3 className="change-section-title">
        ASSET CHANGES
      </h3>

      {/* New Assets */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginBottom: '8px' }}>
          NEW ASSETS (+{assets.added.length})
        </div>
        {assets.added.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No new assets detected between these assessments.
          </div>
        ) : (
          <div className="change-list">
            {assets.added.map((item, idx) => (
              <div key={`asset-add-${idx}`} className="change-item added">
                <div>
                  <strong>+ {item.value}</strong>{' '}
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>({item.asset_type})</span>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  Source: {item.source}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Removed Assets */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', marginBottom: '8px' }}>
          REMOVED ASSETS (-{assets.removed.length})
        </div>
        {assets.removed.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No removed assets detected between these assessments.
          </div>
        ) : (
          <div className="change-list">
            {assets.removed.map((item, idx) => (
              <div key={`asset-rem-${idx}`} className="change-item removed">
                <div>
                  <strong>- {item.value}</strong>{' '}
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>({item.asset_type})</span>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  Source: {item.source}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unchanged Collapsible */}
      {assets.unchanged.length > 0 && (
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
            {showUnchanged ? '▼ Hide' : '► Show'} Unchanged Assets ({assets.unchanged.length})
          </button>
          {showUnchanged && (
            <div className="change-list" style={{ marginTop: '8px' }}>
              {assets.unchanged.map((item, idx) => (
                <div key={`asset-un-${idx}`} className="change-item unchanged">
                  <div>
                    {item.value} <span style={{ fontSize: '11px', color: '#64748b' }}>({item.asset_type})</span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                    {item.source}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
