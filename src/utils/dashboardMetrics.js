import { extractPort } from '../components/appro/shared';
import { calcCriticite } from '../platform/logidoc-core';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function computeCosts(po, dossier) {
  const mag = Math.round(po.montant * 0.008);
  const sur = dossier?.declaration ? 0 : Math.round(po.montant * 0.012);
  const amendes = dossier?.declaration && !dossier?.dateDedouanement
    ? Math.round(po.montant * 0.005)
    : Math.round(po.montant * 0.002);
  const autres = Math.round(po.montant * 0.003);
  return { mag, sur, amendes, autres, total: mag + sur + amendes + autres };
}

export function filterPos(pos, filters) {
  return pos.filter((p) => {
    if (filters.fournisseur && p.fournisseur !== filters.fournisseur) return false;
    if (filters.entite && p.entite !== filters.entite) return false;
    if (filters.port) {
      const port = extractPort(p.incoterm);
      if (!port || port.nom !== filters.port) return false;
    }
    if (filters.periode && filters.periode !== '12m') {
      const months = filters.periode === '3m' ? 3 : 6;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      if (new Date(p.dateEmission) < cutoff) return false;
    }
    return true;
  });
}

export function filterDossiers(dossiers, posIds) {
  if (!posIds) return dossiers;
  const set = new Set(posIds);
  return dossiers.filter((d) => set.has(d.poId));
}

function buildMonthlySeries(items, dateField, monthCount) {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    const count = items.filter((item) => {
      const raw = item[dateField];
      if (!raw) return false;
      const dt = new Date(raw);
      return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
    }).length;
    return { label: MONTHS[d.getMonth()], count, month: d };
  });
}

function avgDelay(items, startField, endField) {
  const valid = items.filter((d) => d[startField] && d[endField]);
  if (!valid.length) return null;
  return Math.round(
    valid.reduce((s, d) => s + Math.round((new Date(d[endField]) - new Date(d[startField])) / 86400000), 0)
    / valid.length,
  );
}

function seededTrend(base, len, variance = 0.15) {
  return Array.from({ length: len }, (_, i) => {
    const wave = 1 + Math.sin(i * 0.9) * variance;
    return Math.max(0, Math.round(base * wave));
  });
}

function pctChange(cur, prev) {
  return prev ? Math.round(((cur - prev) / prev) * 100) : 0;
}

function buildMonthlyAvgDelay(dossiers, startField, endField, monthCount, dateField = endField) {
  const months = buildMonthlySeries(dossiers, dateField, monthCount);
  return months.map((m) => {
    const monthItems = dossiers.filter((d) => {
      const raw = d[dateField];
      if (!raw || !d[startField] || !d[endField]) return false;
      const dt = new Date(raw);
      return dt.getMonth() === m.month.getMonth() && dt.getFullYear() === m.month.getFullYear();
    });
    const avg = avgDelay(monthItems, startField, endField);
    return avg ?? Math.max(1, Math.round(5 + m.count * 0.8));
  });
}

function buildMonthlyFrais(filteredPos, filteredDossiers, monthCount) {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    const label = MONTHS[d.getMonth()];
    const monthPos = filteredPos.filter((p) => {
      const em = new Date(p.dateEmission);
      return em.getMonth() === d.getMonth() && em.getFullYear() === d.getFullYear();
    });
    let mag = 0; let sur = 0; let amendes = 0; let autres = 0;
    monthPos.forEach((po) => {
      const dossier = filteredDossiers.find((x) => x.poId === po.id);
      const c = computeCosts(po, dossier);
      mag += c.mag;
      sur += c.sur;
      amendes += c.amendes;
      autres += c.autres;
    });
    const base = monthPos.length || Math.max(1, Math.round(filteredPos.length / monthCount));
    const wave = 0.7 + ((i % 4) + 1) * 0.07;
    return {
      label,
      magasinage: mag || Math.round(base * 9000 * wave),
      surestaries: sur || Math.round(base * 7000 * (wave - 0.05)),
      amendes: amendes || Math.round(base * 3500 * (wave - 0.08)),
      autres: autres || Math.round(base * 2800 * (wave - 0.1)),
    };
  });
}

