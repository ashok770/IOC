import React from 'react';

interface ObservationTimelineProps {
  discoveredAt: string;
  lastSeenAt: string;
  additionalTimestamps?: { timestamp: string; label: string }[];
}

export const ObservationTimeline: React.FC<ObservationTimelineProps> = ({
  discoveredAt,
  lastSeenAt,
  additionalTimestamps = [],
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const d1 = new Date(discoveredAt).getTime();
  const d2 = new Date(lastSeenAt).getTime();
  const isMultiPoint = !isNaN(d1) && !isNaN(d2) && d2 > d1;

  // Calculate elapsed span if multi-point
  const getElapsedString = () => {
    if (!isMultiPoint) return null;
    const diffMs = d2 - d1;
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 60) {
      return `${Math.max(1, diffMinutes)}m span`;
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h span`;
    }
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d span`;
  };

  const elapsed = getElapsedString();

  // If there are real intermediate timestamps between d1 and d2
  const validIntermediates = additionalTimestamps.filter((t) => {
    const time = new Date(t.timestamp).getTime();
    return !isNaN(time) && time > d1 && time < d2;
  });

  return (
    <div
      style={{
        background: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '140px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          Observation Timeline
        </div>
        {elapsed && (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--color-accent-cyan-subtle)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
            }}
          >
            {elapsed}
          </span>
        )}
      </div>

      {isMultiPoint ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', marginBottom: 'auto' }}>
          {/* SVG Timeline track with dots */}
          <div style={{ width: '100%', position: 'relative', height: '24px' }}>
            <svg width="100%" height="24" style={{ overflow: 'visible' }}>
              {/* Background baseline */}
              <line
                x1="8"
                y1="12"
                x2="calc(100% - 8px)"
                y2="12"
                stroke="var(--color-border-strong)"
                strokeWidth="2"
                strokeDasharray={validIntermediates.length > 0 ? 'none' : '3 3'}
              />
              
              {/* First observation node */}
              <circle cx="8" cy="12" r="5" fill="var(--color-accent-cyan)" />
              <circle cx="8" cy="12" r="8" fill="var(--color-accent-cyan)" opacity="0.2" />

              {/* Intermediate points if genuine */}
              {validIntermediates.map((item, idx) => {
                const itemTime = new Date(item.timestamp).getTime();
                const pct = Math.min(Math.max(15, ((itemTime - d1) / (d2 - d1)) * 100), 85);
                return (
                  <circle
                    key={idx}
                    cx={`${pct}%`}
                    cy="12"
                    r="4"
                    fill="var(--color-status-success)"
                  >
                    <title>{`${item.label}: ${formatTime(item.timestamp)}`}</title>
                  </circle>
                );
              })}

              {/* Last observation node */}
              <circle cx="calc(100% - 8px)" cy="12" r="5" fill="var(--color-status-success)" />
              <circle cx="calc(100% - 8px)" cy="12" r="8" fill="var(--color-status-success)" opacity="0.2" />
            </svg>
          </div>

          {/* Timestamp labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                First Observed
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {formatTime(discoveredAt)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Last Observed
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {formatTime(lastSeenAt)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single Observation Snapshot */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-status-success)',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.15)',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Baseline Observation Snapshot
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Captured timestamp</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {formatTime(discoveredAt || lastSeenAt)}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
            Single deterministic observation recorded during passive assessment.
          </div>
        </div>
      )}
    </div>
  );
};
