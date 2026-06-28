import React from 'react';
import ApproModule from '../appro/ApproModule';

export default function ApproDashboard({
  pos, dossiers, createTransit, validerDoc, updatePo, updateDossier,
  approDocuments, setApproDocuments,
}) {
  return (
    <div className="fade" style={{ display: 'grid', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Module opérationnel
        </div>
        <h2 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 24, color: 'var(--accent)', marginTop: 4 }}>
          Approvisionnement
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Commandes PO · Fournisseur · Dossiers Transit
        </p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #0B1F3A, #102A4C)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'rgba(0,168,112,0.25)', fontSize: 18,
          }}></span>
          <div>
            <strong style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Interface Approvisionnement</strong>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>PO · Documents · Transit</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <ApproModule
            pos={pos}
            dossiers={dossiers}
            createTransit={createTransit}
            validerDoc={validerDoc}
            updatePo={updatePo}
            updateDossier={updateDossier}
            approDocuments={approDocuments}
            setApproDocuments={setApproDocuments}
          />
        </div>
      </div>
    </div>
  );
}