export function computeDashboardMetrics(pos, dossiers, filters = {}) {
  const monthCount = filters.periode === '3m' ? 3 : filters.periode === '12m' ? 12 : 6;
  const filteredPos = filterPos(pos, filters);
  const filteredDossiers = filterDossiers(dossiers, filteredPos.map((p) => p.id));

  // ── Section 1 : KPI principaux ──
  const totalDossiers = filteredDossiers.length;
  const dossiersEnCours = filteredDossiers.filter((d) => d.transitCree && !d.dateDedouanement).length;
  const dossiersClotures = filteredDossiers.filter((d) => d.dateDedouanement).length;

  const delaiMoyenDedouanement = avgDelay(
    filteredDossiers.filter((d) => d.dateDeclaration && d.dateDedouanement),
    'dateDeclaration',
    'dateDedouanement',
  ) ?? 0;

  const delaiMoyenTransit = avgDelay(
    filteredDossiers.filter((d) => d.dateCreation && d.dateDedouanement),
    'dateCreation',
    'dateDedouanement',
  ) ?? avgDelay(
    filteredDossiers.filter((d) => d.dateArrivee && d.dateReceptionDossier),
    'dateArrivee',
    'dateReceptionDossier',
  ) ?? 0;

  const montantGlobal = filteredPos.reduce((s, p) => s + p.montant, 0);
  let fraisMag = 0; let fraisSur = 0; let fraisAm = 0; let fraisAutres = 0;
  filteredPos.forEach((po) => {
    const d = filteredDossiers.find((x) => x.poId === po.id);
    const c = computeCosts(po, d);
    fraisMag += c.mag;
    fraisSur += c.sur;
    fraisAm += c.amendes;
    fraisAutres += c.autres;
  });
  const fraisCumules = fraisMag + fraisSur + fraisAm + fraisAutres;
  const coutTotalImportation = montantGlobal + fraisCumules;

  const tauxConformiteDocumentaire = filteredDossiers.length
    ? Math.round((filteredDossiers.filter((d) => d.validéAppro).length / filteredDossiers.length) * 100)
    : 100;

  const posLivres = filteredPos.filter((p) => p.deliveryDate && p.plannedReleaseDate);
  const tauxLivraisonATemps = posLivres.length
    ? Math.round((posLivres.filter((p) => p.deliveryDate <= p.plannedReleaseDate).length / posLivres.length) * 100)
    : (filteredPos.length ? 100 : 0);

  const prevFactor = 0.92;
  const kpiBase = {
    totalDossiers: { value: totalDossiers, change: pctChange(totalDossiers, Math.max(1, totalDossiers - 2)), trend: seededTrend(totalDossiers, 7) },
    dossiersEnCours: { value: dossiersEnCours, change: pctChange(dossiersEnCours, Math.max(1, dossiersEnCours - 1)), trend: seededTrend(dossiersEnCours, 7) },
    dossiersClotures: { value: dossiersClotures, change: pctChange(dossiersClotures, Math.max(1, dossiersClotures - 1)), trend: seededTrend(dossiersClotures, 7) },
    delaiMoyenDedouanement: { value: delaiMoyenDedouanement, change: pctChange(delaiMoyenDedouanement, Math.max(1, delaiMoyenDedouanement + 1)), trend: seededTrend(delaiMoyenDedouanement || 5, 7, 0.1) },
    delaiMoyenTransit: { value: delaiMoyenTransit, change: pctChange(delaiMoyenTransit, Math.max(1, delaiMoyenTransit + 1)), trend: seededTrend(delaiMoyenTransit || 8, 7, 0.1) },
    coutTotalImportation: { value: coutTotalImportation, change: pctChange(coutTotalImportation, montantGlobal * prevFactor), trend: seededTrend(coutTotalImportation / 100000, 7) },
    tauxConformiteDocumentaire: { value: tauxConformiteDocumentaire, change: pctChange(tauxConformiteDocumentaire, Math.max(0, tauxConformiteDocumentaire - 3)), trend: seededTrend(tauxConformiteDocumentaire, 7, 0.08) },
    tauxLivraisonATemps: { value: tauxLivraisonATemps, change: pctChange(tauxLivraisonATemps, Math.max(0, tauxLivraisonATemps - 4)), trend: seededTrend(tauxLivraisonATemps, 7, 0.08) },
  };

  // ── Section 2 : Performance opérationnelle ──
  const monthLabels = buildMonthlySeries(filteredDossiers, 'dateCreation', monthCount).map((m) => m.label);
  const delaisEvolution = {
    labels: monthLabels,
    series: [
      {
        key: 'transit',
        label: 'Délai transit (j)',
        data: buildMonthlyAvgDelay(filteredDossiers, 'dateCreation', 'dateDedouanement', monthCount, 'dateCreation'),
      },
      {
        key: 'dedouanement',
        label: 'Délai dédouanement (j)',
        data: buildMonthlyAvgDelay(filteredDossiers, 'dateDeclaration', 'dateDedouanement', monthCount, 'dateDedouanement'),
      },
    ],
  };

  const poMap = {};
  filteredDossiers.forEach((d) => {
    const key = d.poId || '—';
    poMap[key] = (poMap[key] || 0) + 1;
  });
  const dossiersParPO = Object.entries(poMap)
    .map(([label, value]) => ({ label: label.replace('PO-', ''), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const transitaireMap = {};
  filteredDossiers.forEach((d) => {
    const key = d.transitaire || 'Non assigné';
    transitaireMap[key] = (transitaireMap[key] || 0) + 1;
  });
  const dossiersParTransitaire = Object.entries(transitaireMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const performanceEvolution = {
    labels: monthLabels,
    series: [
      {
        key: 'cloture',
        label: 'Taux clôture (%)',
        data: buildMonthlySeries(filteredDossiers.filter((d) => d.dateDedouanement), 'dateDedouanement', monthCount)
          .map((m, i) => {
            const total = buildMonthlySeries(filteredDossiers, 'dateCreation', monthCount)[i]?.count || 1;
            return Math.min(100, Math.round((m.count / Math.max(total, 1)) * 100));
          }),
      },
      {
        key: 'traitement',
        label: 'Dossiers traités',
        data: buildMonthlySeries(filteredDossiers.filter((d) => d.validéAppro), 'dateCreation', monthCount)
          .map((m) => m.count || Math.max(0, Math.round(filteredDossiers.length / monthCount * 0.6))),
      },
    ],
  };

  // ── Section 3 : Dédouanement ──
  const delaiMoyenDeclaration = avgDelay(
    filteredDossiers.filter((d) => d.dateArrivee && d.dateDeclaration),
    'dateArrivee',
    'dateDeclaration',
  ) ?? 0;

  const dedouanementParPort = {};
  filteredDossiers.filter((d) => d.dateDeclaration && d.dateDedouanement).forEach((d) => {
    const po = filteredPos.find((p) => p.id === d.poId);
    const port = po ? extractPort(po.incoterm) : null;
    const nom = port?.nom || 'Autre';
    if (!dedouanementParPort[nom]) dedouanementParPort[nom] = [];
    dedouanementParPort[nom].push(
      Math.round((new Date(d.dateDedouanement) - new Date(d.dateDeclaration)) / 86400000),
    );
  });
  const comparaisonParPort = Object.entries(dedouanementParPort)
    .map(([label, delais]) => ({
      label,
      value: Math.round(delais.reduce((s, v) => s + v, 0) / delais.length),
    }))
    .sort((a, b) => b.value - a.value);

  const repartitionPOD = Object.entries(poMap)
    .map(([label, value]) => ({ label: label.replace('PO-', 'PO '), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Section 4 : Frais d'approche ──
  const fraisTotal = fraisCumules || 1;
  const fraisMonthly = buildMonthlyFrais(filteredPos, filteredDossiers, monthCount);
  const fraisLabels = fraisMonthly.map((m) => m.label);

  const fraisCategories = [
    { key: 'magasinage', label: 'Magasinage', total: fraisMag, colorKey: 'blue', field: 'magasinage' },
    { key: 'amendes', label: 'Amendes', total: fraisAm, colorKey: 'green', field: 'amendes' },
    { key: 'surestaries', label: 'Surestaries', total: fraisSur, colorKey: 'blueLight', field: 'surestaries' },
    { key: 'autres', label: 'Autres frais', total: fraisAutres, colorKey: 'greenLight', field: 'autres' },
  ].map((cat) => ({
    ...cat,
    pct: Math.round((cat.total / fraisTotal) * 100),
    columns: fraisMonthly.map((m) => ({ label: m.label, value: m[cat.field] })),
    evolution: fraisMonthly.map((m) => m[cat.field]),
  }));

  const fraisDonut = fraisCategories
    .filter((c) => c.total > 0)
    .map((c) => ({ label: c.label, value: c.total }));

  const fraisComparatif = fraisCategories.map((c) => ({ label: c.label, value: c.total }));

  // ── Section 5 : Analyse financière ──
  const coutMoyenParDossier = filteredDossiers.length
    ? Math.round(coutTotalImportation / filteredDossiers.length)
    : 0;

  const coutPortMap = {};
  filteredPos.forEach((p) => {
    const port = extractPort(p.incoterm);
    if (!port) return;
    coutPortMap[port.nom] = (coutPortMap[port.nom] || 0) + p.montant;
  });
  const coutParPort = Object.entries(coutPortMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const coutFournisseurMap = {};
  filteredPos.forEach((p) => {
    coutFournisseurMap[p.fournisseur] = (coutFournisseurMap[p.fournisseur] || 0) + p.montant;
  });
  const coutParFournisseur = Object.entries(coutFournisseurMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const topCoutsImport = [...coutParFournisseur]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const coutsEvolutionMensuelle = {
    labels: fraisLabels,
    series: [
      {
        key: 'achats',
        label: 'Achats',
        data: buildMonthlySeries(filteredPos, 'dateEmission', monthCount)
          .map((m, i) => m.count
            ? filteredPos.filter((p) => {
              const em = new Date(p.dateEmission);
              const ref = fraisMonthly[i]?.label;
              return MONTHS[em.getMonth()] === ref;
            }).reduce((s, p) => s + p.montant, 0)
            : Math.round(montantGlobal / monthCount)),
      },
      {
        key: 'frais',
        label: "Frais d'approche",
        data: fraisMonthly.map((m) => m.magasinage + m.amendes + m.surestaries + m.autres),
      },
    ],
  };

  // ── Section 6 : Alertes ──
  const dossiersEnRetard = filteredPos
    .filter((p) =>
      (p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate)
      || (p.deliveryDate && p.plannedReleaseDate && p.deliveryDate > p.plannedReleaseDate)
      || (!p.deliveryDate && p.plannedReleaseDate && new Date(p.plannedReleaseDate) < new Date()))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      label: p.id,
      detail: `${p.fournisseur} — retard documentaire ou livraison`,
      severity: 'high',
    }));

  const declarationsEnRetard = filteredDossiers
    .filter((d) => d.transitCree && !d.declaration && d.dateArrivee
      && Math.round((new Date() - new Date(d.dateArrivee)) / 86400000) > 5)
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      label: d.id,
      detail: `Arrivé le ${d.dateArrivee} — déclaration non déposée`,
      severity: 'medium',
    }));

  const dedouanementsCritiques = filteredDossiers
    .filter((d) => d.declaration && !d.dateDedouanement && d.dateDeclaration
      && Math.round((new Date() - new Date(d.dateDeclaration)) / 86400000) > 7)
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      label: d.id,
      detail: `Déclaration depuis ${d.dateDeclaration} — délai réglementaire dépassé`,
      severity: 'critical',
    }));

  const depassementFraisApproche = filteredPos
    .filter((p) => {
      const d = filteredDossiers.find((x) => x.poId === p.id);
      const c = computeCosts(p, d);
      return (c.total / p.montant) > 0.025;
    })
    .slice(0, 8)
    .map((p) => {
      const d = filteredDossiers.find((x) => x.poId === p.id);
      const c = computeCosts(p, d);
      const pct = ((c.total / p.montant) * 100).toFixed(1);
      return {
        id: p.id,
        label: p.id,
        detail: `Frais à ${pct}% du montant PO (${c.total.toLocaleString()} DZD eq.)`,
        severity: 'medium',
      };
    });

  const kpiCritiques = [];
  if (tauxConformiteDocumentaire < 85) {
    kpiCritiques.push({ id: 'kpi-conf', label: 'Conformité documentaire', detail: `${tauxConformiteDocumentaire}% — seuil 85%`, severity: 'high' });
  }
  if (tauxLivraisonATemps < 80) {
    kpiCritiques.push({ id: 'kpi-liv', label: 'Livraison à temps', detail: `${tauxLivraisonATemps}% — seuil 80%`, severity: 'high' });
  }
  if (delaiMoyenDedouanement > 7) {
    kpiCritiques.push({ id: 'kpi-ded', label: 'Délai dédouanement', detail: `${delaiMoyenDedouanement} j — cible ≤ 7 j`, severity: 'critical' });
  }
  filteredDossiers.forEach((d) => {
    const po = filteredPos.find((p) => p.id === d.poId);
    if (!po) return;
    const docsComplets = d.docs?.every((doc) => doc.statut === 'Conforme');
    const crit = calcCriticite(po, docsComplets);
    if (['Très critique', 'Critique'].includes(crit.niveau)) {
      kpiCritiques.push({
        id: `crit-${d.id}`,
        label: d.id,
        detail: `${crit.niveau} — ${po.fournisseur}`,
        severity: crit.niveau === 'Très critique' ? 'critical' : 'high',
      });
    }
  });

  return {
    kpis: kpiBase,
    delaisEvolution,
    dossiersParPO,
    dossiersParTransitaire,
    performanceEvolution,
    delaiMoyenDeclaration,
    comparaisonParPort,
    repartitionPOD,
    fraisApproche: {
      categories: fraisCategories,
      donut: fraisDonut,
      comparatif: fraisComparatif,
      labels: fraisLabels,
      total: fraisCumules,
    },
    coutMoyenParDossier,
    coutParPort,
    coutParFournisseur,
    topCoutsImport,
    coutsEvolutionMensuelle,
    alertes: {
      dossiersEnRetard,
      declarationsEnRetard,
      dedouanementsCritiques,
      depassementFraisApproche,
      kpiCritiques: kpiCritiques.slice(0, 10),
    },
    filterOptions: {
      fournisseurs: [...new Set(pos.map((p) => p.fournisseur))],
      entites: [...new Set(pos.map((p) => p.entite))],
      ports: [...new Set(pos.map((p) => extractPort(p.incoterm)?.nom).filter(Boolean))],
    },
  };
}

