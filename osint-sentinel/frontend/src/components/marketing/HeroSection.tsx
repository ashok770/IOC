import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IntelligenceNode, NodeType } from '../graph/IntelligenceNode';
import { RelationshipLine } from '../graph/RelationshipLine';
import { ConnectionState } from '../graph/GraphPrimitives';

export const HeroSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('node-domain');

  // Hero Relationship Entity Graph data (Distinctive intelligence relationship composition)
  const nodes: Array<{
    id: string;
    type: NodeType;
    label: string;
    sublabel: string;
    x: number;
    y: number;
  }> = [
    { id: 'node-domain', type: 'Domain', label: 'target-organization.com', sublabel: 'Apex Domain', x: 200, y: 30 },
    { id: 'node-host', type: 'Host', label: 'api.target-organization.com', sublabel: 'Edge Gateway Host', x: 30, y: 130 },
    { id: 'node-ip', type: 'IP', label: '198.51.100.42', sublabel: 'Public Anycast IPv4', x: 370, y: 130 },
    { id: 'node-cert', type: 'Certificate', label: 'TLS Wildcard Certificate', sublabel: 'Let\'s Encrypt SAN', x: 30, y: 240 },
    { id: 'node-tech', type: 'Technology', label: 'Nginx 1.24 / HTTP/2', sublabel: 'Web Server Header', x: 200, y: 240 },
    { id: 'node-signal', type: 'Signal', label: 'Public Exposure Signal', sublabel: 'Exposed Management UI', x: 370, y: 240 },
    { id: 'node-evidence', type: 'Evidence', label: 'DNS A Record Prov.', sublabel: 'Query ID #84920', x: 110, y: 340 },
    { id: 'node-dep', type: 'Dependency', label: 'Auth0 Identity Provider', sublabel: 'External SaaS Dependency', x: 290, y: 340 },
  ];

  const relationships = [
    { from: 'node-domain', to: 'node-host', label: 'DNS CNAME', variant: 'cobalt' as const },
    { from: 'node-domain', to: 'node-ip', label: 'A RECORD', variant: 'cobalt' as const },
    { from: 'node-host', to: 'node-cert', label: 'TLS SNI', variant: 'indigo' as const },
    { from: 'node-host', to: 'node-tech', label: 'HTTP HEADER', variant: 'muted' as const },
    { from: 'node-ip', to: 'node-signal', label: 'PROVENANCE', variant: 'cobalt' as const },
    { from: 'node-cert', to: 'node-evidence', label: 'CT LOG', variant: 'muted' as const },
    { from: 'node-tech', to: 'node-dep', label: 'INTEGRATION', variant: 'indigo' as const },
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
              className="final-cta-button"
              id="hero-primary-cta"
            >
              <span>START AN ASSESSMENT</span>
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#product"
              className="marketing-nav-cta"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--ds-color-graphite, #111827)',
                border: '1px solid var(--ds-color-border-neutral, #E5E7EB)',
              }}
              id="hero-secondary-cta"
            >
              EXPLORE THE PLATFORM
            </a>
          </div>

          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '0.8125rem',
              color: 'var(--ds-color-text-muted, #6B7280)',
              fontFamily: 'var(--ds-font-mono, monospace)',
            }}
          >
            <span>• PASSIVE-FIRST</span>
            <span>• FACTUAL PROVENANCE</span>
            <span>• DETERMINISTIC CONTEXT</span>
          </div>
        </div>

        {/* Right Column: Distinctive Intelligence Relationship Composition */}
        <div className="hero-visual-card">
          <div className="hero-visual-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="marketing-illustrative-tag">[ILLUSTRATIVE EXAMPLE]</span>
            </div>
            <ConnectionState state="active" label="ENTITY RELATIONSHIP GRAPH" />
          </div>

          {/* SVG Map Canvas */}
          <div
            style={{
              width: '100%',
              height: '430px',
              backgroundColor: '#111318',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Vector Connector Lines */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox="0 0 540 430"
              preserveAspectRatio="xMidYMid meet"
            >
              {relationships.map((rel, idx) => {
                const n1 = nodes.find((n) => n.id === rel.from);
                const n2 = nodes.find((n) => n.id === rel.to);
                if (!n1 || !n2) return null;
                return (
                  <RelationshipLine
                    key={idx}
                    x1={n1.x + 65}
                    y1={n1.y + 20}
                    x2={n2.x + 65}
                    y2={n2.y + 20}
                    colorVariant={rel.variant}
                    label={rel.label}
                    animated={false}
                  />
                );
              })}
            </svg>

            {/* Entity Nodes */}
            <div
              style={{
                position: 'relative',
                width: '540px',
                height: '430px',
                transformOrigin: 'top left',
              }}
            >
              {nodes.map((node) => (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    zIndex: 5,
                    transform: 'scale(0.88)',
                    transformOrigin: 'top left',
                  }}
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
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              fontSize: '0.75rem',
              color: 'var(--ds-color-text-muted, #6B7280)',
            }}
          >
            <span>8 Connected Entity Types</span>
            <span style={{ fontFamily: 'var(--ds-font-mono)' }}>Deterministic Correlation Engine</span>
          </div>
        </div>
      </div>
    </section>
  );
};
