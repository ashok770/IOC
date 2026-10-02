import React from 'react';
import { Technology, Asset } from '../../types';
import { TechnologyCategoryBadge } from './TechnologyCategoryBadge';

interface TechnologyRowProps {
  tech: Technology;
  associatedAsset?: Asset;
  isSelected: boolean;
  onSelect: (tech: Technology) => void;
}

const formatMethodLabel = (method: string): string => {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatDate = (isoStr?: string | null): string => {
  if (!isoStr) return '--';
  try {
    const d = new Date(isoStr);
    return d.toISOString().split('T')[0] + ' ' + d.toTimeString().slice(0, 5) + ' UTC';
  } catch {
    return isoStr;
  }
};

export const TechnologyRow: React.FC<TechnologyRowProps> = ({
  tech,
  associatedAsset,
  isSelected,
  onSelect,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(tech);
    }
  };

  return (
    <tr
      className={`technology-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(tech)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
    >
      {/* Technology & Version */}
      <td>
        <div className="tech-name-cell">
          <span className="tech-name-text">{tech.name}</span>
          {tech.version ? (
            <span className="tech-version-pill">v{tech.version}</span>
          ) : (
            <span className="tech-version-none">Version: Not observed</span>
          )}
        </div>
      </td>

      {/* Category */}
      <td>
        <TechnologyCategoryBadge category={tech.category} />
      </td>

      {/* Observed On (Asset) */}
      <td>
        <div className="tech-asset-cell">
          <span>{associatedAsset ? associatedAsset.value : 'Target Domain'}</span>
          {associatedAsset && (
            <span className="tech-asset-sub">{associatedAsset.asset_type.replace(/_/g, ' ')}</span>
          )}
        </div>
      </td>

      {/* Detection Method */}
      <td>
        <span className="tech-method-badge">
          {formatMethodLabel(tech.detection_method)}
        </span>
      </td>

      {/* Observation Confidence */}
      <td>
        <span
          className="tech-confidence-cell"
          title={`Observation Confidence: ${(tech.confidence * 100).toFixed(0)}% (Factual detection)`}
        >
          {tech.confidence.toFixed(2)}
        </span>
      </td>

      {/* Last Observed */}
      <td>
        <span className="tech-date-cell">
          {formatDate(tech.last_seen || tech.first_seen)}
        </span>
      </td>
    </tr>
  );
};
