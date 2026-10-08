import React, { useState } from 'react';
import { IntelligenceNode, NodeType } from './IntelligenceNode';
import { RelationshipLine } from './RelationshipLine';
import './graph.css';

export interface EvidenceMarkerProps {
  label: string;
  source?: string;
  confidence?: number;
  id?: string;
}

export const EvidenceMarker: React.FC<EvidenceMarkerProps> = ({
  label,
  source = 'DNS_RECORD',
  confidence = 98,
  id,
}) => (
  <span id={id} className="ds-evidence-marker">
    <span>[{source}]</span>
    <span>{label}</span>
    <span style={{ opacity: 0.75 }}>({confidence}%)</span>
  </span>
);

export interface GraphLabelProps {
  children: React.ReactNode;
  id?: string;
}

export const GraphLabel: React.FC<GraphLabelProps> = ({ children, id }) => (
  <span id={id} className="ds-graph-label">
    {children}
  </span>
);

export const DataPoint: React.FC<{ id?: string }> = ({ id }) => (
  <span id={id} className="ds-datapoint" />
);

export interface ConnectionStateProps {
  state: 'active' | 'synced' | 'warning';
  label?: string;
  id?: string;
}

export const ConnectionState: React.FC<ConnectionStateProps> = ({
  state,
  label = 'ACTIVE RELATIONSHIP',
  id,
}) => {
  const color = state === 'active' ? '#2563EB' : state === 'synced' ? '#16A34A' : '#D97706';
  return (
    <span id={id} className="ds-connection-state" style={{ color }}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <span>{label}</span>
    </span>
  );
};

export const IntelligenceGraphDemo: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('domain-1');

  const nodes: Array<{ id: string; type: NodeType; label: string; sublabel: string; x: number; y: number }> = [
    { id: 'domain-1', type: 'Domain', label: 'example-target.org', sublabel: 'Apex Domain', x: 260, y: 50 },
    { id: 'host-1', type: 'Host', label: 'api.example-target.org', sublabel: 'Edge Host', x: 80, y: 150 },
    { id: 'ip-1', type: 'IP', label: '198.51.100.24', sublabel: 'Cloud Gateway', x: 440, y: 150 },
    { id: 'cert-1', type: 'Certificate', label: 'TLS Certificate Record', sublabel: 'Valid SAN', x: 80, y: 280 },
    { id: 'tech-1', type: 'Technology', label: 'Web Server Technology', sublabel: 'HTTP/2 Gateway', x: 260, y: 280 },
    { id: 'signal-1', type: 'Signal', label: 'External Exposure Signal', sublabel: 'Public Interface', x: 440, y: 280 },
  ];

  const relationships = [
    { from: 'domain-1', to: 'host-1', label: 'DNS CNAME', variant: 'cobalt' as const },
    { from: 'domain-1', to: 'ip-1', label: 'A RECORD', variant: 'cobalt' as const },
    { from: 'host-1', to: 'cert-1', label: 'TLS SNI', variant: 'indigo' as const },
    { from: 'host-1', to: 'tech-1', label: 'HEADER', variant: 'muted' as const },
    { from: 'ip-1', to: 'signal-1', label: 'PROVENANCE', variant: 'cobalt' as const },
  ];

  return (
    <div
      style={{
        width: '100%',
        minHeight: '380px',
        backgroundColor: '#111318',
        borderRadius: 'var(--ds-radius-card)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', top: '16px', right: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: '#9CA3AF', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
          [ILLUSTRATIVE EXAMPLE]
        </span>
        <ConnectionState state="active" label="LIVE ENTITY MAP" />
      </div>

      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {relationships.map((rel, idx) => {
          const n1 = nodes.find((n) => n.id === rel.from);
          const n2 = nodes.find((n) => n.id === rel.to);
          if (!n1 || !n2) return null;
          return (
            <RelationshipLine
              key={idx}
              x1={n1.x + 80}
              y1={n1.y + 24}
              x2={n2.x + 80}
              y2={n2.y + 24}
              colorVariant={rel.variant}
              label={rel.label}
              animated={false}
            />
          );
        })}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          style={{ position: 'absolute', left: `${node.x}px`, top: `${node.y}px`, zIndex: 5 }}
        >
          <IntelligenceNode
            type={node.type}
            label={node.label}
            sublabel={node.sublabel}
            active={activeNode === node.id}
            onClick={() => setActiveNode(node.id)}
          />
        </div>
      ))}
    </div>
  );
};
