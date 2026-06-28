import React, { useMemo, useState, useEffect } from 'react';
import { LEAD_TIME_PAR_PAYS } from '../../platform/logidoc-core';
import { buildPrintTable, printModuleReport } from '../../utils/print';
import {
  SearchFilterBar, StickyTable, AlertBanner, StatBadge,
  extractPort, getLeadTimeDays, getPreparationStatut,
} from './shared';

function IndicBadge({ val }) {
  if (val === null || val === undefined) return <span className="pill" style={{ background: '#f1f1ee', color: 'var(--muted)' }}>—</span>;
  return val
    ? <span className="pill" style={{ background: 'var(--brand-l)', color: 'var(--brand-d)' }}>À temps</span>
    : <span className="pill" style={{ background: '#fbe6e3', color: 'var(--ko)' }}>En retard</span>;
}

export default function CommandesTab({ pos, updatePo, onRegisterPrint }) {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterEntite, setFilterEntite] = useState('');
  const [filterPays, setFilterPays] = useState('');

  const entites = useMemo(() => [...new Set(pos.map((p) => p.entite))], [pos]);
  const paysList = useMemo(() => [...new Set(pos.map((p) => p.paysOrigine))], [pos]);

  const enriched = useMemo(() => pos.map((p) => {
    const prep = getPreparationStatut(p);
    const packingLate = p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate;
    const ecart = p.factoryArrivalDate && p.plannedReleaseDate
      ? Math.round((new Date(p.factoryArrivalDate) - new Date(p.plannedReleaseDate)) / 86400000)
      : null;
    return { ...p, prep, packingLate, ecart };
  }), [pos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((p) => {
      if (filterStatut && p.prep !== filterStatut) return false;
      if (filterEntite && p.entite !== filterEntite) return false;
      if (filterPays && p.paysOrigine !== filterPays) return false;
      if (!q) return true;
      const port = extractPort(p.incoterm);
      return [p.id, p.entite, p.fournisseur, p.paysOrigine, port?.nom, p.statut, p.prep]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [enriched, search, filterStatut, filterEntite, filterPays]);

  const alerts = useMemo(() => {
    const packingLate = enriched.filter((p) => p.packingLate);
    const supplierLate = enriched.filter((p) => p.portDepartureOnTime === false);
    const factoryLate = enriched.filter((p) => p.factoryArrivalOnTime === false);
    return { packingLate, supplierLate, factoryLate };
  }, [enriched]);

  const resetFilters = () => {
    setSearch('');
    setFilterStatut('');
    setFilterEntite('');
    setFilterPays('');
  };

  useEffect(() => {
    if (!onRegisterPrint) return undefined;
    onRegisterPrint(() => {
      const headers = ['N° PO', 'Entité', 'Fournisseur', 'Pays', 'Port', 'Montant', 'Lead Time', 'Planned Release', 'Packing Date', 'Statut Préparation', 'Port Embarquement', 'Arrivée Usine', 'Écart'];
      const rows = filtered.map((p) => {
        const port = extractPort(p.incoterm);
        const leadDays = getLeadTimeDays(p.paysOrigine, p.incoterm, LEAD_TIME_PAR_PAYS);
        return [
          p.id, p.entite, p.fournisseur, p.paysOrigine,
          port ? `${port.isAir ? 'Aérien' : 'Maritime'} ${port.nom}` : '—',
          `${p.montant.toLocaleString()} ${p.devise}`,
          leadDays !== null ? `${leadDays} j` : '—',
          p.plannedReleaseDate || '—', p.packingDate || '—', p.prep,
          p.portDepartureDate || '—', p.factoryArrivalDate || '—',
          p.ecart !== null ? `${p.ecart > 0 ? '+' : ''}${p.ecart} j` : '—',
        ];
      });
      printModuleReport('Approvisionnement — Commandes (PO)', [
        { title: 'Tableau des commandes affichées', content: buildPrintTable(headers, rows) },
      ]);
    });
    return () => onRegisterPrint(null);
  }, [filtered, onRegisterPrint]);

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Commandes (PO)</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
          Suivi Planned Release Date, préparation fournisseur, embarquement port et arrivée usine
        </p>
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher N° PO, fournisseur, entité, pays…"
        onReset={resetFilters}
        filters={[
          {
            key: 'statut', label: 'Statut préparation', value: filterStatut, onChange: setFilterStatut,
            options: ['En attente', 'Validé', 'En retard'].map((v) => ({ value: v, label: v })),
          },
          {
            key: 'entite', label: 'Entité', value: filterEntite, onChange: setFilterEntite,
            options: entites.map((e) => ({ value: e, label: e })),
          },
          {
            key: 'pays', label: 'Pays', value: filterPays, onChange: setFilterPays,
            options: paysList.map((p) => ({ value: p, label: p })),
          },
        ]}
      />

      <div style={{ padding: '0 18px 12px', fontSize: 12, color: 'var(--muted)' }}>
        {filtered.length} commande(s) affichée(s) sur {pos.length}
      </div>

      <StickyTable>
        <thead>
          <tr>
            <th>N° PO</th>
            <th>Entité</th>
            <th>Fournisseur</th>
            <th>Pays</th>
            <th>Port</th>
            <th>Montant</th>
            <th>Lead Time</th>
            <th>Planned Release Date</th>
            <th>Packing Date</th>
            <th>Statut Préparation</th>
            <th>Date Port Embarquement</th>
            <th>Date Arrivée Usine</th>
            <th>Écart</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={13} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Aucune commande ne correspond aux critères.</td></tr>
          ) : filtered.map((p) => {
            const port = extractPort(p.incoterm);
            const leadDays = getLeadTimeDays(p.paysOrigine, p.incoterm, LEAD_TIME_PAR_PAYS);
            const rowClass = p.packingLate ? 'row-alert' : p.prep === 'En retard' ? 'row-danger' : '';
            return (
              <tr key={p.id} className={rowClass}>
                <td className="mono" style={{ fontWeight: 600 }}>{p.id}</td>
                <td>{p.entite}</td>
                <td>{p.fournisseur}</td>
                <td>{p.paysOrigine}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>
                  {port
                    ? <span>{port.isAir ? '' : ''} {port.nom}</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
                <td>{p.montant.toLocaleString()} {p.devise}</td>
                <td style={{ textAlign: 'center' }}>
                  {leadDays !== null
                    ? <span className="pill" style={{ background: '#e8f0fb', color: '#1c5ca8', fontWeight: 700 }}>{leadDays} j</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
                <td>
                  <input type="date" value={p.plannedReleaseDate || ''}
                    onChange={(e) => updatePo(p.id, { plannedReleaseDate: e.target.value })}
                    style={{ fontSize: 12, padding: '5px 8px', minWidth: 130 }} />
                </td>
                <td>
                  {p.packingDate
                    ? <span className="mono" style={{ fontSize: 12, color: p.packingLate ? 'var(--ko)' : 'var(--brand-d)' }}>
                        {p.packingDate} {p.packingLate && ''}
                      </span>
                    : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                </td>
                <td><StatBadge statut={p.prep} /></td>
                <td>
                  <input type="date" value={p.portDepartureDate || ''}
                    onChange={(e) => {
                      const d = e.target.value;
                      const onTime = p.plannedReleaseDate ? d <= p.plannedReleaseDate : null;
                      updatePo(p.id, { portDepartureDate: d, portDepartureOnTime: onTime });
                    }}
                    style={{ fontSize: 12, padding: '5px 8px', minWidth: 130 }} />
                  {p.portDepartureDate && <div style={{ marginTop: 4 }}><IndicBadge val={p.portDepartureOnTime} /></div>}
                </td>
                <td>
                  <input type="date" value={p.factoryArrivalDate || ''}
                    onChange={(e) => {
                      const d = e.target.value;
                      const onTime = p.eta ? d <= p.eta : null;
                      updatePo(p.id, { factoryArrivalDate: d, factoryArrivalOnTime: onTime, deliveryDate: d });
                    }}
                    style={{ fontSize: 12, padding: '5px 8px', minWidth: 130 }} />
                  {p.factoryArrivalDate && <div style={{ marginTop: 4 }}><IndicBadge val={p.factoryArrivalOnTime} /></div>}
                </td>
                <td>
                  {p.ecart !== null
                    ? <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: p.ecart > 0 ? 'var(--ko)' : 'var(--brand-d)' }}>
                        {p.ecart > 0 ? `+${p.ecart}` : p.ecart} j
                      </span>
                    : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </StickyTable>

      {(alerts.packingLate.length > 0 || alerts.supplierLate.length > 0 || alerts.factoryLate.length > 0) && (
        <div style={{ display: 'grid', gap: 8, paddingTop: 4 }}>
          {alerts.packingLate.length > 0 && (
            <AlertBanner type="warn">
              ⚠ <strong>Alerte Packing Date</strong> — {alerts.packingLate.length} PO avec Packing Date &gt; Planned Release Date ({alerts.packingLate.map((p) => p.id).join(', ')}).
            </AlertBanner>
          )}
          {alerts.supplierLate.length > 0 && (
            <AlertBanner type="error">
              ⏱ <strong>Retard fournisseur</strong> — {alerts.supplierLate.length} PO en retard au port d&apos;embarquement.
            </AlertBanner>
          )}
          {alerts.factoryLate.length > 0 && (
            <AlertBanner type="error">
               <strong>Retard arrivée usine</strong> — {alerts.factoryLate.length} PO avec arrivée usine postérieure à l&apos;ETA.
            </AlertBanner>
          )}
        </div>
      )}
    </div>
  );
}
