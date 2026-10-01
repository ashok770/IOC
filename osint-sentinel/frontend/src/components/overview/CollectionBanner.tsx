import React from 'react';
import { CollectionSummaryResponse } from '../../types';

interface CollectionBannerProps {
  isRunning: boolean;
  summary: CollectionSummaryResponse | null;
  error: string | null;
}

export const CollectionBanner: React.FC<CollectionBannerProps> = ({
  isRunning,
  summary,
  error,
}) => {
  if (isRunning) {
    return (
      <div className="collection-banner collection-banner--running" role="status">
        <div className="banner-content">
          <div className="banner-spinner" aria-hidden="true" />
          <div>
            <strong>ASSESSMENT IN PROGRESS:</strong> Running passive DNS, RDAP, Certificate Transparency,
            and HTTP response header collection. Please wait...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-banner collection-banner--failed" role="alert">
        <div className="banner-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>ASSESSMENT FAILED:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  if (summary.status === 'partial') {
    return (
      <div className="collection-banner collection-banner--partial" role="alert">
        <div className="banner-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <strong>ASSESSMENT PARTIAL:</strong> Some collection sources did not complete.
            Observed {summary.assets_discovered} assets, {summary.technologies_discovered} technologies, and{' '}
            {summary.evidence_items_created} evidence records. Review evidence logs before drawing final conclusions.
          </div>
        </div>
      </div>
    );
  }

  if (summary.status === 'completed') {
    return (
      <div className="collection-banner collection-banner--completed" role="status">
        <div className="banner-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <strong>ASSESSMENT COMPLETED:</strong> Verified {summary.evidence_items_created} raw evidence items,{' '}
            {summary.assets_discovered} perimeter assets, {summary.technologies_discovered} technologies, and{' '}
            {summary.relationships_mapped} semantic relationships.
          </div>
        </div>
      </div>
    );
  }

  return null;
};
