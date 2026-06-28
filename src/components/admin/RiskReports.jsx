import React, { useMemo, useRef } from 'react';
import DataTable from '../ui/DataTable';
import { StatutPill } from '../../platform/logidoc-core';
import PrintButton, { PrintArea } from '../ui/PrintButton';
import { DoughnutChart, ChartCard, } from '../dashboard/ModernCharts';
import {
  buildApproRiskData,
  buildTransitRiskData,
  buildCriticiteDistribution,
} from '../../data/riskData';
import { printHtmlContent } from '../../utils/print';

function exportExcel(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(';'),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RiskReports({ pos, dossiers }) {
  const printRef = useRef(null);

  const approRisks = useMemo(() => buildApproRiskData(pos, dossiers), [pos, dossiers]);
  const transitRisks = useMemo(() => buildTransitRiskData(dossiers, pos), [dossiers, pos]);
  const distribution = useMemo(() => buildCriticiteDistribution(approRisks, transitRisks), [approRisks, transitRisks]);

  const allRisks = useMemo(() => [
    ...approRisks.map((r) => ({ ...r, module: 'Approvisionnement', ref: r.poRef })),
    ...transitRisks.map((r) => ({ ...r, module: 'Transit', ref: r.dossierTransit })),
  ], [approRisks, transitRisks]);

  
  
  const historyColumns = [
    { key: 'ref', label: 'Référence' },
    { key: 'module', label: 'Module' },
    { key: 'fournisseur', label: 'Fournisseur' },
    { key: 'criticite', label: 'Criticité', render: (r) => <StatutPill s={r.criticite} /> },
    { key: 'impact', label: 'Impact' },
    { key: 'statut', label: 'Statut', render: (r) => <StatutPill s={r.statut === 'Clôturé' ? 'Validé' : r.statut === 'En traitement' ? 'À vérifier' : 'En attente'} /> },
    { key: 'responsable', label: 'Responsable', render: (r) => r.responsable || r.responsableTransit },
    { key: 'actionsCorrectives', label: 'Actions' },
  ];



const handleExportPdf = () => {
    const rows = allRisks.map((r) => `
      <tr>
        <td>${r.ref}</td><td>${r.module}</td><td>${r.fournisseur}</td>
        <td>${r.criticite}</td><td>${r.impact}</td><td>${r.statut}</td>
      </tr>
    `).join('');
    printHtmlContent('Rapports de Risques — LogiDoc', `
      <h1>Rapports de Risques</h1>
      <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')} · ${allRisks.length} risques identifiés</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#EFF6FF">
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Référence</th>
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Module</th>
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Fournisseur</th>
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Criticité</th>
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Impact</th>
          <th style="padding:8px;border:1px solid #DCE6E4;text-align:left">Statut</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  };

  const handleExportExcel = () => {
    exportExcel(allRisks.map((r) => ({
      Référence: r.ref,
      Module: r.module,
      Fournisseur: r.fournisseur,
      Criticité: r.criticite,
      Impact: r.impact,
      Probabilité: r.probabilite,
      'Niveau de Risque': r.niveauRisque,
      Responsable: r.responsable || r.responsableTransit,
      'Actions Correctives': r.actionsCorrectives,
      Statut: r.statut,
    })), `rapports-risques-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fade" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-g" onClick={handleExportExcel}>Export Excel</button>
        <button type="button" className="btn btn-g" onClick={handleExportPdf}>Export PDF</button>
        <PrintButton targetRef={printRef} label="Imprimer" />
      </div>

      <PrintArea ref={printRef}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        
          <ChartCard title="Répartition par criticité" subtitle="Approvisionnement + Transit" icon="">
            {distribution.length > 0 ? (
              <DoughnutChart data={distribution} size={140} />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Aucune donnée disponible.</p>
            )}
          </ChartCard>
        </div>

        <div className="card" style={{ overflow: 'hidden', marginTop: 16 }}>
          <div style={{
            padding: '16px 18px', borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(135deg,#0B3D91,#0B1F3A)', color: '#fff',
          }}>
            <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}>Historique des risques</h3>
            <p style={{ fontSize: 12, opacity: 0.75, margin: '4px 0 0' }}>
              Consolidation Approvisionnement et Transit
            </p>
          </div>
          <DataTable columns={historyColumns} data={allRisks} pageSize={10} searchable emptyMessage="Aucun risque enregistré." />
        </div>
      </PrintArea>
    </div>
  );
}
