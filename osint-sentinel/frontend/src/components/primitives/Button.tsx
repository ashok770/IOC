import React from 'react';
import './button.css';

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variantStyle?: 'default' | 'cobalt' | 'darkSurface';
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  className?: string;
}

export const PrimaryButton: React.FC<BaseButtonProps> = ({
  children,
  size = 'md',
  variantStyle = 'default',
  iconRight,
  iconLeft,
  className = '',
  ...props
}) => {
  const variantClass = variantStyle === 'cobalt' ? 'ds-btn-cobalt' : '';
  const sizeClass = size !== 'md' ? `ds-btn-${size}` : '';
  return (
    <button
      className={`ds-btn ds-btn-primary ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {iconLeft && <span className="ds-btn-icon-left">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="ds-btn-icon-right">{iconRight}</span>}
    </button>
  );
};

export const SecondaryButton: React.FC<BaseButtonProps> = ({
  children,
  size = 'md',
  variantStyle = 'default',
  iconRight,
  iconLeft,
  className = '',
  ...props
}) => {
  const darkSurfaceClass = variantStyle === 'darkSurface' ? 'ds-surface-dark-btn' : '';
  const sizeClass = size !== 'md' ? `ds-btn-${size}` : '';
  return (
    <button
      className={`ds-btn ds-btn-secondary ${darkSurfaceClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {iconLeft && <span className="ds-btn-icon-left">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="ds-btn-icon-right">{iconRight}</span>}
    </button>
  );
};

export const TertiaryButton: React.FC<BaseButtonProps> = ({
  children,
  size = 'md',
  iconRight,
  iconLeft,
  className = '',
  ...props
}) => {
  const sizeClass = size !== 'md' ? `ds-btn-${size}` : '';
  return (
    <button className={`ds-btn ds-btn-tertiary ${sizeClass} ${className}`.trim()} {...props}>
      {iconLeft && <span className="ds-btn-icon-left">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="ds-btn-icon-right">{iconRight}</span>}
    </button>
  );
};

export const TextButton: React.FC<BaseButtonProps> = ({
  children,
  size = 'md',
  iconRight,
  iconLeft,
  className = '',
  ...props
}) => {
  const sizeClass = size !== 'md' ? `ds-btn-${size}` : '';
  return (
    <button className={`ds-btn ds-btn-text ${sizeClass} ${className}`.trim()} {...props}>
      {iconLeft && <span className="ds-btn-icon-left">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="ds-btn-icon-right">{iconRight}</span>}
    </button>
  );
};