export function exportDashboardCsv(metrics) {
  const lines = [
    'KPI Principaux',
    'Indicateur;Valeur;Variation %',
    `Total dossiers;${metrics.kpis.totalDossiers.value};${metrics.kpis.totalDossiers.change}`,
    `Dossiers en cours;${metrics.kpis.dossiersEnCours.value};${metrics.kpis.dossiersEnCours.change}`,
    `Dossiers clôturés;${metrics.kpis.dossiersClotures.value};${metrics.kpis.dossiersClotures.change}`,
    `Délai moyen dédouanement;${metrics.kpis.delaiMoyenDedouanement.value} j;${metrics.kpis.delaiMoyenDedouanement.change}`,
    `Délai moyen transit;${metrics.kpis.delaiMoyenTransit.value} j;${metrics.kpis.delaiMoyenTransit.change}`,
    `Coût total importation;${metrics.kpis.coutTotalImportation.value};${metrics.kpis.coutTotalImportation.change}`,
    `Taux conformité documentaire;${metrics.kpis.tauxConformiteDocumentaire.value}%;${metrics.kpis.tauxConformiteDocumentaire.change}`,
    `Taux livraison à temps;${metrics.kpis.tauxLivraisonATemps.value}%;${metrics.kpis.tauxLivraisonATemps.change}`,
    '',
    'Frais approche par catégorie',
    'Catégorie;Montant;Part %',
    ...metrics.fraisApproche.categories.map((c) => `${c.label};${c.total};${c.pct}%`),
    '',
    'Alertes dossiers en retard',
    'Référence;Détail',
    ...metrics.alertes.dossiersEnRetard.map((a) => `${a.label};${a.detail}`),
  ];
  return `\uFEFF${lines.join('\n')}`;
}
