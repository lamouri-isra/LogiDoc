import React, { useMemo, useState } from 'react';
import { ModernLineChart, DoughnutChart, CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT } from './ModernCharts';
import { computeCosts } from '../../utils/dashboardMetrics';
import { extractPort, ApproStyles } from '../appro/shared';

export default function FraisApprocheSection({ pos, dossiers }) {
  const [filterPeriode, setFilterPeriode] = useState('6m');
  const [filterFournisseur, setFilterFournisseur] = useState('');
  const [filterPort, setFilterPort] = useState('');
  const [filterEntite, setFilterEntite] = useState('');

  const fournisseurs = useMemo(() => [...new Set(pos.map((p) => p.fournisseur))], [pos]);
  const entites = useMemo(() => [...new Set(pos.map((p) => p.entite))], [pos]);
  const ports = useMemo(() => [...new Set(pos.map((p) => extractPort(p.incoterm)?.nom).filter(Boolean))], [pos]);

  const filteredPos = useMemo(() => pos.filter((p) => {
    if (filterFournisseur && p.fournisseur !== filterFournisseur) return false;
    if (filterEntite && p.entite !== filterEntite) return false;
    if (filterPort) {
      const port = extractPort(p.incoterm);
      if (!port || port.nom !== filterPort) return false;
    }
    return true;
  }), [pos, filterFournisseur, filterEntite, filterPort]);

  const costs = useMemo(() => {
    let totalMag = 0; let totalAmendes = 0; let totalSur = 0;
    filteredPos.forEach((po) => {
      const d = dossiers.find((x) => x.poId === po.id);
      const c = computeCosts(po, d);
      totalMag += c.mag;
      totalAmendes += c.amendes;
      totalSur += c.sur;
    });
    const totalGlobal = totalMag + totalAmendes + totalSur;
    const fraisPct = filteredPos.length
      ? ((totalGlobal / filteredPos.reduce((s, p) => s + p.montant, 0)) * 100).toFixed(2)
      : '0.00';
    return { totalMag, totalAmendes, totalSur, totalGlobal, fraisPct };
  }, [filteredPos, dossiers]);

  const monthlyData = useMemo(() => {
    const monthCount = filterPeriode === '3m' ? 3 : filterPeriode === '12m' ? 12 : 6;
    const now = new Date();
    return Array.from({ length: monthCount }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
      const label = MONTHS[d.getMonth()];
      const monthPos = filteredPos.filter((p) => {
        const em = new Date(p.dateEmission);
        return em.getMonth() === d.getMonth() && em.getFullYear() === d.getFullYear();
      });
      const base = monthPos.length || Math.max(1, Math.round(filteredPos.length / monthCount));
      const factor = base / Math.max(filteredPos.length, 1);
      const wave = 0.65 + ((i % 4) + 1) * 0.08;
      return {
        label,
        magasinage: Math.round(costs.totalMag * factor * wave),
        amendes: Math.round(costs.totalAmendes * factor * (wave - 0.05)),
        surestaries: Math.round(costs.totalSur * factor * (wave - 0.1)),
      };
    });
  }, [filteredPos, costs, filterPeriode]);

  const lineSeries = useMemo(() => [
    { key: 'mag', label: 'Magasinage', color: CHART_BLUE, data: monthlyData.map((m) => m.magasinage) },
    { key: 'amendes', label: 'Amendes', color: CHART_GREEN, data: monthlyData.map((m) => m.amendes) },
    { key: 'sur', label: 'Surestaries', color: CHART_BLUE_LIGHT, data: monthlyData.map((m) => m.surestaries) },
  ], [monthlyData]);

  const pieData = [
    { label: 'Magasinage', value: costs.totalMag, color: CHART_BLUE },
    { label: 'Amendes', value: costs.totalAmendes, color: CHART_GREEN },
    { label: 'Surestaries', value: costs.totalSur, color: CHART_BLUE_LIGHT },
  ].filter((d) => d.value > 0);

  const resetFilters = () => {
    setFilterPeriode('6m');
    setFilterFournisseur('');
    setFilterPort('');
    setFilterEntite('');
  };

  const kpis = [
    { label: 'Total Magasinage', value: costs.totalMag, color: CHART_BLUE, unit: ' DZD eq.' },
    { label: 'Total Amendes', value: costs.totalAmendes, color: CHART_GREEN, unit: ' DZD eq.' },
    { label: 'Total Surestaries', value: costs.totalSur, color: CHART_BLUE_LIGHT, unit: ' DZD eq.' },
    { label: 'Coût Global', value: costs.totalGlobal, color: CHART_GREEN, unit: ' DZD eq.', sub: `Frais d'approche : ${costs.fraisPct}%` },
  ];

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <ApproStyles />
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--line)',
        background: 'linear-gradient(135deg, #0B3D91, #0B1F3A)', color: '#fff',
      }}>
        <h3 style={{ fontSize: 15, margin: 0, fontFamily: 'Archivo,sans-serif' }}>Analyse Frais d&apos;Approche</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
          Magasinage · Amendes · Surestaries · Total Frais d&apos;Approche
        </p>
      </div>

      <div className="ld-appro-toolbar" style={{ background: '#fafbfa' }}>
        <div className="ld-appro-filters" style={{ width: '100%' }}>
          <select value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} aria-label="Période">
            <option value="3m">3 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="12m">12 derniers mois</option>
          </select>
          <select value={filterFournisseur} onChange={(e) => setFilterFournisseur(e.target.value)} aria-label="Fournisseur">
            <option value="">Tous fournisseurs</option>
            {fournisseurs.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filterPort} onChange={(e) => setFilterPort(e.target.value)} aria-label="Port">
            <option value="">Tous ports</option>
            {ports.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterEntite} onChange={(e) => setFilterEntite(e.target.value)} aria-label="Entité">
            <option value="">Toutes entités</option>
            {entites.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <button type="button" className="btn btn-g" style={{ padding: '8px 12px', fontSize: 12 }} onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="ld-kpi-mini">
            <div className="ld-kpi-mini-label">{k.label}</div>
            <div className="ld-kpi-mini-value" style={{ color: k.color }}>
              {k.value.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 600 }}>{k.unit}</span>
            </div>
            {k.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 18px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <div style={{ padding: 18, border: '1px solid var(--line)', borderRadius: 12, background: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B3D91', marginBottom: 16 }}>
            Comparaison mensuelle
          </div>
          <ModernLineChart
            labels={monthlyData.map((m) => m.label)}
            series={lineSeries}
            height={200}
          />
        </div>
        <div style={{ padding: 18, border: '1px solid var(--line)', borderRadius: 12, background: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B3D91', marginBottom: 16 }}>
            Répartition des coûts
          </div>
          {pieData.length > 0 ? (
            <DoughnutChart data={pieData} size={150} />
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Aucune donnée disponible pour les filtres sélectionnés.</p>
          )}
        </div>
      </div>
    </div>
  );
}
