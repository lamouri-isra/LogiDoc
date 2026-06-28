import React, { useMemo, useState } from 'react';
import { StatutPill } from '../../platform/logidoc-core';
import { buildTransitRiskData } from '../../data/riskData';

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

export default function RisquesTransitTab({ dossiers, pos }) {
  const [search, setSearch] = useState('');
  const [filterCriticite, setFilterCriticite] = useState('');

  const risks = useMemo(() => buildTransitRiskData(dossiers, pos), [dossiers, pos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return risks.filter((r) => {
      if (filterCriticite && r.criticite !== filterCriticite) return false;
      if (!q) return true;
      return [r.dossierTransit, r.fournisseur, r.typeRisque, r.responsableTransit].some((v) => v.toLowerCase().includes(q));
    });
  }, [risks, search, filterCriticite]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--line)',
        background: 'linear-gradient(135deg, #0B3D91, #0B1F3A)', color: '#fff',
      }}>
        <h3 style={{ fontSize: 15, margin: 0, fontFamily: 'Archivo,sans-serif' }}>Cartographie des Risques Transit</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.75 }}>
          Suivi des risques douaniers, déclaratifs et logistiques par dossier
        </p>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', background: '#fafbfa', borderBottom: '1px solid var(--line)' }}>
        <input
          type="search"
          placeholder="Rechercher dossier, fournisseur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
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
              <th>N° Dossier Transit</th>
              <th>Fournisseur</th>
              <th>Type de Risque</th>
              <th>Criticité</th>
              <th>Impact</th>
              <th>Probabilité</th>
              <th>Niveau de Risque</th>
              <th>Responsable Transit</th>
              <th>Actions Correctives</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Aucun dossier transit actif.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.dossierTransit}</td>
                <td>{r.fournisseur}</td>
                <td style={{ fontSize: 12 }}>{r.typeRisque}</td>
                <td><CriticitePill niveau={r.criticite} /></td>
                <td>{r.impact}</td>
                <td>{r.probabilite}</td>
                <td><CriticitePill niveau={r.niveauRisque} /></td>
                <td>{r.responsableTransit}</td>
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
