import React, { useState } from 'react';
import { InterfaceTransit, Tabs } from '../../platform/logidoc-core';
import RisquesTransitTab from '../transit/RisquesTransitTab';

export default function TransitDashboard({ dossiers, pos, demandeChèque, majDeclaration, majDedouanement }) {
  const [tab, setTab] = useState('operations');
  const tabs = [
    ['operations', 'Opérations Transit'],
    ['risques', 'Cartographie des Risques Transit'],
  ];

  return (
    <div className="fade" style={{ display: 'grid', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Module opérationnel
        </div>
        <h2 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 24, color: 'var(--accent)', marginTop: 4 }}>
          Transit
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Suivi douanier, déclarations, demandes de chèques et cartographie des risques
        </p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'operations' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 22px',
            background: 'linear-gradient(135deg, #0B3D91, #0B1F3A)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
              background: 'rgba(34,197,94,0.25)', fontSize: 18,
            }}></span>
            <div>
              <strong style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Interface Transit</strong>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Déclaration · Dédouanement · Chèques</div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <InterfaceTransit dossiers={dossiers} pos={pos} demandeChèque={demandeChèque} majDeclaration={majDeclaration} majDedouanement={majDedouanement} />
          </div>
        </div>
      )}

      {tab === 'risques' && <RisquesTransitTab dossiers={dossiers} pos={pos} />}
    </div>
  );
}
