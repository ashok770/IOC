import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Relationship, Asset, Technology } from '../../types';

interface RelationshipSnapshotProps {
  relationships: Relationship[];
  assets: Asset[];
  technologies: Technology[];
}

export const RelationshipSnapshot: React.FC<RelationshipSnapshotProps> = ({ relationships, assets, technologies }) => {
  const navigate = useNavigate();

  return (
    <div className="overview-card relationship-snapshot-card">
      <h3 className="card-title">External Asset Relationship Graph</h3>
      <div className="relationship-preview-stats">
        <div className="rel-stat">
          <span className="rel-stat-val">{relationships.length}</span>
          <span className="rel-stat-label">Relationships</span>
        </div>
        <div className="rel-stat">
          <span className="rel-stat-val">{assets.length}</span>
          <span className="rel-stat-label">Assets</span>
        </div>
        <div className="rel-stat">
          <span className="rel-stat-val">{technologies.length}</span>
          <span className="rel-stat-label">Technologies</span>
        </div>
      </div>
      <div className="relationship-preview-action">
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/relationships')}>
          View Graph &rarr;
        </button>
      </div>
    </div>
  );
};
