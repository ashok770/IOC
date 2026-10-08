import React from 'react';
import { StatusBadge, StatusType, TechnicalTag } from './Badge';
import { HeadingMedium, BodyMedium, Caption, Label, DisplayMedium } from '../../design/typography/Typography';
import './card.css';

export type SurfaceVariant = 'light' | 'dark' | 'intelligence';

export interface SurfaceCardProps {
  children: React.ReactNode;
  variant?: SurfaceVariant;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  children,
  variant = 'light',
  interactive = false,
  className = '',
  style,
  id,
}) => {
  const interactiveClass = interactive ? 'ds-card-interactive' : '';
  return (
    <div
      id={id}
      style={style}
      className={`ds-card ds-card-${variant} ${interactiveClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export interface FeatureCardProps {
  title: string;
  description: string;
  visual?: React.ReactNode;
  tag?: string;
  variant?: SurfaceVariant;
  interactive?: boolean;
  className?: string;
  id?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  visual,
  tag,
  variant = 'light',
  interactive = true,
  className = '',
  id,
}) => {
  return (
    <SurfaceCard id={id} variant={variant} interactive={interactive} className={`ds-feature-card ${className}`.trim()}>
      {visual && <div className="ds-feature-card-visual">{visual}</div>}
      {tag && <Label style={{ color: variant === 'light' ? '#6B7280' : '#9CA3AF' }}>{tag}</Label>}
      <div>
        <HeadingMedium style={{ marginBottom: '8px', color: variant === 'light' ? '#111827' : '#FFFFFF' }}>
          {title}
        </HeadingMedium>
        <BodyMedium style={{ color: variant === 'light' ? '#374151' : '#D1D5DB' }}>
          {description}
        </BodyMedium>
      </div>
    </SurfaceCard>
  );
};

export interface EvidenceCardProps {
  source: string;
  observation: string;
  provenance: string;
  timestamp: string;
  confidenceScore?: number;
  status?: StatusType;
  variant?: SurfaceVariant;
  className?: string;
  id?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  source,
  observation,
  provenance,
  timestamp,
  confidenceScore = 95,
  status = 'intelligence',
  variant = 'light',
  className = '',
  id,
}) => {
  return (
    <SurfaceCard id={id} variant={variant} className={`ds-evidence-card ${className}`.trim()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TechnicalTag dark={variant !== 'light'}>{source}</TechnicalTag>
        <StatusBadge status={status}>{provenance}</StatusBadge>
      </div>

      <div style={{ margin: '4px 0' }}>
        <BodyMedium style={{ color: variant === 'light' ? '#111827' : '#FFFFFF', fontWeight: 500 }}>
          {observation}
        </BodyMedium>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
        <Caption style={{ fontFamily: 'var(--ds-font-mono)' }}>{timestamp}</Caption>
        <Caption style={{ fontFamily: 'var(--ds-font-mono)' }}>Confidence Index: {confidenceScore}%</Caption>
      </div>
    </SurfaceCard>
  );
};

export interface MetricCardProps {
  value: string | number;
  label: string;
  context?: string;
  variant?: SurfaceVariant;
  className?: string;
  id?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  context,
  variant = 'light',
  className = '',
  id,
}) => {
  return (
    <SurfaceCard id={id} variant={variant} className={`ds-metric-card ${className}`.trim()}>
      <Label style={{ color: variant === 'light' ? '#6B7280' : '#9CA3AF' }}>{label}</Label>
      <DisplayMedium style={{ color: variant === 'light' ? '#111827' : '#FFFFFF', margin: '4px 0' }}>
        {value}
      </DisplayMedium>
      {context && (
        <Caption style={{ color: variant === 'light' ? '#6B7280' : '#9CA3AF' }}>
          {context}
        </Caption>
      )}
    </SurfaceCard>
  );
};

export interface IntelligenceCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  id,
}) => {
  return (
    <SurfaceCard id={id} variant="intelligence" className={`ds-intelligence-card ${className}`.trim()}>
      <div>
        <HeadingMedium style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block' }} />
          {title}
        </HeadingMedium>
        {subtitle && <Caption style={{ color: '#9CA3AF', marginTop: '2px' }}>{subtitle}</Caption>}
      </div>

      <div style={{ width: '100%' }}>{children}</div>
    </SurfaceCard>
  );
};
