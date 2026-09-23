import React from 'react';

const TopPerformingEvents = ({ events = [] }) => {
  if (!events || events.length === 0) return (
    <div className="admin-hero-stat">
      <span>Top performing events</span>
      <small>No events yet</small>
    </div>
  );

  return (
    <div className="admin-top-events admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Top Performing Events</strong>
        <a href="#" className="admin-link-accent">View all</a>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {events.slice(0,4).map((ev) => (
          <div key={ev.id} className="top-event-row">
            <img src={ev.thumbnail || '/images/ekotixx.jpeg'} alt={ev.title} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1, marginLeft: 10 }}>
              <div style={{ fontWeight: 700 }}>{ev.title}</div>
              <div className="kpi-sub">{ev.tickets || 0} tickets</div>
            </div>
            <div className="admin-value" style={{ fontWeight: 800 }}>NGN {Number(ev.revenue || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPerformingEvents;
