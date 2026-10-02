import React from 'react';
import { ExposureSignal, Asset } from '../../types';
import { ExposureTypeBadge } from './ExposureTypeBadge';

interface ExposureRowProps {
  signal: ExposureSignal;
  affectedAsset?: Asset;
  isSelected: boolean;
  onSelect: (signal: ExposureSignal) => void;
}

export const ExposureRow: React.FC<ExposureRowProps> = ({
  signal,
  affectedAsset,
  isSelected,
  onSelect,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(signal);
    }
  };

  const assetDisplay =
    affectedAsset?.value ||
    (signal.extra_data?.hostname as string) ||
    (signal.extra_data?.referenced_entity as string) ||
    (signal.asset_id ? `Asset ${signal.asset_id.slice(0, 8)}...` : 'Target Scope');

  const assetTypeDisplay = affectedAsset?.asset_type || (signal.extra_data?.role as string) || '';

  return (
    <tr
      className={`exposure-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(signal)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
      aria-label={`Exposure signal: ${signal.title}`}
    >
      {/* Signal Type & Title */}
      <td>
        <div className="signal-title-cell">
          <div>
            <ExposureTypeBadge type={signal.signal_type} />
          </div>
          <span className="signal-title-text">{signal.title}</span>
          <span className="signal-desc-preview">{signal.description}</span>
        </div>
      </td>

      {/* Affected Asset */}
      <td>
        <div className="signal-asset-cell">
          <span>{assetDisplay}</span>
          {assetTypeDisplay && (
            <span className="signal-asset-sub">{assetTypeDisplay.replace(/_/g, ' ')}</span>
          )}
        </div>
      </td>

      {/* Observation Confidence */}
      <td>
        <span
          className="signal-confidence-cell"
          title="Factual observation confidence derived deterministically."
        >
          {signal.confidence !== undefined ? signal.confidence.toFixed(2) : '1.00'}
        </span>
      </td>

      {/* Severity */}
      <td>
        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-surface-elevated)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 600,
          }}
        >
          {signal.severity || 'info'}
        </span>
      </td>
    </tr>
  );
};
