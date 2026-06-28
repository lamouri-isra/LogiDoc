import React, { useState, useMemo, useId } from 'react';
import { BRAND, CHART_COLORS } from '../../data/theme';

export const CHART_BLUE = CHART_COLORS.blue;
export const CHART_GREEN = CHART_COLORS.green;
export const CHART_BLUE_LIGHT = CHART_COLORS.blueLight;
export const CHART_GREEN_LIGHT = CHART_COLORS.greenLight;

const CHART_STYLES = `
  @keyframes ldDrawLine { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
  @keyframes ldFadeArea { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ldBarGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .ld-chart-tooltip {
    position: absolute; pointer-events: none; z-index: 10;
    background: #fff; border: 1px solid var(--line); border-radius: 10px;
    padding: 10px 14px; box-shadow: 0 8px 24px rgba(11,35,98,0.12);
    font-size: 12px; min-width: 140px; transform: translate(-50%, -110%);
  }
  .ld-chart-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--muted); }
  .ld-chart-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
`;

const LINE_COLORS = [CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT, CHART_GREEN_LIGHT];

function smoothPath(points, tension = 0.35) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function MiniSparkline({ data = [], color = CHART_GREEN, height = 32 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (v / max) * 80 - 10,
  }));
  const path = smoothPath(pts, 0.3);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function ModernLineChart({
  labels = [],
  series = [],
  height = 220,
  showGrid = true,
  animate = true,
}) {
  const [hover, setHover] = useState(null);
  const gradId = useId().replace(/:/g, '');

  const paths = useMemo(() => {
    const allValues = series.flatMap((s) => s.data);
    const max = Math.max(...allValues, 1);
    const padX = 8;
    const padY = 12;
    const w = 100;
    const h = 100;
    const n = labels.length;

    const toPoints = (data) => data.map((val, i) => ({
      x: padX + (i / Math.max(n - 1, 1)) * (w - padX * 2),
      y: padY + (1 - val / max) * (h - padY * 2),
      val,
      label: labels[i],
    }));

    return series.map((s, si) => {
      const pts = toPoints(s.data);
      const linePath = smoothPath(pts);
      const areaPath = pts.length
        ? `${linePath} L ${pts[pts.length - 1].x},${h - padY} L ${pts[0].x},${h - padY} Z`
        : '';
      return {
        ...s,
        color: s.color || LINE_COLORS[si % LINE_COLORS.length],
        pts,
        linePath,
        areaPath,
      };
    });
  }, [labels, series]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const n = labels.length;
    const idx = Math.round(((relX - 8) / 84) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    setHover({ idx: clamped, x: e.clientX - rect.left });
  };

  return (
    <div style={{ position: 'relative' }} className="ld-chart-print-safe">
      <style>{CHART_STYLES}</style>
      {series.length > 0 && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          {paths.map((s) => (
            <div key={s.key} className="ld-chart-legend-item">
              <span className="ld-chart-legend-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <div
        style={{ position: 'relative', height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          {showGrid && [0.25, 0.5, 0.75].map((pct) => (
            <line key={pct} x1="8" y1={12 + pct * 76} x2="92" y2={12 + pct * 76}
              stroke={BRAND.greenPale} strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          ))}
          <defs>
            {paths.map((s, si) => (
              <linearGradient key={si} id={`areaGrad-${gradId}-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            ))}
          </defs>
          {paths.map((s, si) => (
            <path key={`area-${s.key}`} d={s.areaPath}
              fill={`url(#areaGrad-${gradId}-${si})`}
              opacity="0.15"
              style={animate ? { animation: `ldFadeArea 0.8s ease ${si * 0.1}s both` } : undefined}
            />
          ))}
          {paths.map((s, si) => (
            <path key={s.key} d={s.linePath} fill="none" stroke={s.color}
              strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round"
              style={animate ? {
                strokeDasharray: 1000,
                animation: `ldDrawLine 1.2s ease ${si * 0.15}s both`,
              } : undefined}
            />
          ))}
          {hover && paths.map((s) => {
            const pt = s.pts[hover.idx];
            if (!pt) return null;
            return (
              <circle key={s.key} cx={pt.x} cy={pt.y} r="1.8"
                fill="#fff" stroke={s.color} strokeWidth="1.2"
                vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '6px 8px 0', fontSize: 10, color: 'var(--muted)', fontWeight: 500,
        }}>
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>
        {hover && (
          <div className="ld-chart-tooltip no-print" style={{ left: hover.x, top: 0 }}>
            <div style={{ fontWeight: 700, color: BRAND.blue, marginBottom: 6 }}>{labels[hover.idx]}</div>
            {series.map((s, si) => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: paths[si]?.color }} />
                  {s.label}
                </span>
                <strong style={{ color: BRAND.blue }}>{s.data[hover.idx]?.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DoughnutChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const defaultColors = [CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT, CHART_GREEN_LIGHT];
  let angle = -90;

  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const sweep = pct * 360;
    const start = angle;
    angle += sweep;
    const r = 42;
    const ir = 26;
    const large = sweep > 180 ? 1 : 0;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = 50 + r * Math.cos(toRad(start));
    const y1 = 50 + r * Math.sin(toRad(start));
    const x2 = 50 + r * Math.cos(toRad(angle));
    const y2 = 50 + r * Math.sin(toRad(angle));
    const ix1 = 50 + ir * Math.cos(toRad(angle));
    const iy1 = 50 + ir * Math.sin(toRad(angle));
    const ix2 = 50 + ir * Math.cos(toRad(start));
    const iy2 = 50 + ir * Math.sin(toRad(start));
    const color = d.color || defaultColors[i % defaultColors.length];
    const path = pct >= 0.999
      ? `M 50,${50 - r} A ${r},${r} 0 1,1 49.99,${50 - r} L 50,${50 - ir} A ${ir},${ir} 0 1,0 50.01,${50 - ir} Z`
      : `M ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2} L ${ix1},${iy1} A ${ir},${ir} 0 ${large},0 ${ix2},${iy2} Z`;
    return { path, color, label: d.label, pct: Math.round(pct * 100), value: d.value };
  });

  return (
    <div className="ld-chart-print-safe" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}
        <text x="50" y="48" textAnchor="middle" fontSize="11" fontWeight="800" fill={CHART_BLUE}
          fontFamily="Archivo,sans-serif">{total.toLocaleString()}</text>
        <text x="50" y="58" textAnchor="middle" fontSize="5" fill="var(--muted)">Total</text>
      </svg>
      <div style={{ display: 'grid', gap: 10 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: BRAND.blue }}>{s.label}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{s.value.toLocaleString()} ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarChart({ data = [], showPct = false, height }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barH = height || Math.max(data.length * 44, 120);

  return (
    <div className="ld-chart-print-safe" style={{ display: 'grid', gap: 12 }}>
      {data.map((d, i) => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: BRAND.blue }}>{d.label}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
              {d.value.toLocaleString()} {showPct && d.pct !== undefined ? `(${d.pct}%)` : ''}
            </span>
          </div>
          <div style={{ height: 10, background: BRAND.greenPale, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(d.value / max) * 100}%`,
              background: i % 2 === 0
                ? `linear-gradient(90deg, ${CHART_BLUE}, ${CHART_BLUE_LIGHT})`
                : `linear-gradient(90deg, ${CHART_GREEN}, ${CHART_GREEN_LIGHT})`,
              borderRadius: 999,
              transformOrigin: 'left',
              animation: 'ldBarGrow 0.8s ease both',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerticalBarChart({ data = [], height = 220, formatValue }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(48, Math.max(24, 600 / Math.max(data.length, 1)));

  const defaultFormat = (v) => {
    if (formatValue) return formatValue(v);
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return v.toLocaleString();
  };

  return (
    <div className="ld-chart-print-safe" style={{ height, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 4px', overflow: 'hidden' }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: barWidth }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.blue, marginBottom: 4 }}>
            {defaultFormat(d.value)}
          </div>
          <div style={{
            width: '100%',
            maxWidth: barWidth,
            height: `${(d.value / max) * (height - 60)}px`,
            background: `linear-gradient(180deg, ${CHART_GREEN}, ${CHART_BLUE})`,
            borderRadius: '6px 6px 0 0',
            animation: 'ldBarGrow 0.8s ease both',
            transformOrigin: 'bottom',
          }} />
          <div style={{
            fontSize: 9, color: 'var(--muted)', marginTop: 8, textAlign: 'center',
            maxWidth: barWidth + 16, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', fontWeight: 600,
          }} title={d.label}>
            {d.label.length > 12 ? `${d.label.slice(0, 10)}…` : d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DualHorizontalBarChart({ data = [] }) {
  const maxDelai = Math.max(...data.map((d) => d.delaiMoyen), 1);
  const maxDossiers = Math.max(...data.map((d) => d.dossiers), 1);

  return (
    <div className="ld-chart-print-safe" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 20, fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: CHART_BLUE, marginRight: 6 }} />Délai moyen (j)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: CHART_GREEN, marginRight: 6 }} />Nb dossiers</span>
      </div>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue, marginBottom: 8 }}>{d.label}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 8, background: BRAND.greenPale, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(d.delaiMoyen / maxDelai) * 100}%`, background: CHART_BLUE, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: CHART_BLUE, minWidth: 36 }}>{d.delaiMoyen}j</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 8, background: BRAND.greenPale, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(d.dossiers / maxDossiers) * 100}%`, background: CHART_GREEN, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: CHART_GREEN, minWidth: 36 }}>{d.dossiers}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PROB_LEVELS = ['Très faible', 'Faible', 'Moyenne', 'Élevée'];

function heatColor(score) {
  if (score >= 0.7) return BRAND.blue;
  if (score >= 0.45) return CHART_BLUE_LIGHT;
  if (score >= 0.25) return CHART_GREEN;
  return CHART_GREEN_LIGHT;
}

export function RiskHeatmap({ data = [] }) {
  const grouped = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      const key = `${r.impact}|${r.probabilite}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [data]);

  return (
    <div className="ld-chart-print-safe ld-risk-heatmap">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 10, textAlign: 'left', background: BRAND.blue, color: '#fff', borderRadius: '8px 0 0 0' }}>Fournisseur</th>
              <th style={{ padding: 10, background: BRAND.blue, color: '#fff' }}>Risque</th>
              {PROB_LEVELS.map((p) => (
                <th key={p} style={{ padding: 10, textAlign: 'center', background: BRAND.greenPale, color: BRAND.blue, fontSize: 11 }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={`${r.fournisseur}-${r.risque}`}>
                <td style={{ padding: 10, fontWeight: 600, borderBottom: `1px solid ${BRAND.line}` }}>{r.fournisseur}</td>
                <td style={{ padding: 10, borderBottom: `1px solid ${BRAND.line}`, color: 'var(--muted)' }}>{r.risque}</td>
                {PROB_LEVELS.map((prob) => {
                  const active = r.probabilite === prob;
                  const cellItems = grouped[`${r.impact}|${prob}`] || [];
                  const intensity = active ? r.score : cellItems.length ? 0.15 : 0;
                  return (
                    <td key={prob} style={{
                      padding: 10, textAlign: 'center', borderBottom: `1px solid ${BRAND.line}`,
                      background: active ? heatColor(r.score) : BRAND.greenPale,
                      color: active && r.score >= 0.45 ? '#fff' : BRAND.blue,
                      fontWeight: active ? 700 : 400,
                      fontSize: 11,
                    }}>
                      {active ? (
                        <div>
                          <div>{r.impact}</div>
                          <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{Math.round(r.score * 100)}%</div>
                        </div>
                      ) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
        {[CHART_GREEN_LIGHT, CHART_GREEN, CHART_BLUE_LIGHT, CHART_BLUE].map((c, i) => (
          <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
            {['Faible', 'Modéré', 'Élevé', 'Critique'][i]}
          </span>
        ))}
      </div>
    </div>
  );
}

const KPI_STATUS = {
  good: {
    accent: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    changeBg: 'rgba(16,185,129,0.12)',
    changeColor: '#059669',
  },
  warning: {
    accent: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    changeBg: 'rgba(245,158,11,0.12)',
    changeColor: '#D97706',
  },
  critical: {
    accent: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    changeBg: 'rgba(239,68,68,0.12)',
    changeColor: '#DC2626',
  },
  info: {
    accent: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    changeBg: 'rgba(59,130,246,0.12)',
    changeColor: '#2563EB',
  },
};

export function StatusBadge({ status = 'success' }) {
  const map = {
    success: { label: 'Succès', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    warning: { label: 'Attention', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    critical: { label: 'Critique', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  };
  const s = map[status] || map.success;
  return (
    <span className="ld-status-badge" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

export function severityToBadge(severity) {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'warning';
  return 'success';
}

export function DashboardAlertTable({ title, icon, items = [], pageSize = 8 }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = items.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="ld-dash-table-card">
      <div className="ld-dash-table-card__head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span>{icon}</span>}
        <strong>{title}</strong>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 700,
          background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 999,
        }}>
          {items.length}
        </span>
      </div>
      <div className="ld-dash-table-card__body">
        <div className="ld-dash-table-scroll">
          <table className="ld-dash-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Détail</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={3} className="ld-dash-table-empty">Aucune alerte</td>
                </tr>
              ) : paged.map((item) => (
                <tr key={item.id}>
                  <td className="ld-dash-table-ref">{item.label}</td>
                  <td className="ld-dash-table-detail">{item.detail}</td>
                  <td><StatusBadge status={severityToBadge(item.severity)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > pageSize && (
          <div className="ld-dash-table-pagination no-print">
            <span>{items.length} alerte(s) — Page {page + 1}/{totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" disabled={page === 0} onClick={() => setPage(0)}>«</button>
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChartCard({ title, subtitle, icon, children, className = '' }) {
  return (
    <div className={`ld-chart-card ${className}`} style={{
      background: '#fff', border: `1px solid ${BRAND.line}`, borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)',
      transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${BRAND.line}`,
        background: `linear-gradient(135deg, ${BRAND.greenPale}, #fff)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <div>
            <div style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 14, color: BRAND.blue }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export function KpiCard({
  icon, label, value, change, trend, formatValue, unit, invertTrend,
  status = 'info', sub,
}) {
  const isPositive = change >= 0;
  const isGood = invertTrend ? !isPositive : isPositive;
  const display = formatValue ? formatValue(value) : value?.toLocaleString?.() ?? value;
  const theme = KPI_STATUS[status] || KPI_STATUS.info;

  return (
    <div className="ld-exec-kpi" style={{
      background: '#fff',
      borderRadius: 16,
      padding: '16px 18px',
      color: BRAND.blue,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${theme.border}`,
      borderLeft: `4px solid ${theme.accent}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{
          fontSize: 18, width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.bg,
        }}>
          {icon}
        </span>
        {change !== undefined && change !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: isGood ? theme.changeBg : KPI_STATUS.critical.changeBg,
            color: isGood ? theme.changeColor : KPI_STATUS.critical.changeColor,
          }}>
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div style={{
        fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--muted)', lineHeight: 1.3,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Archivo,sans-serif', fontSize: 24, fontWeight: 800,
        marginTop: 4, letterSpacing: '-0.02em', color: theme.accent,
      }}>
        {display}{unit && <span style={{ fontSize: 13, fontWeight: 600, color: BRAND.blue }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontWeight: 600 }}>{sub}</div>
      )}
      {trend && (
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          <MiniSparkline data={trend} color={theme.accent} height={24} />
        </div>
      )}
    </div>
  );
}

const COLOR_MAP = {
  blue: CHART_BLUE,
  green: CHART_GREEN,
  blueLight: CHART_BLUE_LIGHT,
  greenLight: CHART_GREEN_LIGHT,
};

export function ProgressBar({ label, value, max = 100, target, color = CHART_GREEN, unit = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const overTarget = target && value > target;
  return (
    <div className="ld-progress-bar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.blue }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: overTarget ? 'var(--ko)' : BRAND.blue }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: 8, background: BRAND.greenPale, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${CHART_GREEN_LIGHT})`,
          borderRadius: 999, transition: 'width 0.8s ease',
        }} />
      </div>
      {target && (
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 5 }}>
          Cible : ≤ {target}{unit}
        </div>
      )}
    </div>
  );
}

export function CompactLineChart({ labels = [], data = [], color = CHART_BLUE, height = 80 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / Math.max(labels.length - 1, 1)) * 100,
    y: 100 - (v / max) * 75 - 12,
  }));
  const path = smoothPath(pts, 0.3);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <path d={`${path} L 100,100 L 0,100 Z`} fill={color} opacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

export function CompactColumnChart({ data = [], color = CHART_BLUE, height = 80 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 2px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%', maxWidth: 28,
            height: `${Math.max(8, (d.value / max) * 100)}%`,
            background: `linear-gradient(180deg, ${color}, ${CHART_GREEN_LIGHT})`,
            borderRadius: '4px 4px 0 0',
            transformOrigin: 'bottom',
            animation: 'ldBarGrow 0.6s ease both',
          }} />
        </div>
      ))}
    </div>
  );
}

export function FraisCategoryCard({ category }) {
  const color = COLOR_MAP[category.colorKey] || CHART_BLUE;
  return (
    <div className="ld-frais-category-card" style={{
      background: '#fff', border: `1px solid ${BRAND.line}`, borderRadius: 12,
      padding: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>{category.label}</div>
          <div style={{ fontFamily: 'Archivo,sans-serif', fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>
            {category.total.toLocaleString()}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
          background: BRAND.greenPale, color: BRAND.blue,
        }}>
          {category.pct}%
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Colonnes</div>
          <CompactColumnChart data={category.columns} color={color} height={72} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Évolution</div>
          <CompactLineChart labels={category.columns.map((c) => c.label)} data={category.evolution} color={color} height={72} />
        </div>
      </div>
    </div>
  );
}

const SEVERITY_COLORS = {
  critical: { bg: '#FBE6E3', border: 'var(--ko)', dot: 'var(--ko)' },
  high: { bg: '#E8EEF8', border: BRAND.blue, dot: BRAND.blue },
  medium: { bg: BRAND.greenPale, border: BRAND.green, dot: BRAND.greenDark },
};

export function AlertList({ title, items = [], icon }) {
  const colors = SEVERITY_COLORS;
  return (
    <div className="ld-alert-list" style={{
      background: '#fff', border: `1px solid ${BRAND.line}`, borderRadius: 12,
      overflow: 'hidden', boxShadow: 'var(--shadow-sm)', height: '100%',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${BRAND.line}`,
        background: `linear-gradient(135deg, ${BRAND.greenPale}, #fff)`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{icon}</span>
        <strong style={{ fontSize: 13, color: BRAND.blue, fontFamily: 'Archivo,sans-serif' }}>{title}</strong>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 700,
          background: items.length > 0 ? BRAND.blue : BRAND.greenPale,
          color: items.length > 0 ? '#fff' : BRAND.blue,
          padding: '2px 8px', borderRadius: 999,
        }}>
          {items.length}
        </span>
      </div>
      <div style={{ padding: '10px 12px', maxHeight: 220, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 16 }}>Aucune alerte</p>
        ) : items.map((item) => {
          const sev = colors[item.severity] || colors.medium;
          return (
            <div key={item.id} style={{
              display: 'flex', gap: 10, padding: '10px 8px',
              borderBottom: `1px solid ${BRAND.line}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sev.dot, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{item.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MetricHighlight({ label, value, unit, sub }) {
  return (
    <div className="ld-metric-highlight" style={{
      padding: '18px 20px', background: '#fff', border: `1px solid ${BRAND.line}`,
      borderRadius: 12, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Archivo,sans-serif', fontSize: 30, fontWeight: 800, color: BRAND.blue, marginTop: 6 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: 16, fontWeight: 600 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
