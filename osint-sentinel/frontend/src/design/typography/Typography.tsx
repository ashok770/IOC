import React from 'react';
import './typography.css';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  style?: React.CSSProperties;
  id?: string;
}

export const DisplayXL: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h1', style, id }) => (
  <Component id={id} style={style} className={`ds-display-xl ${className}`.trim()}>
    {children}
  </Component>
);

export const DisplayLarge: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h1', style, id }) => (
  <Component id={id} style={style} className={`ds-display-lg ${className}`.trim()}>
    {children}
  </Component>
);

export const DisplayMedium: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h2', style, id }) => (
  <Component id={id} style={style} className={`ds-display-md ${className}`.trim()}>
    {children}
  </Component>
);

export const HeadingXL: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h2', style, id }) => (
  <Component id={id} style={style} className={`ds-heading-xl ${className}`.trim()}>
    {children}
  </Component>
);

export const HeadingLarge: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h3', style, id }) => (
  <Component id={id} style={style} className={`ds-heading-lg ${className}`.trim()}>
    {children}
  </Component>
);

export const HeadingMedium: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h4', style, id }) => (
  <Component id={id} style={style} className={`ds-heading-md ${className}`.trim()}>
    {children}
  </Component>
);

export const HeadingSmall: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h5', style, id }) => (
  <Component id={id} style={style} className={`ds-heading-sm ${className}`.trim()}>
    {children}
  </Component>
);

export const BodyLarge: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p', style, id }) => (
  <Component id={id} style={style} className={`ds-body-lg ${className}`.trim()}>
    {children}
  </Component>
);

export const BodyMedium: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p', style, id }) => (
  <Component id={id} style={style} className={`ds-body-md ${className}`.trim()}>
    {children}
  </Component>
);

export const BodySmall: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p', style, id }) => (
  <Component id={id} style={style} className={`ds-body-sm ${className}`.trim()}>
    {children}
  </Component>
);

export const Label: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span', style, id }) => (
  <Component id={id} style={style} className={`ds-label ${className}`.trim()}>
    {children}
  </Component>
);

export const Caption: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span', style, id }) => (
  <Component id={id} style={style} className={`ds-caption ${className}`.trim()}>
    {children}
  </Component>
);

export const TechnicalMono: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'code', style, id }) => (
  <Component id={id} style={style} className={`ds-technical-mono ${className}`.trim()}>
    {children}
  </Component>
);
