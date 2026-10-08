import React, { useState } from 'react';
import { Logo } from '../components/brand/Logo';
import {
  DisplayXL,
  DisplayLarge,
  DisplayMedium,
  HeadingXL,
  HeadingLarge,
  HeadingMedium,
  HeadingSmall,
  BodyLarge,
  BodyMedium,
  BodySmall,
  Label,
  Caption,
  TechnicalMono,
} from '../design/typography/Typography';
import {
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  TextButton,
} from '../components/primitives/Button';
import { StatusBadge, PillBadge, TechnicalTag } from '../components/primitives/Badge';
import {
  SurfaceCard,
  FeatureCard,
  EvidenceCard,
  MetricCard,
  IntelligenceCard,
} from '../components/primitives/Card';
import {
  WarmPaperSurface,
  WhiteSurface,
  SoftBlueSurface,
  DarkSurface,
  IntelligenceSurface,
} from '../components/surfaces/Surface';
import { EvidenceComponent } from '../components/intelligence/EvidenceComponent';
import { IntelligenceNode } from '../components/graph/IntelligenceNode';
import { RelationshipLine } from '../components/graph/RelationshipLine';
import {
  EvidenceMarker,
  GraphLabel,
  DataPoint,
  ConnectionState,
  IntelligenceGraphDemo,
} from '../components/graph/GraphPrimitives';

import '../design/tokens/design-tokens.css';
import '../design/typography/typography.css';
import '../design/motion/motion.css';

