import React from 'react';
import { Technology, Asset } from '../../types';

interface TechnologyIntelligenceSectionProps {
  technologies: Technology[];
  assetMap: Map<string, Asset>;
}

export const TechnologyIntelligenceSection: React.FC<TechnologyIntelligenceSectionProps> = ({
  technologies,
  assetMap,
}) => {
  return (
    <section className="report-section" id="technology-intelligence">
      <div className="report-section-header">
        <span className="section-number">05</span>
        <h2 className="section-title">TECHNOLOGY INTELLIGENCE</h2>
      </div>

      <p className="report-section-desc">
        Passively identified software stacks and infrastructure components ({technologies.length} detections).
        Versions are recorded only when explicitly disclosed in public response headers.
      </p>

      {technologies.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No technology observations recorded for this assessment target.</p>
        </div>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>TECHNOLOGY</th>
                <th style={{ width: '18%' }}>CATEGORY</th>
                <th style={{ width: '14%' }}>VERSION</th>
                <th style={{ width: '18%' }}>DETECTION METHOD</th>
                <th style={{ width: '10%' }}>CONFIDENCE</th>
                <th style={{ width: '15%' }}>OBSERVED ASSET</th>
              </tr>
            </thead>
            <tbody>
              {technologies.map((tech) => {
                const asset = tech.asset_id ? assetMap.get(tech.asset_id) : null;
                const assetVal = asset ? asset.value : '—';

                return (
                  <tr key={tech.id}>
                    <td>
                      <span className="tech-name-cell font-bold">{tech.name}</span>
                    </td>
                    <td>
                      <span className="report-badge category-badge">{tech.category}</span>
                    </td>
                    <td>
                      <span className={`monospace ${tech.version ? 'tech-version-active' : 'tech-version-none'}`}>
                        {tech.version ? tech.version : 'Not observed'}
                      </span>
                    </td>
                    <td>
                      <span className="monospace detection-cell">{tech.detection_method}</span>
                    </td>
                    <td>
                      <span className="monospace">{(tech.confidence * 100).toFixed(0)}%</span>
                    </td>
                    <td>
                      <span className="monospace asset-ref-cell" title={assetVal}>
                        {assetVal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
