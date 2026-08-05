import React from 'react';

// Small inline sparkline renderer
function Sparkline({ data = [], width = 88, height = 30, stroke = '#16a34a' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max === min ? 1 : max - min;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  return (
    <svg className="kpi-sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const KPICard = ({ icon: Icon, label, value, sub, delta, colorClass, sparkData }) => {
  return (
    <article className={`admin-kpi-card kpi-card admin-card ${colorClass || ''}`}>
      <div className="admin-kpi-left">
        <span className="admin-kpi-icon">
          {Icon ? <Icon aria-hidden="true" /> : null}
        </span>
        <div>
          <p className="kpi-label">{label}</p>
          <div className="kpi-row">
            <strong className="kpi-value">{value}</strong>
            {sub ? <small className="kpi-sub">{sub}</small> : null}
          </div>
        </div>
      </div>

      {sparkData ? (
        <div style={{ marginLeft: '1rem' }}>
          <Sparkline data={sparkData} stroke={colorClass && colorClass.includes('emerald') ? '#16a34a' : '#2563eb'} />
        </div>
      ) : null}

      {typeof delta !== 'undefined' ? (
        <div className={`kpi-delta ${delta >= 0 ? 'delta-up' : 'delta-down'}`}>
          {delta >= 0 ? `+${delta}%` : `${delta}%`}
        </div>
      ) : null}
    </article>
  );
};

export default KPICard;
