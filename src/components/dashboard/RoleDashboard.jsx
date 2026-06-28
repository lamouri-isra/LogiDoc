import React, { useRef } from 'react';
import { ROLES } from '../../platform/logidoc-core';
import PrintButton, { PrintArea } from '../ui/PrintButton';
import { BRAND } from '../../data/theme';

export default function RoleDashboard({ role, children, title, subtitle }) {
  const printRef = useRef(null);
  const current = ROLES.find((r) => r.id === role);

  return (
    <div className="fade" key={role}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 14,
        padding: '22px 26px', borderRadius: 14,
        background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueMid} 70%, rgba(138,196,61,0.12) 100%)`,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(11,35,98,0.18)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: BRAND.greenLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Interface {current?.nom}
          </div>
          <h2 style={{ fontSize: 26, marginTop: 6, fontFamily: 'Archivo,sans-serif', color: '#fff', fontWeight: 800 }}>
            {current?.icon} {title || current?.desc}
          </h2>
          {subtitle && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>{subtitle}</p>}
          {!subtitle && role === 'management' && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 8, maxWidth: 520 }}>
              Control Tower Supply Chain — Procurement · Transit · Douane · Logistique
            </p>
          )}
        </div>
        <PrintButton targetRef={printRef} className="btn btn-p" />
      </div>
      <PrintArea ref={printRef}>
        {children}
      </PrintArea>
    </div>
  );
}
