import React from 'react';
import { ExposureSignal, Asset } from '../../types';

interface ObservedExposureSectionProps {
  signals: ExposureSignal[];
  assetMap: Map<string, Asset>;
}

export const ObservedExposureSection: React.FC<ObservedExposureSectionProps> = ({
  signals,
  assetMap,
}) => {
  return (
    <section className="report-section" id="observed-exposure">
      <div className="report-section-header">
        <span className="section-number">04</span>
        <h2 className="section-title">OBSERVED EXPOSURE SIGNALS</h2>
      </div>

      <div className="report-discipline-callout">
        <svg
          className="callout-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="callout-body">
          <strong>EXPOSURE ≠ VULNERABILITY:</strong> Observed exposure signals represent publicly observable
          attributes—such as remote-access entrypoints, pre-production testing hostnames, or technology disclosures—that
          warrant triage. They do not constitute confirmed exploitable vulnerabilities or evidence of breach.
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="report-empty-block">
          <p className="report-empty-text">No prioritized exposure signals identified.</p>
        </div>
      ) : (
        <div className="report-signals-list">
          {signals.map((sig) => {
            const asset = sig.asset_id ? assetMap.get(sig.asset_id) : null;
            const assetVal = asset ? asset.value : sig.asset_id || 'Apex Scope';

            return (
              <div key={sig.id} className="report-signal-item">
                <div className="report-signal-top">
                  <div className="signal-title-row">
                    <span className="signal-type-tag">{sig.signal_type}</span>
                    <h3 className="signal-title">{sig.title}</h3>
                  </div>
                  <div className="signal-meta-right">
                    <span className="signal-category-tag">{sig.category}</span>
                    <span className="signal-conf-tag monospace">
                      CONF: {(sig.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="signal-desc">{sig.description}</p>

                <div className="signal-context-row">
                  <div className="signal-asset-ref">
                    <span className="context-label">ASSOCIATED ASSET:</span>
                    <span className="context-val monospace">{assetVal}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
