import React from 'react';

export default function StatsCards({ stats, columns }) {
  const gridCols = columns || 'repeat(auto-fit, minmax(190px, 1fr))';

  return (
    <div className="ld-stats-grid" style={{ gridTemplateColumns: gridCols }}>
      <style>{`
        .ld-stats-grid {
          display: grid; gap: 16px;
        }
        .ld-stat-card {
          background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px;
          box-shadow: 0 2px 8px rgba(11,31,58,0.05); transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden;
        }
        .ld-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(11,31,58,0.12);
          border-color: rgba(138,196,61,0.25);
        }
        .ld-stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #0B2362, #8AC43D);
        }
        .ld-stat-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
        .ld-stat-icon {
          width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center;
          font-size: 18px; background: var(--brand-l); flex-shrink: 0;
        }
        .ld-stat-trend {
          font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px;
          background: var(--brand-l); color: var(--brand-d);
        }
        .ld-stat-label {
          font-size: 11px; font-weight: 600; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.3;
        }
        .ld-stat-value {
          font-family: Archivo, sans-serif; font-size: 30px; font-weight: 800;
          margin-top: 6px; letter-spacing: -0.02em; line-height: 1;
        }
        .ld-stat-sub { font-size: 11px; color: var(--muted); margin-top: 6px; }
      `}</style>
      {stats.map((s, i) => (
        <div key={i} className="ld-stat-card fade" style={{ animationDelay: `${i * 0.04}s` }}>
          <div className="ld-stat-top">
            <div className="ld-stat-icon" style={{ background: s.iconBg || 'var(--brand-l)' }}>{s.icon}</div>
            {s.trend && <span className="ld-stat-trend" style={s.trendStyle}>{s.trend}</span>}
          </div>
          <div className="ld-stat-label">{s.label}</div>
          <div className="ld-stat-value" style={{ color: s.color || '#0B1F3A' }}>{s.value}</div>
          {s.sub && <div className="ld-stat-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
