import React from 'react';
import { ROLES } from '../../platform/logidoc-core';

export default function AdminSettings() {
  return (
    <div className="fade" style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff' }}>
          <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}>⚙ Paramètres plateforme</h3>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          {[
            ['Plateforme', 'LogiDoc v1.0 — HOLCIM Algérie'],
            ['Environnement', 'Production'],
            ['Langue par défaut', 'Français'],
            ['Notifications email', 'Activées'],
            ['Contrôle IA documents', 'Activé (Claude)'],
            ['Rétention logs', '90 jours'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{k}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff' }}>
          <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}>Modules actifs</h3>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {ROLES.filter((r) => r.id !== 'management').map((r) => (
            <div key={r.id} className="card" style={{ padding: 16, transition: '0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}>
              <span style={{ fontSize: 24 }}>{r.icon}</span>
              <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>{r.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{r.desc}</div>
              <span className="pill" style={{ background: 'var(--brand-l)', color: 'var(--brand-d)', marginTop: 10 }}>Actif</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
