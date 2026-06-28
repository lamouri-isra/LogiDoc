import React from 'react';
import { InterfaceTresorerie } from '../../platform/logidoc-core';

export default function TresorerieDashboard({ dossiers, pos, traiterPredom, validerChèque, updateDossier }) {
  return (
    <div className="fade" style={{ display: 'grid', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Module opérationnel
        </div>
        <h2 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 24, color: 'var(--accent)', marginTop: 4 }}>
          Trésorerie
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Domiciliation bancaire et émission des chèques
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
            <strong style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Interface Trésorerie</strong>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Domiciliation · Chèques · Clôture</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <InterfaceTresorerie dossiers={dossiers} pos={pos} traiterPredom={traiterPredom} validerChèque={validerChèque} updateDossier={updateDossier} />
        </div>
      </div>
    </div>
  );
}
