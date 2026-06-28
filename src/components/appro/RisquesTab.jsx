import React, { useMemo, useState, useEffect } from 'react';
import { StatutPill } from '../../platform/logidoc-core';
import { buildPrintTable, printModuleReport } from '../../utils/print';
import { buildApproRiskData } from '../../data/riskData';
import { ApproStyles } from './shared';

const CRITICITE_COLORS = {
  'Très critique': ['#E8EEF8', '#0B3D91'],
  Critique: ['#DBEAFE', '#0B3D91'],
  Moyen: ['#DCFCE7', '#16A34A'],
  Normal: ['#F0FDF4', '#22C55E'],
};

function CriticitePill({ niveau }) {
  const [bg, c] = CRITICITE_COLORS[niveau] || ['#f1f1ee', 'var(--muted)'];
  return <span className="pill" style={{ background: bg, color: c }}>{niveau}</span>;
}

export default function RisquesTab({ pos, dossiers, onRegisterPrint }) {
  const [search, setSearch] = useState('');
  const [filterCriticite, setFilterCriticite] = useState('');

  const risks = useMemo(() => buildApproRiskData(pos, dossiers), [pos, dossiers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return risks.filter((r) => {
      if (filterCriticite && r.criticite !== filterCriticite) return false;
      if (!q) return true;
      return [r.poRef, r.fournisseur, r.risque, r.responsable].some((v) => v.toLowerCase().includes(q));
    });
  }, [risks, search, filterCriticite]);

  useEffect(() => {
    if (!onRegisterPrint) return undefined;
    onRegisterPrint(() => {
      const headers = ['PO', 'Fournisseur', 'Risque', 'Criticité', 'Impact', 'Probabilité', 'Niveau', 'Responsable', 'Actions', 'Statut'];
      const rows = filtered.map((r) => [
        r.poRef, r.fournisseur, r.risque, r.criticite, r.impact, r.probabilite,
        r.niveauRisque, r.responsable, r.actionsCorrectives, r.statut,
      ]);
      printModuleReport('Approvisionnement — Cartographie des Risques', [
        { title: 'Tableau des risques affichés', content: buildPrintTable(headers, rows) },
      ]);
    });
    return () => onRegisterPrint(null);
  }, [filtered, onRegisterPrint]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <ApproStyles />
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--line)',
        background: 'linear-gradient(135deg, #0B3D91, #0B1F3A)', color: '#fff',
      }}>
        <h3 style={{ fontSize: 15, margin: 0, fontFamily: 'Archivo,sans-serif' }}>Cartographie des Risques</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.75 }}>
          Identification et priorisation des risques approvisionnement par PO
        </p>
      </div>

      <div className="ld-appro-toolbar" style={{ background: '#fafbfa' }}>
        <div className="ld-appro-search" style={{ flex: 1 }}>
          <span className="ld-appro-search-icon">⌕</span>
          <input
            type="search"
            placeholder="Rechercher PO, fournisseur, risque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterCriticite} onChange={(e) => setFilterCriticite(e.target.value)} style={{ width: 'auto' }} aria-label="Criticité">
          <option value="">Toutes criticités</option>
          <option value="Très critique">Très critique</option>
          <option value="Critique">Critique</option>
          <option value="Moyen">Moyen</option>
          <option value="Normal">Normal</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Référence PO</th>
              <th>Fournisseur</th>
              <th>Risque</th>
              <th>Criticité</th>
              <th>Impact</th>
              <th>Probabilité</th>
              <th>Niveau de Risque</th>
              <th>Responsable</th>
              <th>Actions Correctives</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Aucun risque identifié.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.poRef}</td>
                <td>{r.fournisseur}</td>
                <td style={{ fontSize: 12 }}>{r.risque}</td>
                <td><CriticitePill niveau={r.criticite} /></td>
                <td>{r.impact}</td>
                <td>{r.probabilite}</td>
                <td><CriticitePill niveau={r.niveauRisque} /></td>
                <td>{r.responsable}</td>
                <td style={{ fontSize: 12, maxWidth: 200 }}>{r.actionsCorrectives}</td>
                <td><StatutPill s={r.statut === 'Clôturé' ? 'Validé' : r.statut === 'En traitement' ? 'À vérifier' : 'En attente'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
