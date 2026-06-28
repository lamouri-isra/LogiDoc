import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ModernLineChart, DoughnutChart, ChartCard, KpiCard,
  VerticalBarChart, HorizontalBarChart,
  DashboardAlertTable,
  CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT, CHART_GREEN_LIGHT,
} from './ModernCharts';
import { computeDashboardMetrics, exportDashboardCsv } from '../../utils/dashboardMetrics';
import { BRAND } from '../../data/theme';

const DEFAULT_FILTERS = { periode: '6m', fournisseur: '', entite: '', port: '' };

function formatMontant(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toLocaleString();
}

const DELAIS_COLORS = [CHART_BLUE, CHART_GREEN];
const PERF_COLORS = [CHART_BLUE_LIGHT, CHART_GREEN];
const COUTS_COLORS = [CHART_BLUE, CHART_GREEN];
const FRAIS_DONUT_COLORS = [CHART_BLUE, CHART_GREEN, CHART_BLUE_LIGHT, CHART_GREEN_LIGHT];

function delayStatus(value, goodMax, warnMax) {
  if (value <= goodMax) return 'good';
  if (value <= warnMax) return 'warning';
  return 'critical';
}

function pctStatus(value, goodMin, warnMin) {
  if (value >= goodMin) return 'good';
  if (value >= warnMin) return 'warning';
  return 'critical';
}

