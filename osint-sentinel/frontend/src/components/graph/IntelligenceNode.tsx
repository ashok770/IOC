import React from 'react';
import './graph.css';

export type NodeType =
  | 'Domain'
  | 'Host'
  | 'IP'
  | 'Certificate'
  | 'Technology'
  | 'Evidence'
  | 'Dependency'
  | 'Signal';

export interface IntelligenceNodeProps {
  type: NodeType;
  label: string;
  sublabel?: string;
  active?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'Domain':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'Host':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      );
    case 'IP':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'Certificate':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'Technology':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'Evidence':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'Dependency':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );
    case 'Signal':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    default:
      return null;
  }
};

export const IntelligenceNode: React.FC<IntelligenceNodeProps> = ({
  type,
  label,
  sublabel,
  active = false,
  highlighted = false,
  onClick,
  className = '',
  style,
  id,
}) => {
  const activeClass = active ? 'ds-graph-node-active' : highlighted ? 'ds-graph-node-highlighted' : '';
  return (
    <div
      id={id}
      style={style}
      onClick={onClick}
      className={`ds-graph-node ${activeClass} ${className}`.trim()}
    >
      <span className="ds-node-icon">{getNodeIcon(type)}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="ds-node-type-label">{type}</span>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {sublabel && <span style={{ fontSize: '0.6875rem', opacity: 0.65 }}>{sublabel}</span>}
      </div>
    </div>
  );
};
