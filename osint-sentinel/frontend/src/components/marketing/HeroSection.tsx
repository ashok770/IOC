import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IntelligenceNode, NodeType } from '../graph/IntelligenceNode';
import { RelationshipLine } from '../graph/RelationshipLine';
import { ConnectionState } from '../graph/GraphPrimitives';

export const HeroSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('node-domain');

  // Streamlined 5-6 Node Hierarchy for maximum clarity:
  // Root Domain -> Host + IP -> Technology + Signal -> Evidence
  const nodes: Array<{
    id: string;
    type: NodeType;
    label: string;
    sublabel: string;
    size: 'lg' | 'md' | 'sm' | 'xs';
    x: number;
    y: number;
  }> = [
    {
      id: 'node-domain',
      type: 'Domain',
      label: 'example.org',
      sublabel: 'Apex Domain',
      size: 'lg',
      x: 180,
      y: 18,
    },
    {
      id: 'node-host',
      type: 'Host',
      label: 'api.example.org',
      sublabel: 'Observed Host',
      size: 'md',
      x: 38,
      y: 114,
    },
    {
      id: 'node-ip',
      type: 'IP',
      label: '203.0.113.24',
      sublabel: 'Public Address',
      size: 'md',
      x: 338,
      y: 114,
    },
    {
      id: 'node-tech',
      type: 'Technology',
      label: 'nginx',
      sublabel: 'HTTP Header',
      size: 'sm',
      x: 48,
      y: 212,
    },
    {
      id: 'node-signal',
      type: 'Signal',
      label: 'Development Host',
      sublabel: 'Exposure Signal',
      size: 'xs',
      x: 338,
      y: 214,
    },
    {
      id: 'node-evidence',
      type: 'Evidence',
      label: 'Server Header',
      sublabel: 'Observed Evidence',
      size: 'sm',
      x: 178,
      y: 294,
    },
  ];

  const relationships = [
    {
      from: 'node-domain',
      to: 'node-host',
      x1: 228,
      y1: 62,
      x2: 142,
      y2: 114,
      label: 'DNS',
      variant: 'cobalt' as const,
    },
    {
      from: 'node-domain',
      to: 'node-ip',
      x1: 292,
      y1: 62,
      x2: 378,
      y2: 114,
      label: 'A RECORD',
      variant: 'cobalt' as const,
    },
    {
      from: 'node-host',
      to: 'node-tech',
      x1: 112,
      y1: 154,
      x2: 112,
      y2: 212,
      label: 'HTTP HEADER',
      variant: 'muted' as const,
    },
    {
      from: 'node-ip',
      to: 'node-signal',
      x1: 408,
      y1: 154,
      x2: 408,
      y2: 214,
      label: 'DERIVED SIGNAL',
      variant: 'cobalt' as const,
    },
    {
      from: 'node-tech',
      to: 'node-evidence',
      x1: 145,
      y1: 248,
      x2: 215,
      y2: 294,
      label: 'OBSERVATION',
      variant: 'muted' as const,
    },
  ];

  return (
    <section className="marketing-section" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
      <div className="marketing-container hero-wrapper">
        {/* Left Column: Hero Editorial Messaging */}
        <div className="hero-copy">
          <div className="marketing-eyebrow" id="hero-eyebrow">
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--ds-color-cobalt, #2563EB)',
              }}
            />
            EXTERNAL SECURITY INTELLIGENCE
          </div>

          <h1 className="hero-title">
            SEE WHAT THE INTERNET REVEALS ABOUT YOU.
          </h1>

          <p className="hero-description">
            Evidence-driven external security intelligence for authorized assessments.
            Discover public assets, technologies, relationships, dependencies, and exposure
            signals — with the evidence behind every observation.
          </p>

          <div className="hero-actions">
            <Link
              to="/overview"
              className="hero-primary-cta"
              id="hero-primary-cta"
            >
              <span>START AN ASSESSMENT</span>
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#product"
              className="hero-secondary-cta"
              id="hero-secondary-cta"
            >
              EXPLORE THE PLATFORM
            </a>
          </div>

          <div className="hero-principles-row">
            <span>PASSIVE-FIRST</span>
            <span className="hero-principle-dot" aria-hidden="true">•</span>
            <span>FACTUAL PROVENANCE</span>
            <span className="hero-principle-dot" aria-hidden="true">•</span>
            <span>DETERMINISTIC CONTEXT</span>
          </div>
        </div>

        {/* Right Column: Refined Intelligence Relationship Graph */}
        <div className="hero-visual-card">
          <div className="hero-visual-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="marketing-illustrative-tag">[ILLUSTRATIVE EXAMPLE]</span>
            </div>
            <ConnectionState state="active" label="ENTITY RELATIONSHIP GRAPH" />
          </div>

          {/* Responsive Graph Canvas */}
          <div className="hero-graph-surface">
            {/* Vector Connector Lines */}
            <svg
              className="hero-graph-svg"
              viewBox="0 0 520 360"
              preserveAspectRatio="xMidYMid meet"
            >
              {relationships.map((rel, idx) => (
                <RelationshipLine
                  key={idx}
                  x1={rel.x1}
                  y1={rel.y1}
                  x2={rel.x2}
                  y2={rel.y2}
                  colorVariant={rel.variant}
                  label={rel.label}
                  animated={false}
                />
              ))}
            </svg>

            {/* Entity Nodes Layer */}
            <div className="hero-graph-nodes-layer">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="hero-graph-node-wrapper"
                  style={{
                    left: `${(node.x / 520) * 100}%`,
                    top: `${(node.y / 360) * 100}%`,
                    zIndex: 5,
                  }}
                >
                  <IntelligenceNode
                    type={node.type}
                    label={node.label}
                    sublabel={node.sublabel}
                    size={node.size}
                    active={activeNode === node.id}
                    onClick={() => setActiveNode(node.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual-footer">
            <span>5 Connected Entity Types</span>
            <span className="hero-footer-engine">Evidence-Based Correlation</span>
          </div>
        </div>
      </div>
    </section>
  );
};
