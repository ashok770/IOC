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
        return '#2563EB';
      case 'indigo':
      case 'violet':
        return '#4F46E5';
      case 'muted':
      case 'subtle':
        return '#9CA3AF';
      default:
        return '#2563EB';
    }
  };

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

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
            x="-34"
            y="-9"
            width="68"
            height="18"
            rx="4"
            fill="#111318"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="9"
            fontFamily="var(--ds-font-mono)"
            fontWeight="500"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
