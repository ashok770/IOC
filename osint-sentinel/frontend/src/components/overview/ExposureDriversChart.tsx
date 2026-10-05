import React from 'react';
import { RiskAssessment } from '../../types';

interface ExposureDriversChartProps {
  risk: RiskAssessment | null;
}

export const ExposureDriversChart: React.FC<ExposureDriversChartProps> = ({ risk }) => {
  if (!risk || !risk.factors_breakdown) {
    return (
      <div className="overview-card">
        <h3 className="card-title">Exposure Drivers</h3>
        <p className="card-empty-text">No risk assessment data available.</p>
      </div>
    );
  }

  const factors = Object.entries(risk.factors_breakdown).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    score: value,
  }));

  const maxScore = Math.max(...factors.map(f => Math.abs(f.score)), 10); // Ensure a sensible scale

  return (
    <div className="overview-card exposure-drivers-card">
      <h3 className="card-title">Exposure Drivers</h3>
      <p className="card-subtitle">Key factors contributing to the external exposure posture.</p>
      <div className="horizontal-bar-chart">
        {factors.map((factor, idx) => {
          const widthPct = (Math.abs(factor.score) / maxScore) * 100;
          return (
            <div className="bar-row" key={idx}>
              <div className="bar-label">{factor.name}</div>
              <div className="bar-track">
                <div 
                  className={`bar-fill ${factor.score > 0 ? 'positive' : 'neutral'}`} 
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="bar-value">
                {factor.score > 0 ? `+${factor.score.toFixed(1)}` : factor.score.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
