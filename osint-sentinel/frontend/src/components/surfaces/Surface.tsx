import React from 'react';
import './surface.css';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const WarmPaperSurface: React.FC<SurfaceProps> = ({ children, className = '', style, id }) => (
  <section id={id} style={style} className={`ds-surface-section ds-surface-paper-section ${className}`.trim()}>
    <div className="ds-surface-container">{children}</div>
  </section>
);

export const LightSurface: React.FC<SurfaceProps> = WarmPaperSurface;

export const WhiteSurface: React.FC<SurfaceProps> = ({ children, className = '', style, id }) => (
  <section id={id} style={style} className={`ds-surface-section ds-surface-white-section ${className}`.trim()}>
    <div className="ds-surface-container">{children}</div>
  </section>
);

export const SoftBlueSurface: React.FC<SurfaceProps> = ({ children, className = '', style, id }) => (
  <section id={id} style={style} className={`ds-surface-section ds-surface-softblue-section ${className}`.trim()}>
    <div className="ds-surface-container">{children}</div>
  </section>
);

export const DarkSurface: React.FC<SurfaceProps> = ({ children, className = '', style, id }) => (
  <section id={id} style={style} className={`ds-surface-section ds-surface-dark-section ${className}`.trim()}>
    <div className="ds-surface-container">{children}</div>
  </section>
);

export const IntelligenceSurface: React.FC<SurfaceProps> = ({ children, className = '', style, id }) => (
  <section id={id} style={style} className={`ds-surface-section ds-surface-intelligence-section ${className}`.trim()}>
    <div className="ds-surface-container">{children}</div>
  </section>
);
