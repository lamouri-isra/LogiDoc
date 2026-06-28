import React, { useState } from 'react';
import DataTable from '../ui/DataTable';
import { StatutPill, Tabs } from '../../platform/logidoc-core';
import PrintButton, { PrintArea } from '../ui/PrintButton';
import RiskReports from './RiskReports';

export default function AdminReports({ pos, dossiers }) {
  const [tab, setTab] = useState('ops');
  const printRef = React.useRef(null);

  const tabs = [
    ['ops', 'Rapports opérationnels'],
    ['risks', 'Rapports de Risques'],
  ];

  const columns = [
    { key: 'id', label: 'PO' },
    { key: 'fournisseur', label: 'Fournisseur' },
    { key: 'entite', label: 'Entité', filter: true },
    { key: 'montant', label: 'Montant', render: (r) => `${r.montant.toLocaleString()} ${r.devise}` },
    { key: 'statut', label: 'Statut', render: (r) => <StatutPill s={r.statut} /> },
    { key: 'eta', label: 'ETA' },
  ];

  const dossierCols = [
    { key: 'id', label: 'Dossier' },
    { key: 'poId', label: 'PO' },
    { key: 'fournisseur', label: 'Fournisseur' },
    { key: 'situation', label: 'Situation' },
    { key: 'validéAppro', label: 'Validé', render: (r) => <StatutPill s={r.validéAppro ? 'Validé' : 'En attente'} /> },
  ];

  return (
    <div className="fade" style={{ display: 'grid', gap: 16 }}>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'risks' && <RiskReports pos={pos} dossiers={dossiers} />}

      {tab === 'ops' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PrintButton targetRef={printRef} label="Imprimer rapports" />
          </div>
          <PrintArea ref={printRef}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,#0B3D91,#0B1F3A)', color: '#fff' }}>
                <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}> Rapport Purchase Orders</h3>
              </div>
              <DataTable columns={columns} data={pos} pageSize={10} />
            </div>
            <div className="card" style={{ overflow: 'hidden', marginTop: 16 }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,#0B3D91,#0B1F3A)', color: '#fff' }}>
                <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}> Rapport Dossiers Transit</h3>
              </div>
              <DataTable columns={dossierCols} data={dossiers} pageSize={10} emptyMessage="Aucun dossier." />
            </div>
          </PrintArea>
        </>
      )}
    </div>
  );
}