export const DesignSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeSurfaceVariant, setActiveSurfaceVariant] = useState<'paper' | 'white' | 'softblue' | 'dark' | 'intelligence'>('paper');

  const navItems = [
    { id: 'all', label: 'Overview' },
    { id: 'brand', label: '1. Brand' },
    { id: 'typography', label: '2. Typography' },
    { id: 'color', label: '3. Color' },
    { id: 'surfaces', label: '4. Surfaces' },
    { id: 'buttons', label: '5. Buttons' },
    { id: 'cards', label: '6. Cards' },
    { id: 'badges', label: '7. Badges' },
    { id: 'evidence', label: '8. Evidence' },
    { id: 'graph', label: '9. Graph Map' },
    { id: 'motion', label: '10. Motion' },
    { id: 'responsive', label: '11. Audit' },
  ];

  const shouldShow = (id: string) => activeTab === 'all' || activeTab === id;

  return (
    <div style={{ backgroundColor: '#F7F7F4', color: '#111827', minHeight: '100vh', fontFamily: 'var(--ds-font-sans)' }}>
      {/* Editorial Header Bar */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '20px 40px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Logo variant="full" />
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#EEF4FF',
              color: '#2563EB',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            EDITORIAL DESIGN SYSTEM
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Caption style={{ color: '#6B7280' }}>Visual Identity Guidelines</Caption>
        </div>
      </header>

      {/* Editorial Navigation Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '10px 40px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              backgroundColor: activeTab === item.id ? '#111827' : 'transparent',
              color: activeTab === item.id ? '#FFFFFF' : '#4B5563',
              border: '1px solid transparent',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Document Body */}
      <div style={{ padding: '40px 40px 80px 40px', maxWidth: '1280px', margin: '0 auto' }}>

        {/* 1. BRAND & LOGO TREATMENT */}
        {shouldShow('brand') && (
          <section style={{ marginBottom: '80px' }} id="brand-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 01</Label>
              <HeadingXL>1. Brand Identity & Logo Variations</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              The OSINT Sentinel logo embodies Geometric Precision and Connected Intelligence Relationships. Reworked in Cobalt (#2563EB) and Indigo (#4F46E5) without noisy gradients.
            </BodyLarge>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Primary Light Logo */}
              <div style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '20px' }}>PRIMARY LIGHT BACKGROUND</Label>
                <Logo variant="full" />
              </div>

              {/* Horizontal Logo */}
              <div style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '20px' }}>HORIZONTAL COMPACT LOGO</Label>
                <Logo variant="horizontal" />
              </div>

              {/* Symbol Only */}
              <div style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '20px' }}>GEOMETRIC S SYMBOL ONLY</Label>
                <Logo variant="symbol" />
              </div>

              {/* Obsidian Dark Version */}
              <div style={{ padding: '28px', backgroundColor: '#111318', color: '#FFFFFF', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Label style={{ color: '#9CA3AF', display: 'block', marginBottom: '20px' }}>WHITE ON OBSIDIAN SURFACE</Label>
                <Logo variant="monochrome-light" />
              </div>

              {/* Monochrome Graphite */}
              <div style={{ padding: '28px', backgroundColor: '#F7F7F4', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '20px' }}>MONOCHROME GRAPHITE</Label>
                <Logo variant="monochrome-dark" />
              </div>

              {/* Small Mark */}
              <div style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '20px' }}>FAVICON & SMALL MARKS</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <Logo variant="small" size={24} />
                  <Logo variant="small" size={32} />
                  <Logo variant="small" size={40} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. TYPOGRAPHY */}
        {shouldShow('typography') && (
          <section style={{ marginBottom: '80px' }} id="typography-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 02</Label>
              <HeadingXL>2. Editorial Typography Hierarchy</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              High-contrast Graphite headings against Warm Paper surfaces give the brand an authoritative editorial character. Monospace type is strictly reserved for technical data identifiers.
            </BodyLarge>

            <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>DISPLAY XL — 56px / BOLD (EDITORIAL HEADLINE)</Label>
                <DisplayXL style={{ color: '#111827' }}>SEE WHAT THE INTERNET REVEALS ABOUT YOU.</DisplayXL>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>DISPLAY LARGE — 44px / BOLD</Label>
                <DisplayLarge style={{ color: '#111827' }}>External Security Intelligence Platform</DisplayLarge>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>DISPLAY MEDIUM — 36px / SEMIBOLD</Label>
                <DisplayMedium style={{ color: '#111827' }}>Continuous Infrastructure Correlation</DisplayMedium>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>HEADING XL — 30px / BOLD</Label>
                <HeadingXL style={{ color: '#111827' }}>Asset Relationship Mapping & Surface Analysis</HeadingXL>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>HEADING LARGE & MEDIUM — 24px / 20px</Label>
                <HeadingLarge style={{ color: '#111827' }}>Discovered Exposure Points & Infrastructure Signals</HeadingLarge>
                <HeadingMedium style={{ color: '#374151', marginTop: '8px' }}>Verified Provenance & Technical Metadata</HeadingMedium>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>HEADING SMALL & BODY LARGE — 18px</Label>
                <HeadingSmall style={{ color: '#111827' }}>Subdomain Enumeration & TLS Handshake Inspection</HeadingSmall>
                <BodyLarge style={{ color: '#374151', marginTop: '8px' }}>
                  OSINT Sentinel delivers clear, calm visibility into exposed technical infrastructure, correlation pathways, and external vulnerability signals without noise or hype.
                </BodyLarge>
              </div>

              <div>
                <Label style={{ color: '#6B7280', marginBottom: '8px', display: 'block' }}>TECHNICAL MONOSPACE (TECHNICAL METADATA ONLY)</Label>
                <TechnicalMono style={{ color: '#2563EB', backgroundColor: '#EEF4FF', padding: '6px 12px', borderRadius: '6px' }}>
                  domain: example-target.org [A RECORD -&gt; 198.51.100.24] tls: VALID_SAN
                </TechnicalMono>
              </div>
            </div>
          </section>
        )}

        {/* 3. COLOR PALETTE */}
        {shouldShow('color') && (
          <section style={{ marginBottom: '80px' }} id="color-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 03</Label>
              <HeadingXL>3. Editorial Color Palette & Distribution</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Color usage rule: 70–80% Warm Paper & White, 10–15% Graphite & Obsidian, 5–10% Cobalt & Indigo punctuation.
            </BodyLarge>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ padding: '20px', backgroundColor: '#F7F7F4', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <Label style={{ color: '#6B7280' }}>WARM PAPER</Label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', color: '#111827' }}>#F7F7F4</div>
                <Caption style={{ color: '#6B7280' }}>Primary Editorial Surface</Caption>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <Label style={{ color: '#6B7280' }}>PURE WHITE</Label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', color: '#111827' }}>#FFFFFF</div>
                <Caption style={{ color: '#6B7280' }}>Secondary Surface / Cards</Caption>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '12px' }}>
                <Label style={{ color: '#9CA3AF' }}>GRAPHITE</Label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px' }}>#111827</div>
                <Caption style={{ color: '#9CA3AF' }}>High Contrast Typography</Caption>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#2563EB', color: '#FFFFFF', borderRadius: '12px' }}>
                <Label style={{ color: 'rgba(255,255,255,0.8)' }}>COBALT</Label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px' }}>#2563EB</div>
                <Caption style={{ color: 'rgba(255,255,255,0.8)' }}>Primary Brand Accent</Caption>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '12px' }}>
                <Label style={{ color: 'rgba(255,255,255,0.8)' }}>INDIGO</Label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px' }}>#4F46E5</div>
                <Caption style={{ color: 'rgba(255,255,255,0.8)' }}>Secondary Accent</Caption>
              </div>
            </div>

            {/* Semantic Palette */}
            <Label style={{ color: '#6B7280', marginBottom: '12px', display: 'block' }}>RESTRAINED SEMANTIC STATES</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'rgba(22, 163, 74, 0.08)', color: '#16A34A', borderRadius: '8px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                <div style={{ fontWeight: 700 }}>Success</div>
                <Caption style={{ color: '#16A34A' }}>#16A34A</Caption>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'rgba(217, 119, 6, 0.08)', color: '#D97706', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                <div style={{ fontWeight: 700 }}>Attention</div>
                <Caption style={{ color: '#D97706' }}>#D97706</Caption>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'rgba(234, 88, 12, 0.08)', color: '#EA580C', borderRadius: '8px', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                <div style={{ fontWeight: 700 }}>Warning</div>
                <Caption style={{ color: '#EA580C' }}>#EA580C</Caption>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                <div style={{ fontWeight: 700 }}>Critical</div>
                <Caption style={{ color: '#DC2626' }}>#DC2626</Caption>
              </div>
            </div>
          </section>
        )}

        {/* 4. SURFACES & TEXTURES */}
        {shouldShow('surfaces') && (
          <section style={{ marginBottom: '80px' }} id="surfaces-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <div>
                <Label style={{ color: '#2563EB', display: 'block' }}>SYSTEM SPECIFICATION 04</Label>
                <HeadingXL>4. Surface Families & Subtle Textures</HeadingXL>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['paper', 'white', 'softblue', 'dark', 'intelligence'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveSurfaceVariant(v)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: activeSurfaceVariant === v ? '#111827' : '#FFFFFF',
                      color: activeSurfaceVariant === v ? '#FFFFFF' : '#374151',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Preview: {v}
                  </button>
                ))}
              </div>
            </div>

            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Sections alternate intentionally across Warm Paper, White, Soft Blue, Obsidian, and Intelligence grid surfaces. Currently toggled: <strong>{activeSurfaceVariant.toUpperCase()}</strong>
            </BodyLarge>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Surface 1: Warm Paper */}
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                <WarmPaperSurface>
                  <div>
                    <Label style={{ color: '#6B7280' }}>PRIMARY SURFACE: WARM PAPER (#F7F7F4)</Label>
                    <HeadingLarge style={{ marginTop: '8px' }}>Editorial Reading & Platform Narrative</HeadingLarge>
                    <BodyMedium style={{ color: '#374151', marginTop: '8px', maxWidth: '640px' }}>
                      Clean warm paper backdrop providing authoritative reading clarity and premium technology publication feel.
                    </BodyMedium>
                  </div>
                </WarmPaperSurface>
              </div>

              {/* Surface 2: White */}
              <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <WhiteSurface>
                  <div>
                    <Label style={{ color: '#6B7280' }}>SECONDARY SURFACE: PURE WHITE (#FFFFFF)</Label>
                    <HeadingLarge style={{ marginTop: '8px' }}>Product Feature Breakdown & Specifications</HeadingLarge>
                    <BodyMedium style={{ color: '#374151', marginTop: '8px', maxWidth: '640px' }}>
                      High-contrast clean white section designed to isolate product features, code snippets, and evidence models.
                    </BodyMedium>
                  </div>
                </WhiteSurface>
              </div>

              {/* Surface 3: Soft Blue */}
              <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <SoftBlueSurface>
                  <div>
                    <Label style={{ color: '#2563EB' }}>SUPPORTING SURFACE: SOFT BLUE (#EEF4FF)</Label>
                    <HeadingLarge style={{ marginTop: '8px' }}>Supported Technical Standard & Evidence Models</HeadingLarge>
                    <BodyMedium style={{ color: '#374151', marginTop: '8px', maxWidth: '640px' }}>
                      Calm blue accent surface designed for transition calls to action and evidence architecture overviews.
                    </BodyMedium>
                  </div>
                </SoftBlueSurface>
              </div>

              {/* Surface 4: Obsidian */}
              <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <DarkSurface>
                  <div>
                    <Label style={{ color: '#60A5FA' }}>DARK TECHNICAL SURFACE: OBSIDIAN (#111318)</Label>
                    <HeadingLarge style={{ marginTop: '8px', color: '#FFFFFF' }}>Live Intelligence Map & Correlation Command</HeadingLarge>
                    <BodyMedium style={{ color: '#9CA3AF', marginTop: '8px', maxWidth: '640px' }}>
                      Deep technical obsidian surface for entity correlation graph maps, telemetry visualization, and command demonstrations.
                    </BodyMedium>
                  </div>
                </DarkSurface>
              </div>

              {/* Surface 5: Intelligence Grid */}
              <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <IntelligenceSurface>
                  <div>
                    <Label style={{ color: '#2563EB' }}>INTELLIGENCE GRID SURFACE (#0D0F14 + GRID)</Label>
                    <HeadingLarge style={{ marginTop: '8px', color: '#FFFFFF' }}>Technical Entity Map Grid Backdrop</HeadingLarge>
                  </div>
                </IntelligenceSurface>
              </div>
            </div>
          </section>
        )}

        {/* 5. BUTTONS */}
        {shouldShow('buttons') && (
          <section style={{ marginBottom: '80px' }} id="buttons-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 05</Label>
              <HeadingXL>5. Button System & Controls</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Solid Graphite and Cobalt controls. No glowing gradients. Controlled 8px geometry with subtle 2px hover translation.
            </BodyLarge>

            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '16px' }}>PRIMARY BUTTONS (GRAPHITE & COBALT)</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  <PrimaryButton iconRight="→">START AN ASSESSMENT</PrimaryButton>
                  <PrimaryButton variantStyle="cobalt" iconRight="→">EXPLORE PLATFORM</PrimaryButton>
                  <PrimaryButton size="sm">COMPACT ACTION</PrimaryButton>
                  <PrimaryButton size="lg" iconRight="→">LARGE ACTION</PrimaryButton>
                  <PrimaryButton disabled>DISABLED STATE</PrimaryButton>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '16px' }}>SECONDARY & TERTIARY CONTROLS</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  <SecondaryButton iconRight="→">VIEW ARCHITECTURE</SecondaryButton>
                  <TertiaryButton>TECHNICAL SPECIFICATION</TertiaryButton>
                  <TextButton iconRight="→">LEARN MORE</TextButton>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. CARDS */}
        {shouldShow('cards') && (
          <section style={{ marginBottom: '80px' }} id="cards-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 06</Label>
              <HeadingXL>6. Quieter Card System & Containers</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Cards feature white surfaces, 1px neutral borders, soft shadows, and clean geometry without glowing borders or heavy drop shadows.
            </BodyLarge>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* SurfaceCard Container */}
              <SurfaceCard variant="light" interactive style={{ padding: '24px' }}>
                <Label style={{ color: '#2563EB' }}>SURFACE CONTAINER</Label>
                <HeadingMedium style={{ marginTop: '8px', color: '#111827' }}>Base Card Container</HeadingMedium>
                <BodySmall style={{ color: '#4B5563', marginTop: '4px' }}>Clean white base wrapper with subtle 1px border.</BodySmall>
              </SurfaceCard>

              {/* Feature Card */}
              <FeatureCard
                variant="light"
                tag="COLLECTION ENGINE"
                title="Passive Asset Intelligence"
                description="Discovers all external domain endpoints, public DNS records, and host associations via authorized passive sources."
                visual={
                  <div style={{ color: '#2563EB', fontWeight: 600, fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem' }}>
                    [PASSIVE_COLLECTOR]
                  </div>
                }
              />

              {/* Metric Card */}
              <MetricCard
                variant="light"
                label="DISCOVERED ASSET ENTITIES"
                value="[ILLUSTRATIVE EXAMPLE]"
                context="External Domain & Certificate Map"
              />

              {/* Evidence Card */}
              <EvidenceCard
                variant="light"
                source="DNS_OBSERVATION"
                observation="A Record associated with external gateway interface"
                provenance="Public DNS Record"
                timestamp="2026-10-08 14:30:00 UTC"
                confidenceScore={98}
                status="intelligence"
              />

              {/* Intelligence Card */}
              <IntelligenceCard title="Graph Relationship Container" subtitle="Entity breakdown">
                <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontFamily: 'var(--ds-font-mono)', fontSize: '0.8125rem', color: '#D1D5DB' }}>
                  Node [Domain: example-target.org] --(A_RECORD)--&gt; Node [IP: 198.51.100.24]
                </div>
              </IntelligenceCard>
            </div>
          </section>
        )}

        {/* 7. BADGES & TAGS */}
        {shouldShow('badges') && (
          <section style={{ marginBottom: '80px' }} id="badges-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 07</Label>
              <HeadingXL>7. Badges, Pills & Technical Tags</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Pills are reserved strictly for status metadata. Rectangular monospace tags display technical parameters.
            </BodyLarge>

            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '12px' }}>STATUS BADGES & PILL BADGES</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <StatusBadge status="success">VERIFIED CLEAN</StatusBadge>
                  <PillBadge status="attention">DISCOVERY ATTENTION</PillBadge>
                  <StatusBadge status="warning">ELEVATED RISK</StatusBadge>
                  <StatusBadge status="critical">CRITICAL EXPOSURE</StatusBadge>
                  <PillBadge status="neutral">UNASSESSED</PillBadge>
                  <StatusBadge status="intelligence">GRAPH CORRELATED</StatusBadge>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                <Label style={{ color: '#6B7280', display: 'block', marginBottom: '12px' }}>TECHNICAL MONOSPACE TAGS</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <TechnicalTag>port:443/tcp</TechnicalTag>
                  <TechnicalTag>ip:198.51.100.24</TechnicalTag>
                  <TechnicalTag>proto:HTTP/2.0</TechnicalTag>
                  <TechnicalTag>dns:CNAME</TechnicalTag>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 8. EVIDENCE COMPONENT */}
        {shouldShow('evidence') && (
          <section style={{ marginBottom: '80px' }} id="evidence-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 08</Label>
              <HeadingXL>8. Evidence & Provenance Component</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Evidence presentation relies on rigorous observation provenance, clear confidence indices, and exact timestamps.
            </BodyLarge>

            <div style={{ maxWidth: '640px' }}>
              <EvidenceComponent
                item={{
                  id: 'ev-1042',
                  source: 'PUBLIC_CERTIFICATE_TRANSPARENCY',
                  observation: 'SAN Entry registered for sub.example-target.org',
                  provenance: 'Certificate Evidence',
                  timestamp: '2026-10-08 14:45:00 UTC',
                  confidenceScore: 99,
                  status: 'intelligence',
                }}
                variant="light"
              />
            </div>
          </section>
        )}

        {/* 9. GRAPH MAP */}
        {shouldShow('graph') && (
          <section style={{ marginBottom: '80px' }} id="graph-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 09</Label>
              <HeadingXL>9. Intelligence Graph Map & Node Primitives</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '24px', maxWidth: '800px' }}>
              Crisp vector relationships connecting Domain, Host, IP, Certificate, Technology, and Exposure Signals. Cobalt indicates primary relationships.
            </BodyLarge>

            {/* Individual Nodes Preview */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
              <IntelligenceNode type="Domain" label="example-target.org" sublabel="Apex Domain" active />
              <IntelligenceNode type="Host" label="api.example-target.org" sublabel="Subdomain" />
              <IntelligenceNode type="IP" label="198.51.100.24" sublabel="Gateway IP" />
              <IntelligenceNode type="Certificate" label="RSA 4096 Valid" sublabel="DigiCert" />
              <IntelligenceNode type="Technology" label="Nginx / 1.24" sublabel="Web Engine" />
              <IntelligenceNode type="Evidence" label="DNS Observation" sublabel="OBS_402" />
              <IntelligenceNode type="Dependency" label="Cloud Provider" sublabel="Edge Proxy" />
              <IntelligenceNode type="Signal" label="Port 443 Open" sublabel="HTTPS Active" />
            </div>

            {/* Lines and Markers */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
              <EvidenceMarker label="DNS_CORRELATION_PASS" confidence={99} />
              <GraphLabel>Vector Point: <DataPoint /></GraphLabel>
              <ConnectionState state="active" label="SYNCED" />
            </div>

            {/* Relationship Line SVG Demo */}
            <div style={{ backgroundColor: '#111318', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
              <svg width="100%" height="80" viewBox="0 0 600 80">
                <RelationshipLine x1={40} y1={40} x2={560} y2={40} colorVariant="cobalt" label="COBALT PRIMARY RELATIONSHIP" animated={false} />
              </svg>
            </div>

            <IntelligenceGraphDemo />
          </section>
        )}

        {/* 10. MOTION */}
        {shouldShow('motion') && (
          <section style={{ marginBottom: '80px' }} id="motion-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 10</Label>
              <HeadingXL>10. Motion Principles & Accessibility</HeadingXL>
            </div>
            <BodyLarge style={{ color: '#4B5563', marginBottom: '32px', maxWidth: '800px' }}>
              Subdued, slow, precise transitions (Reveal, Connect, Focus, Transition). Full support for prefers-reduced-motion.
            </BodyLarge>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="ds-motion-reveal" style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <HeadingMedium style={{ color: '#2563EB' }}>1. REVEAL TRANSITION</HeadingMedium>
                <BodySmall style={{ color: '#4B5563', marginTop: '8px' }}>Subtle upward translation on section entrance.</BodySmall>
              </div>

              <div className="ds-hover-lift" style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                <HeadingMedium style={{ color: '#111827' }}>2. CONTROL ELEVATION</HeadingMedium>
                <BodySmall style={{ color: '#4B5563', marginTop: '8px' }}>Hover to observe 2px elevation without neon outline.</BodySmall>
              </div>
            </div>
          </section>
        )}

        {/* 11. AUDIT */}
        {shouldShow('responsive') && (
          <section style={{ marginBottom: '80px' }} id="audit-section">
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '28px' }}>
              <Label style={{ color: '#2563EB', marginBottom: '4px', display: 'block' }}>SYSTEM SPECIFICATION 11</Label>
              <HeadingXL>11. Responsive & Accessibility Audit</HeadingXL>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#F7F7F4', borderRadius: '10px' }}>
                  <div style={{ color: '#16A34A', fontWeight: 700 }}>✓ Contrast Review</div>
                  <Caption style={{ color: '#4B5563' }}>High-contrast Graphite on Warm Paper meets WCAG AAA standards</Caption>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F7F7F4', borderRadius: '10px' }}>
                  <div style={{ color: '#16A34A', fontWeight: 700 }}>✓ Reduced Motion</div>
                  <Caption style={{ color: '#4B5563' }}>Media query disables CSS animations automatically</Caption>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F7F7F4', borderRadius: '10px' }}>
                  <div style={{ color: '#16A34A', fontWeight: 700 }}>✓ Keyboard Navigation</div>
                  <Caption style={{ color: '#4B5563' }}>Visible 2px Cobalt focus outlines on form controls & buttons</Caption>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
