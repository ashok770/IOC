import React from 'react';
import { EvidenceCard } from '../primitives/Card';
import { StatusType } from '../primitives/Badge';

export interface EvidenceItem {
  id: string;
  source: string;
  observation: string;
  provenance: string;
  timestamp: string;
  confidenceScore: number;
  status: StatusType;
}

interface EvidenceComponentProps {
  item: EvidenceItem;
  variant?: 'light' | 'dark' | 'intelligence';
  className?: string;
  style?: React.CSSProperties;
}

export const EvidenceComponent: React.FC<EvidenceComponentProps> = ({
  item,
  variant = 'light',
  className = '',
  style,
}) => {
  return (
    <div style={style} className={`ds-evidence-component-wrapper ${className}`.trim()}>
      <EvidenceCard
        source={item.source}
        observation={item.observation}
        provenance={item.provenance}
        timestamp={item.timestamp}
        confidenceScore={item.confidenceScore}
        status={item.status}
        variant={variant}
      />
    </div>
  );
};
