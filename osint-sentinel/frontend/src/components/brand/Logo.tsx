import React from 'react';

export type LogoVariant =
  | 'full'
  | 'horizontal'
  | 'symbol'
  | 'monochrome-dark'
  | 'monochrome-light'
  | 'small';

interface LogoProps {
  variant?: LogoVariant;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size,
  className = '',
  style,
  id,
}) => {
  const isMonochromeDark = variant === 'monochrome-dark';
  const isMonochromeLight = variant === 'monochrome-light';
  const isSymbolOnly = variant === 'symbol' || variant === 'small';

  // Primary brand coloration: Cobalt (#2563EB) & Indigo (#4F46E5)
  const strokeColor = isMonochromeDark
    ? '#111827'
    : isMonochromeLight
    ? '#FFFFFF'
    : '#2563EB';

  const nodeColorPrimary = isMonochromeDark
    ? '#111827'
    : isMonochromeLight
    ? '#FFFFFF'
    : '#2563EB';

  const nodeColorSecondary = isMonochromeDark
    ? '#111827'
    : isMonochromeLight
    ? '#FFFFFF'
    : '#4F46E5';

  const symbolSize = size || (variant === 'small' ? 28 : variant === 'symbol' ? 36 : 38);

  return (
    <div
      id={id}
      className={`osint-logo-wrapper osint-logo-${variant} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        ...style,
      }}
    >
      {/* SVG Geometric S Lettermark + Intelligence Network */}
      <svg
        width={symbolSize}
        height={Math.round((Number(symbolSize) * 52) / 44)}
        viewBox="0 0 44 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="OSINT Sentinel Geometric S Logo"
        style={{ flexShrink: 0 }}
      >
        {/* Subtle Geometric Structural Guide Lines */}
        {!isMonochromeDark && !isMonochromeLight && (
          <path
            d="M8 10L36 10M8 26L36 26M8 42L36 42M12 6L12 46M32 6L32 46"
            stroke="rgba(37, 99, 235, 0.12)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* Main Geometric S Node Network Path (Solid Cobalt) */}
        <path
          d="M34 10H12V26H32V42H10"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary Relationship Diagnostic Lines */}
        <path
          d="M12 10L32 26M12 26L32 42"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeOpacity={isMonochromeDark || isMonochromeLight ? "0.4" : "0.75"}
          strokeDasharray="3 3"
        />

        {/* Intelligence Nodes (Cobalt & Indigo Vertices) */}
        <circle cx="34" cy="10" r="3.5" fill={nodeColorSecondary} />
        <circle cx="12" cy="10" r="3.5" fill={nodeColorPrimary} />
        <circle cx="12" cy="26" r="3.5" fill={nodeColorPrimary} />
        <circle cx="32" cy="26" r="3.5" fill={nodeColorSecondary} />
        <circle cx="32" cy="42" r="3.5" fill={nodeColorSecondary} />
        <circle cx="10" cy="42" r="3.5" fill={nodeColorPrimary} />

        {/* Core Focal Center Node */}
        <circle cx="22" cy="18" r="2" fill={nodeColorPrimary} opacity="0.9" />
      </svg>

      {/* Wordmark and Positioning Line */}
      {!isSymbolOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: variant === 'full' ? '1.0625rem' : '1.1875rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: isMonochromeLight ? '#FFFFFF' : '#111827',
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}
            className="osint-logo-wordmark"
          >
            OSINT <span style={{ opacity: 0.9 }}>SENTINEL</span>
          </div>

          {variant === 'full' && (
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: isMonochromeLight ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
              className="osint-logo-positioning"
            >
              EXTERNAL SECURITY INTELLIGENCE
            </div>
          )}
        </div>
      )}
    </div>
  );
};
