import React from 'react';
import { StatutPill } from '../../platform/logidoc-core';

export const DOC_TYPES_APPRO = [
  'Facture Commerciale',
  'Packing List',
  'Certificat d\'Origine',
  'BL / AWB',
  'Certificat Qualité',
  'Autres Documents',
];

export const DOC_STATUTS = ['Reçu', 'En Vérification', 'Validé', 'Incomplet', 'Rejeté'];

export function extractPort(incoterm) {
  if (!incoterm) return null;
  const m = incoterm.match(/PORT\s+(?:DE\s+|D['''])?(.+)|AEROPORT\s+(?:DE\s+|D['''])?(.+)/i);
  if (!m) return null;
  const nom = (m[1] || m[2] || '').trim();
  const isAir = incoterm.includes('AEROPORT') || incoterm.includes('FCA') || incoterm.includes('CPT');
  return { nom, isAir };
}

export function getLeadTimeDays(paysOrigine, incoterm, leadTimeMap) {
  const lt = leadTimeMap[paysOrigine];
  if (!lt) return null;
  const isMaritime = incoterm && (incoterm.includes('CFR') || incoterm.includes('FOB') || incoterm.includes('DAP'));
  return isMaritime ? lt.maritime : lt.aerien;
}

export function getPreparationStatut(po) {
  const packingLate = po.packingDate && po.plannedReleaseDate && po.packingDate > po.plannedReleaseDate;
  const factoryLate = po.factoryArrivalDate && po.eta && po.factoryArrivalDate > po.eta;
  const portLate = po.portDepartureOnTime === false;
  if (packingLate || factoryLate || portLate || po.factoryArrivalOnTime === false) return 'En retard';
  if (po.goodsReady || po.statut === 'Validée') return 'Validé';
  return 'En attente';
}

export function CriticitéBadge({ niveau }) {
  const map = {
    Haute: ['#fbe6e3', 'var(--ko)'],
    Moyenne: ['#fdf2dc', 'var(--warn)'],
    Faible: ['var(--brand-l)', 'var(--brand-d)'],
  };
  const [bg, c] = map[niveau] || ['#f1f1ee', 'var(--muted)'];
  return <span className="pill" style={{ background: bg, color: c }}>{niveau}</span>;
}

export function OuiNonBadge({ value }) {
  return value
    ? <span className="pill" style={{ background: 'var(--brand-l)', color: 'var(--brand-d)' }}>Oui</span>
    : <span className="pill" style={{ background: '#f1f1ee', color: 'var(--muted)' }}>Non</span>;
}

