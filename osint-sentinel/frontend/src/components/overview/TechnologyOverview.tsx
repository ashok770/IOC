import React from 'react';
import { Technology } from '../../types';

interface TechnologyOverviewProps {
  technologies: Technology[];
}

export const TechnologyOverview: React.FC<TechnologyOverviewProps> = ({ technologies }) => {
  if (technologies.length === 0) {
    return (
      <div className="overview-card technology-overview-card">
        <h3 className="card-title">Technology Intelligence</h3>
        <p className="card-empty-text">No technology observations available.</p>
      </div>
    );
  }

  // Count by category
  const categoryCounts: Record<string, number> = {};
  technologies.forEach(t => {
    const cat = t.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count
    }));

  const maxCount = categories.length > 0 ? categories[0].count : 1;

  return (
    <div className="overview-card technology-overview-card">
      <h3 className="card-title">Technology Intelligence</h3>
      <p className="card-subtitle">{technologies.length} Detected Stacks</p>
      
      <div className="horizontal-bar-chart">
        {categories.slice(0, 5).map((cat, idx) => {
          const widthPct = (cat.count / maxCount) * 100;
          return (
            <div className="bar-row" key={idx}>
              <div className="bar-label">{cat.name}</div>
              <div className="bar-track">
                <div 
                  className="bar-fill blue" 
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="bar-value">{cat.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
