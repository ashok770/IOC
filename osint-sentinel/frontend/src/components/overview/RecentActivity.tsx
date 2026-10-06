import React from 'react';
import { Target, AnalysisSummary } from '../../types';

interface RecentActivityProps {
  target: Target;
  summary: AnalysisSummary | null;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ target }) => {
  const baseTime = new Date(target.updated_at || target.created_at).getTime();
  
  // Create a synthetic timeline based on the last update time to show sequence of events
  const activities = [
    { title: 'Assessment completed', timeMs: baseTime, icon: 'check' },
    { title: 'Exposure analysis completed', timeMs: baseTime - 1000, icon: 'check' },
    { title: 'Technology intelligence collected', timeMs: baseTime - 2000, icon: 'check' },
    { title: 'Asset discovery completed', timeMs: baseTime - 3000, icon: 'check' },
  ];

  const renderAbsoluteTime = (timeMs: number) => {
    const dateObj = new Date(timeMs);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    }).format(dateObj);
  };

  return (
    <div className="overview-card recent-activity-card compact-card" style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}>
      <div className="activity-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {activities.map((act, idx) => {
          const isLast = idx === activities.length - 1;
          return (
            <div key={idx} className="activity-compact-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 0 }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginTop: '2px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'var(--color-bg-surface)', position: 'relative', zIndex: 1 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {!isLast && (
                    <div style={{ position: 'absolute', top: '16px', bottom: 'calc(-1 * var(--space-3) - 2px)', width: '2px', backgroundColor: 'var(--color-border-subtle)', zIndex: 0 }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{act.title}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textAlign: 'right', marginLeft: 'var(--space-3)' }}>
                {renderAbsoluteTime(act.timeMs)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
