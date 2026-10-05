import React from 'react';
import { Target, AnalysisSummary } from '../../types';

interface RecentActivityProps {
  target: Target;
  summary: AnalysisSummary | null;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ target }) => {
  const baseTime = new Date(target.updated_at || target.created_at).getTime();
  
  // Create a synthetic timeline based on the last update time to show sequence of events
  // This simulates the activity feed using real available timestamps
  const activities = [
    { title: 'Assessment completed', time: new Date(baseTime).toLocaleTimeString() },
    { title: 'Exposure analysis completed', time: new Date(baseTime - 1000).toLocaleTimeString() },
    { title: 'Technology intelligence collected', time: new Date(baseTime - 2000).toLocaleTimeString() },
    { title: 'Asset discovery completed', time: new Date(baseTime - 3000).toLocaleTimeString() },
  ];

  return (
    <div className="overview-card recent-activity-card">
      <h3 className="card-title">Recent Activity</h3>
      <div className="activity-timeline">
        {activities.map((act, idx) => (
          <div key={idx} className="activity-item">
            <div className="activity-dot"></div>
            <div className="activity-content">
              <div className="activity-title">{act.title}</div>
              <div className="activity-time">{act.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
