import { calcCriticite } from '../platform/logidoc-core';

const RISQUE_TYPES_APPRO = [
  'Retard documentaire',
  'Non-conformité qualité',
  'Rupture supply chain',
  'Dépendance fournisseur',
  'Retard livraison',
];

const RISQUE_TYPES_TRANSIT = [
  'Retard déclaration douanière',
  'Surestaries portuaires',
  'Blocage douanier',
  'Documents incomplets',
  'Retard dédouanement',
];

const ACTIONS_CORRECTIVES = [
  'Relance fournisseur — documents manquants',
  'Escalade management — revue contrat',
  'Plan de contingence activé',
  'Audit documentaire en cours',
  'Coordination transit — priorisation dossier',
  'Aucune action requise',
];

const RESPONSABLES_APPRO = ['K. Amrani', 'S. Boudiaf', 'M. Khelifi', 'A. Rahmani'];
const RESPONSABLES_TRANSIT = ['Équipe Transit Oran', 'Équipe Transit Alger', 'N. Hamidi', 'R. Cherif'];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return Math.abs(h);
}

function niveauToImpact(niveau) {
  const map = { 'Très critique': 'Élevé', Critique: 'Élevé', Moyen: 'Modéré', Normal: 'Faible' };
  return map[niveau] || 'Modéré';
}

function niveauToProbabilite(niveau, score) {
  if (niveau === 'Très critique') return 'Élevée';
  if (niveau === 'Critique') return 'Élevée';
  if (niveau === 'Moyen') return 'Moyenne';
  return score > 0.2 ? 'Faible' : 'Très faible';
}

function niveauToStatut(niveau) {
  if (['Très critique', 'Critique'].includes(niveau)) return 'En traitement';
  if (niveau === 'Moyen') return 'Surveillé';
  return 'Clôturé';
}

export function buildApproRiskData(pos, dossiers) {
  return pos.map((po) => {
    const docsComplets = dossiers.some((d) => d.poId === po.id && d.validéAppro);
    const crit = calcCriticite(po, docsComplets);
    const h = hashCode(po.id);
    return {
      id: po.id,
      poRef: po.id,
      fournisseur: po.fournisseur,
      risque: RISQUE_TYPES_APPRO[h % RISQUE_TYPES_APPRO.length],
      criticite: crit.niveau,
      impact: niveauToImpact(crit.niveau),
      probabilite: niveauToProbabilite(crit.niveau, crit.score),
      niveauRisque: crit.niveau,
      responsable: RESPONSABLES_APPRO[h % RESPONSABLES_APPRO.length],
      actionsCorrectives: ACTIONS_CORRECTIVES[h % ACTIONS_CORRECTIVES.length],
      statut: niveauToStatut(crit.niveau),
      score: crit.score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildTransitRiskData(dossiers, pos) {
  return dossiers
    .filter((d) => d.transitCree)
    .map((d) => {
      const po = pos.find((p) => p.id === d.poId) || {};
      const docsComplets = d.validéAppro;
      const crit = calcCriticite(po, docsComplets);
      const h = hashCode(d.id);
      const typeRisque = !d.declaration && d.dateArrivee
        ? 'Retard déclaration douanière'
        : RISQUE_TYPES_TRANSIT[h % RISQUE_TYPES_TRANSIT.length];
      const niveau = !d.declaration && d.dateArrivee
        ? (Math.round((new Date() - new Date(d.dateArrivee)) / 86400000) > 7 ? 'Très critique' : crit.niveau)
        : crit.niveau;
      return {
        id: d.id,
        dossierTransit: d.id,
        fournisseur: d.fournisseur,
        typeRisque,
        criticite: niveau,
        impact: niveauToImpact(niveau),
        probabilite: niveauToProbabilite(niveau, crit.score),
        niveauRisque: niveau,
        responsableTransit: d.equipeTransit || RESPONSABLES_TRANSIT[h % RESPONSABLES_TRANSIT.length],
        actionsCorrectives: ACTIONS_CORRECTIVES[(h + 2) % ACTIONS_CORRECTIVES.length],
        statut: niveauToStatut(niveau),
        score: crit.score,
        dateCreation: d.dateCreation,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildRiskHistory(approRisks, transitRisks) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const factor = 0.7 + (i * 0.06);
    const critiques = Math.round(
      (approRisks.filter((r) => ['Très critique', 'Critique'].includes(r.criticite)).length
        + transitRisks.filter((r) => ['Très critique', 'Critique'].includes(r.criticite)).length) * factor
    );
    const moyens = Math.round(
      (approRisks.filter((r) => r.criticite === 'Moyen').length
        + transitRisks.filter((r) => r.criticite === 'Moyen').length) * factor
    );
    const normaux = Math.round(
      (approRisks.filter((r) => r.criticite === 'Normal').length
        + transitRisks.filter((r) => r.criticite === 'Normal').length) * factor
    );
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return { label: labels[d.getMonth()], critiques, moyens, normaux, total: critiques + moyens + normaux };
  });
}

export function buildCriticiteDistribution(approRisks, transitRisks) {
  const all = [...approRisks, ...transitRisks];
  const counts = { 'Très critique': 0, Critique: 0, Moyen: 0, Normal: 0 };
  all.forEach((r) => { if (counts[r.criticite] !== undefined) counts[r.criticite]++; });
  return [
    { label: 'Très critique', value: counts['Très critique'], color: '#0B2362' },
    { label: 'Critique', value: counts.Critique, color: '#1A3A7A' },
    { label: 'Moyen', value: counts.Moyen, color: '#8AC43D' },
    { label: 'Normal', value: counts.Normal, color: '#BAD697' },
  ].filter((d) => d.value > 0);
}