export default function ExecutiveDashboard({ pos, dossiers }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(
    () => computeDashboardMetrics(pos, dossiers, filters),
    [pos, dossiers, filters, lastRefresh, liveTick],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setLastRefresh(new Date());
      setRefreshing(false);
    }, 600);
  }, []);

  const handleExportExcel = useCallback(() => {
    const csv = exportDashboardCsv(metrics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LogiDoc_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const delaisSeries = metrics.delaisEvolution.series.map((s, i) => ({
    ...s,
    color: DELAIS_COLORS[i],
  }));

  const perfSeries = metrics.performanceEvolution.series.map((s, i) => ({
    ...s,
    color: PERF_COLORS[i],
  }));

  const coutsSeries = metrics.coutsEvolutionMensuelle.series.map((s, i) => ({
    ...s,
    color: COUTS_COLORS[i],
  }));

  const fraisDonut = metrics.fraisApproche.donut.map((d, i) => ({
    ...d,
    color: FRAIS_DONUT_COLORS[i],
  }));

  const fraisEvolutionSeries = metrics.fraisApproche.categories.map((cat, i) => ({
    key: cat.key,
    label: cat.label,
    data: cat.evolution,
    color: FRAIS_DONUT_COLORS[i % FRAIS_DONUT_COLORS.length],
  }));

  const { kpis } = metrics;

  return (
    <div className="ld-exec-dashboard ld-exec-cockpit">
      {/* Toolbar */}
      <div className="ld-exec-toolbar no-print">
        <div className="ld-exec-toolbar__label">
          <div className="ld-exec-toolbar__title">Filtres globaux</div>
          <div className="ld-exec-toolbar__hint">Période · Fournisseur · Entité · Port</div>
        </div>
        <select value={filters.periode} onChange={(e) => setFilters((f) => ({ ...f, periode: e.target.value }))} className="ld-exec-select" aria-label="Période">
          <option value="3m">3 derniers mois</option>
          <option value="6m">6 derniers mois</option>
          <option value="12m">12 derniers mois</option>
        </select>
        <select value={filters.fournisseur} onChange={(e) => setFilters((f) => ({ ...f, fournisseur: e.target.value }))} className="ld-exec-select" aria-label="Fournisseur">
          <option value="">Tous fournisseurs</option>
          {metrics.filterOptions.fournisseurs.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filters.entite} onChange={(e) => setFilters((f) => ({ ...f, entite: e.target.value }))} className="ld-exec-select" aria-label="Entité">
          <option value="">Toutes entités</option>
          {metrics.filterOptions.entites.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filters.port} onChange={(e) => setFilters((f) => ({ ...f, port: e.target.value }))} className="ld-exec-select" aria-label="Port">
          <option value="">Tous ports</option>
          {metrics.filterOptions.ports.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="button" className="btn btn-g ld-exec-btn" onClick={resetFilters}>
          Réinitialiser
        </button>
        <div className="ld-exec-toolbar__actions">
          <button type="button" className="btn btn-g ld-exec-btn" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '⟳ Actualisation…' : '⟳ Actualiser'}
          </button>
          <button type="button" className="btn btn-g ld-exec-btn" onClick={handleExportExcel}>
             Excel
          </button>
        </div>
      </div>

      <div className="ld-live-badge no-print">
        <span className="ld-live-badge__dot" />
        Temps réel — Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
      </div>

      {/* ROW 1 — KPI Cards */}
      <section className="ld-cockpit-row" aria-label="Indicateurs clés">
        <header className="ld-cockpit-row__header">
          <h2 className="ld-cockpit-row__title">Indicateurs clés</h2>
          <p className="ld-cockpit-row__subtitle">Vue synthétique des performances supply chain</p>
        </header>
        <div className="ld-dash-kpi-grid ld-dash-kpi-grid--cockpit">
          <KpiCard  label="Nombre total de dossiers" value={kpis.totalDossiers.value} change={kpis.totalDossiers.change} trend={kpis.totalDossiers.trend} status="info" />
          <KpiCard   label="Dossiers en cours" value={kpis.dossiersEnCours.value} change={kpis.dossiersEnCours.change} trend={kpis.dossiersEnCours.trend} status={kpis.dossiersEnCours.value > 0 ? 'warning' : 'good'} />
          <KpiCard   label="Dossiers clôturés" value={kpis.dossiersClotures.value} change={kpis.dossiersClotures.change} trend={kpis.dossiersClotures.trend} status="good" />
          <KpiCard   label="Délai moyen dédouanement" value={kpis.delaiMoyenDedouanement.value} unit=" j" change={kpis.delaiMoyenDedouanement.change} trend={kpis.delaiMoyenDedouanement.trend} invertTrend status={delayStatus(kpis.delaiMoyenDedouanement.value, 7, 10)} />
          <KpiCard   label="Délai moyen transit" value={kpis.delaiMoyenTransit.value} unit=" j" change={kpis.delaiMoyenTransit.change} trend={kpis.delaiMoyenTransit.trend} invertTrend status={delayStatus(kpis.delaiMoyenTransit.value, 10, 15)} />
          <KpiCard   label="Coût total importation" value={kpis.coutTotalImportation.value} change={kpis.coutTotalImportation.change} trend={kpis.coutTotalImportation.trend} formatValue={formatMontant} status="info" />
          <KpiCard   label="Taux conformité documentaire" value={kpis.tauxConformiteDocumentaire.value} unit="%" change={kpis.tauxConformiteDocumentaire.change} trend={kpis.tauxConformiteDocumentaire.trend} status={pctStatus(kpis.tauxConformiteDocumentaire.value, 85, 70)} />
          <KpiCard   label="Taux livraison à temps" value={kpis.tauxLivraisonATemps.value} unit="%" change={kpis.tauxLivraisonATemps.change} trend={kpis.tauxLivraisonATemps.trend} status={pctStatus(kpis.tauxLivraisonATemps.value, 80, 60)} />
          <KpiCard   label="Délai moyen déclaration" value={metrics.delaiMoyenDeclaration} unit=" j" status={delayStatus(metrics.delaiMoyenDeclaration, 5, 10)} sub="Arrivée → Déclaration douanière" />
          <KpiCard   label="Coût moyen par dossier" value={metrics.coutMoyenParDossier} unit=" DZD eq." status="info" sub={`Sur ${kpis.totalDossiers.value} dossier(s) actifs`} />
          {metrics.fraisApproche.categories.map((cat) => (
            <KpiCard
              key={cat.key}
              icon={cat.key === 'magasinage' ? '' : cat.key === 'amendes' ? '' : cat.key === 'surestaries' ? '' : ''}
              label={cat.label}
              value={cat.total}
              formatValue={formatMontant}
              status="info"
              sub={`${cat.pct}% des frais d'approche`}
            />
          ))}
        </div>
      </section>

      {/* ROW 2 — Tables */}
      <section className="ld-cockpit-row" aria-label="Suivi détaillé">
        <header className="ld-cockpit-row__header">
          <h2 className="ld-cockpit-row__title">Suivi détaillé</h2>
          <p className="ld-cockpit-row__subtitle">Alertes opérationnelles et points de vigilance</p>
        </header>
        <div className="ld-dash-tables-grid">
          <DashboardAlertTable title="Dossiers en retard"   items={metrics.alertes.dossiersEnRetard} />
          <DashboardAlertTable title="Déclarations en retard"   items={metrics.alertes.declarationsEnRetard} />
          <DashboardAlertTable title="Dédouanements critiques"   items={metrics.alertes.dedouanementsCritiques} />
          <DashboardAlertTable title="Dépassement frais d'approche"   items={metrics.alertes.depassementFraisApproche} />
          <DashboardAlertTable title="KPI critiques"   items={metrics.alertes.kpiCritiques} />
        </div>
      </section>

      {/* ROW 3 — Visual Analytics */}
      <section className="ld-cockpit-row ld-cockpit-row--charts" aria-label="Analyses visuelles">
        <header className="ld-cockpit-row__header">
          <h2 className="ld-cockpit-row__title">Analyses visuelles</h2>
          <p className="ld-cockpit-row__subtitle">Tendances, comparaisons et répartitions</p>
        </header>

        <div className="ld-cockpit-chart-group">
          <h3 className="ld-cockpit-chart-group__label">Tendances temporelles</h3>
          <div className="ld-dash-charts-grid ld-dash-charts-grid--2">
            <ChartCard title="Évolution des délais par mois" subtitle="Transit · Dédouanement"  >
            <VerticalBarChart
  data={metrics.delaisEvolution.labels.map((label, i) => ({
    label,
    value: delaisSeries[0].data[i]
  }))}
  height={220}
/>
            </ChartCard>
            <ChartCard title="Évolution des performances" subtitle="Taux de clôture · Dossiers traités"  >
            <VerticalBarChart
  data={metrics.delaisEvolution.labels.map((label, i) => ({
    label,
    value: delaisSeries[0].data[i]
  }))}
  height={220}
/><DoughnutChart
  data={[
    {
      label: 'Transit',
      value: delaisSeries[0].data.reduce((a,b)=>a+b,0)
    },
    {
      label: 'Dédouanement',
      value: delaisSeries[1].data.reduce((a,b)=>a+b,0)
    }
  ]}
  size={160}
/>
            </ChartCard>
            <ChartCard title="Évolution mensuelle des coûts" subtitle="Achats · Frais d'approche"  >
            <DoughnutChart
  data={[
    {
      label: 'Transit',
      value: delaisSeries[0].data.reduce((a,b)=>a+b,0)
    },
    {
      label: 'Dédouanement',
      value: delaisSeries[1].data.reduce((a,b)=>a+b,0)
    }
  ]}
  size={160}
/>
            </ChartCard>
            <ChartCard title="Évolution mensuelle des frais" subtitle="Magasinage · Amendes · Surestaries · Autres"  >
            <DoughnutChart
  data={[
    {
      label: 'Transit',
      value: delaisSeries[0].data.reduce((a,b)=>a+b,0)
    },
    {
      label: 'Dédouanement',
      value: delaisSeries[1].data.reduce((a,b)=>a+b,0)
    }
  ]}
  size={160}
/>
            </ChartCard>
          </div>
        </div>

        <div className="ld-cockpit-chart-group">
          <h3 className="ld-cockpit-chart-group__label">Comparaisons</h3>
          <div className="ld-dash-charts-grid">
            <ChartCard title="Dossiers par POD" subtitle="Répartition par commande"  >
              <VerticalBarChart data={metrics.dossiersParPO} height={220} />
            </ChartCard>
            <ChartCard title="Dossiers par transitaire" subtitle="Volume par opérateur"  >
              <VerticalBarChart data={metrics.dossiersParTransitaire} height={220} />
            </ChartCard>
            <ChartCard title="Comparaison par port" subtitle="Délai moyen dédouanement par port"  >
              <HorizontalBarChart data={metrics.comparaisonParPort.map((d) => ({ label: d.label, value: d.value }))} />
            </ChartCard>
            <ChartCard title="Comparatif des 4 catégories" subtitle="Montant total par type de frais"  >
              <VerticalBarChart data={metrics.fraisApproche.comparatif} height={220} />
            </ChartCard>
            <ChartCard title="Coût par port" subtitle="Montant total des achats"  >
              <VerticalBarChart data={metrics.coutParPort} height={220} />
            </ChartCard>
            <ChartCard title="Coût par fournisseur" subtitle="Top fournisseurs par montant" icon="🏭">
              <VerticalBarChart data={metrics.coutParFournisseur} height={220} />
            </ChartCard>
            <ChartCard title="Top coûts import" subtitle="Principaux postes de dépense"   className="ld-chart-card--wide">
              <HorizontalBarChart data={metrics.topCoutsImport} />
            </ChartCard>
          </div>
        </div>

        <div className="ld-cockpit-chart-group">
          <h3 className="ld-cockpit-chart-group__label">Répartitions</h3>
          <div className="ld-dash-charts-grid ld-dash-charts-grid--2">
            <ChartCard title="Répartition par POD" subtitle="Distribution des dossiers"  >
              <DoughnutChart
                data={metrics.repartitionPOD.map((d, i) => ({ ...d, color: FRAIS_DONUT_COLORS[i % 4] }))}
                size={160}
              />
            </ChartCard>
            <ChartCard title="Répartition globale des frais" subtitle="Magasinage · Amendes · Surestaries · Autres"  >
              <DoughnutChart data={fraisDonut} size={160} />
            </ChartCard>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes ldPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .ld-exec-kpi { break-inside: avoid; }
        .ld-chart-card { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
    </div>
  );
}