export function CompletenessBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct <= 25 ? 'var(--ko)' : pct <= 50 ? 'var(--warn)' : pct <= 75 ? '#1c5ca8' : 'var(--brand)';
  const range = pct <= 25 ? '0-25%' : pct <= 50 ? '26-50%' : pct <= 75 ? '51-75%' : '76-100%';
  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
        <span>{range}</span>
        <span style={{ fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e8ece7', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export function SearchFilterBar({
  search, onSearchChange, searchPlaceholder = 'Rechercher…',
  filters = [], onReset,
}) {
  return (
    <div className="ld-appro-toolbar">
      <div className="ld-appro-search">
        <span className="ld-appro-search-icon">⌕</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="ld-appro-filters">
        {filters.map((f) => (
          <select key={f.key} value={f.value} onChange={(e) => f.onChange(e.target.value)} aria-label={f.label}>
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
            ))}
          </select>
        ))}
        {onReset && (
          <button type="button" className="btn btn-g" style={{ padding: '8px 12px', fontSize: 12 }} onClick={onReset}>
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export function StickyTable({ children, maxHeight = 520 }) {
  return (
    <div className="ld-table-wrap" style={{ maxHeight }}>
      <table className="ld-table-modern">{children}</table>
    </div>
  );
}

export function AlertBanner({ type = 'warn', children }) {
  const styles = {
    warn: { bg: '#fdf2dc', border: '#f0c96a', color: 'var(--warn)' },
    error: { bg: '#fbe6e3', border: '#f3c9c3', color: 'var(--ko)' },
    info: { bg: '#e8f0fb', border: '#b8cfe8', color: '#1c5ca8' },
  };
  const s = styles[type] || styles.warn;
  return (
    <div style={{
      margin: '0 18px 18px', padding: '12px 16px', background: s.bg,
      border: `1px solid ${s.border}`, borderRadius: 10, fontSize: 12.5, color: s.color,
    }}>
      {children}
    </div>
  );
}

export function StatBadge({ statut }) {
  const prepMap = {
    'En attente': ['#f1f1ee', 'var(--muted)'],
    Validé: ['var(--brand-l)', 'var(--brand-d)'],
    'En retard': ['#fbe6e3', 'var(--ko)'],
  };
  const docMap = {
    Reçu: ['#e4eefb', '#1c5ca8'],
    'En Vérification': ['#fdf2dc', 'var(--warn)'],
    Validé: ['var(--brand-l)', 'var(--brand-d)'],
    Incomplet: ['#fdf2dc', 'var(--warn)'],
    Rejeté: ['#fbe6e3', 'var(--ko)'],
  };
  const dossierMap = {
    Créé: ['#e4eefb', '#1c5ca8'],
    'En Préparation': ['#fdf2dc', 'var(--warn)'],
    'En Cours': ['var(--brand-l)', 'var(--brand-d)'],
    Clôturé: ['#f1f1ee', 'var(--muted)'],
  };
  const map = { ...prepMap, ...docMap, ...dossierMap };
  if (map[statut]) {
    const [bg, c] = map[statut];
    return <span className="pill" style={{ background: bg, color: c }}>{statut}</span>;
  }
  return <StatutPill s={statut} />;
}

export function ApproStyles() {
  return (
    <style>{`
      .ld-appro-toolbar {
        display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
        padding: 16px 18px; border-bottom: 1px solid var(--line); background: #fafbfa;
      }
      .ld-appro-search { flex: 1; min-width: 200px; position: relative; }
      .ld-appro-search input {
        width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px;
        border: 1px solid var(--line); background: #fff; font-size: 13px;
      }
      .ld-appro-search input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-l); }
      .ld-appro-search-icon {
        position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: var(--muted); font-size: 16px; pointer-events: none;
      }
      .ld-appro-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .ld-appro-filters select {
        width: auto; min-width: 140px; padding: 9px 12px; font-size: 12.5px;
        border-radius: 9px; background: #fff;
      }
      .ld-table-wrap {
        overflow: auto; border-radius: 0 0 14px 14px;
      }
      .ld-table-modern { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; }
      .ld-table-modern th {
        position: sticky; top: 0; z-index: 3;
        text-align: left; font-weight: 600; color: var(--muted); font-size: 10.5px;
        text-transform: uppercase; letter-spacing: 0.05em;
        padding: 11px 14px; border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, #f8faf9 0%, #f0f4f2 100%);
        box-shadow: 0 1px 0 var(--line);
        white-space: nowrap;
      }
      .ld-table-modern td {
        padding: 11px 14px; border-bottom: 1px solid var(--line); vertical-align: middle;
        background: #fff;
      }
      .ld-table-modern tbody tr:hover td { background: #f8fbf9; }
      .ld-table-modern tbody tr.row-alert td { background: #fff9f0; }
      .ld-table-modern tbody tr.row-danger td { background: #fff5f5; }
      .ld-action-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line);
        background: #fff; cursor: pointer; font-size: 13px; transition: 0.15s;
      }
      .ld-action-btn:hover { border-color: var(--brand); background: var(--brand-l); }
      .ld-kpi-mini {
        padding: 14px 16px; border-radius: 12px; border: 1px solid var(--line);
        background: #fff; box-shadow: var(--shadow-sm);
      }
      .ld-kpi-mini-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
      .ld-kpi-mini-value { font-family: Archivo, sans-serif; font-size: 22px; font-weight: 800; margin-top: 4px; }
      @media (max-width: 768px) {
        .ld-appro-toolbar { flex-direction: column; align-items: stretch; }
        .ld-appro-filters select { flex: 1; min-width: 0; }
      }
    `}</style>
  );
}
