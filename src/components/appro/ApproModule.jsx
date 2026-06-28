import React, { useState, useRef } from 'react';
import { Tabs } from '../../platform/logidoc-core';
import { ApproStyles } from './shared';
import CommandesTab from './CommandesTab';
import DocumentsTab from './DocumentsTab';
import TransitDossiersTab from './TransitDossiersTab';
import RisquesTab from './RisquesTab';

export default function ApproModule({
  pos, dossiers, createTransit, validerDoc, updatePo, updateDossier,
  approDocuments, setApproDocuments,
}) {
  const [tab, setTab] = useState('po');
  const printHandlerRef = useRef(null);
  const tabs = [
    ['po', 'Commandes (PO)'],
    ['docs', 'Fournisseur'],
    ['transit', 'Dossiers Transit'],
    ['risques', 'Cartographie des Risques'],
  ];

  const handlePrint = () => {
    if (printHandlerRef.current) {
      printHandlerRef.current();
    } else {
      window.print();
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ApproStyles />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="ld-module-print-bar no-print">
          <button type="button" className="btn btn-g" style={{ padding: '8px 16px', fontSize: 12.5 }} onClick={handlePrint}>
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {tab === 'po' && (
        <CommandesTab pos={pos} updatePo={updatePo} onRegisterPrint={(fn) => { printHandlerRef.current = fn; }} />
      )}

      {tab === 'docs' && (
        <DocumentsTab
          approDocuments={approDocuments}
          setApproDocuments={setApproDocuments}
          validerDoc={validerDoc}
          dossiers={dossiers}
          onRegisterPrint={(fn) => { printHandlerRef.current = fn; }}
        />
      )}

      {tab === 'transit' && (
        <TransitDossiersTab
          dossiers={dossiers}
          createTransit={createTransit}
          validerDoc={validerDoc}
          updateDossier={updateDossier}
          onRegisterPrint={(fn) => { printHandlerRef.current = fn; }}
        />
      )}

      {tab === 'risques' && (
        <RisquesTab pos={pos} dossiers={dossiers} onRegisterPrint={(fn) => { printHandlerRef.current = fn; }} />
      )}
    </div>
  );
}
