import React from 'react';
import './graph.css';

export interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorVariant?: 'cobalt' | 'indigo' | 'muted' | 'cyan' | 'violet' | 'gradient' | 'subtle';
  animated?: boolean;
  label?: string;
  strokeWidth?: number;
  id?: string;
}

export const RelationshipLine: React.FC<RelationshipLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  colorVariant = 'cobalt',
  animated = false,
  label,
  strokeWidth = 1.2,
  id,
}) => {
  const getStroke = () => {
    switch (colorVariant) {
      case 'cobalt':
      case 'cyan':
        return '#3B82F6';
      case 'indigo':
      case 'violet':
        return '#6366F1';
      case 'muted':
      case 'subtle':
        return 'rgba(156, 163, 175, 0.45)';
      default:
        return '#3B82F6';
    }
  };

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const labelWidth = label ? Math.max(label.length * 6.2 + 14, 38) : 0;

  return (
    <g id={id} className="ds-relationship-line">
      {/* Crisp Vector Relationship Line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={getStroke()}
        strokeWidth={strokeWidth}
        strokeDasharray={animated ? '4 4' : undefined}
        className={animated ? 'ds-motion-connect' : undefined}
      />

      {/* Technical Relationship Label */}
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-labelWidth / 2}
            y="-8"
            width={labelWidth}
            height="16"
            rx="3"
            fill="#0F1117"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="8.5"
            fontFamily="var(--ds-font-mono, monospace)"
            fontWeight="500"
            letterSpacing="0.04em"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
