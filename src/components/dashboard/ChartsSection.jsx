import React from 'react';

const CHART_BLUE = '#0B3D91';
const CHART_GREEN = '#22C55E';
const CHART_BLUE_LIGHT = '#3B6BB5';
const CHART_GREEN_LIGHT = '#4ADE80';

function BarChart({ data, height = 180, color = CHART_GREEN }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: CHART_BLUE }}>{d.value}</span>
          <div style={{
            width: '100%', maxWidth: 52, height: `${Math.max(4, (d.value / max) * 100)}%`,
            background: d.color || `linear-gradient(180deg, ${color}, ${CHART_GREEN_LIGHT})`,
            borderRadius: '8px 8px 0 0', transition: 'height 0.7s ease',
            animation: `growBar 0.7s ease ${i * 0.08}s both`,
          }} />
          <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 500 }}>{d.label}</span>
        </div>
      ))}
      <style>{`@keyframes growBar { from{height:0} }`}</style>
    </div>
  );
}

function LineChart({ data, height = 160 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d.value / max) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height, preserveAspectRatio: 'none' }}>
      <polyline fill="none" stroke={CHART_GREEN} strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="url(#lineGrad)" stroke="none" points={`0,100 ${points} 100,100`} opacity="0.15" />
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_GREEN} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PieChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;
  const colors = [CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT, CHART_GREEN_LIGHT];
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const start = angle;
    angle += pct * 360;
    const large = pct > 0.5 ? 1 : 0;
    const r = 40;
    const x1 = 50 + r * Math.cos((start - 90) * Math.PI / 180);
    const y1 = 50 + r * Math.sin((start - 90) * Math.PI / 180);
    const x2 = 50 + r * Math.cos((angle - 90) * Math.PI / 180);
    const y2 = 50 + r * Math.sin((angle - 90) * Math.PI / 180);
    return { path: `M50,50 L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: d.color || colors[i % colors.length], label: d.label, pct: Math.round(pct * 100), value: d.value };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx="50" cy="50" r="18" fill="#fff" />
      </svg>
      <div style={{ display: 'grid', gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>{s.label}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{s.value} ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ label, value, max = 100, color = CHART_GREEN, sub }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
        <span style={{ fontWeight: 600, color: CHART_BLUE }}>{label}</span>
        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${CHART_GREEN_LIGHT})`,
          borderRadius: 999, transition: 'width 0.9s ease',
        }} />
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function DeptCard({ icon, title, metrics, color }) {
  return (
    <div style={{
      padding: 20, borderRadius: 12, background: 'var(--bg)',
      border: '1px solid var(--line)', transition: '0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
          background: `${color}18`, fontSize: 16,
        }}>{icon}</span>
        <strong style={{ fontSize: 14, color: CHART_BLUE }}>{title}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
            <div style={{ fontFamily: 'Archivo,sans-serif', fontSize: 22, fontWeight: 800, color: m.color || color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChartsSection({ pos, dossiers, docsByPo, showDepartments = true }) {
  const totalDocs = Object.values(docsByPo).reduce((s, po) => s + Object.keys(po).length, 0);
  const validated = dossiers.filter((d) => d.validéAppro).length;
  const pending = dossiers.length - validated;
  const transitCount = dossiers.filter((d) => d.transitCree).length;
  const treasuryCount = dossiers.filter((d) => d.predomDemandée || d.chequeDemandé).length;
  const completed = dossiers.filter((d) => d.dateDedouanement).length;

  const barData = [
    { label: 'PO', value: pos.length, color: `linear-gradient(180deg, ${CHART_BLUE}, ${CHART_BLUE_LIGHT})` },
    { label: 'Docs', value: totalDocs, color: `linear-gradient(180deg, ${CHART_GREEN}, ${CHART_GREEN_LIGHT})` },
    { label: 'Validés', value: validated, color: `linear-gradient(180deg, ${CHART_GREEN}, #86EFAC)` },
    { label: 'Transit', value: transitCount, color: `linear-gradient(180deg, ${CHART_BLUE_LIGHT}, #93C5FD)` },
    { label: 'Trésor.', value: treasuryCount, color: `linear-gradient(180deg, ${CHART_BLUE}, ${CHART_GREEN_LIGHT})` },
    { label: 'Clôturés', value: completed, color: `linear-gradient(180deg, ${CHART_GREEN}, ${CHART_BLUE})` },
  ];

  const lineData = [
    { label: 'S1', value: Math.max(1, dossiers.length) },
    { label: 'S2', value: Math.max(1, validated) },
    { label: 'S3', value: Math.max(1, transitCount) },
    { label: 'S4', value: Math.max(1, completed || dossiers.length) },
  ];

  const pieData = [
    { label: 'Validés', value: validated || 0, color: CHART_BLUE },
    { label: 'En attente', value: pending || 0, color: CHART_GREEN },
    { label: 'Transit', value: transitCount || 0, color: CHART_BLUE_LIGHT },
    { label: 'Trésorerie', value: treasuryCount || 0, color: CHART_GREEN_LIGHT },
  ].filter((d) => d.value > 0);
  if (pieData.length === 0) pieData.push({ label: 'Aucun', value: 1, color: CHART_GREEN_LIGHT });

  const perfPct = dossiers.length ? Math.round((validated / dossiers.length) * 100) : 0;
  const domCount = dossiers.filter((d) => d.domiciliée).length;
  const chequeValides = dossiers.filter((d) => d.chequeValidé).length;

  const fournisseurDocs = totalDocs;
  const approPending = dossiers.filter((d) => !d.validéAppro).length;
  const approValidated = validated;
  const transitDeclared = dossiers.filter((d) => d.declaration).length;
  const transitCleared = dossiers.filter((d) => d.dateDedouanement).length;
  const tresPending = dossiers.filter((d) => d.predomDemandée && !d.domiciliée).length;
  const tresClosed = domCount;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <style>{`
        .ld-chart-card {
          background: #fff; border: 1px solid var(--line); border-radius: 14px;
          overflow: hidden; box-shadow: 0 2px 8px rgba(11,61,145,0.05);
          transition: box-shadow 0.25s;
        }
        .ld-chart-card:hover { box-shadow: 0 8px 24px rgba(11,61,145,0.1); }
        .ld-chart-header {
          padding: 15px 20px; background: linear-gradient(135deg, #EFF6FF, #F0FDF4);
          color: ${CHART_BLUE}; font-family: Archivo, sans-serif; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .ld-chart-body { padding: 20px; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div className="ld-chart-card">
          <div className="ld-chart-header"> Volume opérationnel</div>
          <div className="ld-chart-body"><BarChart data={barData} /></div>
        </div>
        <div className="ld-chart-card">
          <div className="ld-chart-header"> Progression hebdomadaire</div>
          <div className="ld-chart-body"><LineChart data={lineData} /></div>
        </div>
        <div className="ld-chart-card">
          <div className="ld-chart-header"> Répartition des dossiers</div>
          <div className="ld-chart-body"><PieChart data={pieData} /></div>
        </div>
      </div>

      <div className="ld-chart-card">
        <div className="ld-chart-header"> Indicateurs de performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 0 }}>
          <ProgressCard label="Validation documentaire" value={validated} max={dossiers.length || 1} sub={`${validated} / ${dossiers.length} dossiers`} />
          <ProgressCard label="Transmission transit" value={transitCount} max={dossiers.length || 1} color={CHART_BLUE} sub={`${transitCount} dossiers en transit`} />
          <ProgressCard label="Performance globale" value={perfPct} max={100} sub="Taux de validation appro" />
          <ProgressCard label="Domiciliations clôturées" value={domCount} max={dossiers.filter((d) => d.predomDemandée).length || 1} color={CHART_BLUE} sub={`${chequeValides} chèques émis`} />
        </div>
      </div>

      {showDepartments && (
        <div className="ld-chart-card">
          <div className="ld-chart-header"> Activité par département</div>
          <div className="ld-chart-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            <DeptCard    title="Fournisseur" color={CHART_GREEN} metrics={[
              { label: 'Documents', value: fournisseurDocs },
              { label: 'Dossiers envoyés', value: dossiers.length },
            ]} />
            <DeptCard    title="Approvisionnement" color={CHART_BLUE} metrics={[
              { label: 'Validés', value: approValidated, color: CHART_GREEN },
              { label: 'En attente', value: approPending, color: CHART_BLUE_LIGHT },
            ]} />
            <DeptCard    title="Transit" color={CHART_BLUE} metrics={[
              { label: 'Déclarés', value: transitDeclared },
              { label: 'Dédouanés', value: transitCleared, color: CHART_GREEN },
            ]} />
            <DeptCard    title="Trésorerie" color={CHART_GREEN} metrics={[
              { label: 'En cours', value: tresPending, color: CHART_BLUE_LIGHT },
              { label: 'Clôturées', value: tresClosed, color: CHART_GREEN },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

export { BarChart, LineChart, PieChart, ProgressCard, DeptCard };
