import React, { useMemo, useState, useEffect } from 'react';
import { Empty } from '../../platform/logidoc-core';
import { buildPrintFields, buildPrintTable, printModuleReport } from '../../utils/print';
import {
  SearchFilterBar, StickyTable, StatBadge, CriticitéBadge,
  OuiNonBadge, CompletenessBar,
} from './shared';

const CRITICITE_OPTIONS = ['Haute', 'Moyenne', 'Faible'];
const STATUT_OPTIONS = ['Créé', 'En Préparation', 'En Cours', 'Clôturé'];

export default function TransitDossiersTab({
  dossiers, createTransit, validerDoc, updateDossier, onRegisterPrint,
}) {
  const [search, setSearch] = useState('');
  const [filterCriticite, setFilterCriticite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPredom, setFilterPredom] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const enriched = useMemo(() => dossiers.map((d) => ({
    ...d,
    criticite: d.criticite || 'Moyenne',
    statutDossier: d.statutDossier || (d.transitCree ? 'En Cours' : d.validéAppro ? 'En Préparation' : 'Créé'),
    nbColis: d.nbColis || `${d.nbTC || 1} TC / ${d.nbPackages || 12} colis`,
    predom: Boolean(d.predomDemandée),
    dateCreation: d.dateCreation || d.dateArrivee || '—',
    dateTransmission: d.dateTransmission || (d.transitCree ? d.dateArrivee : ''),
    completudeDoc: d.completudeDoc ?? (d.validéAppro ? 85 : 45),
    equipeTransit: d.equipeTransit || d.transitaire || 'Équipe Transit Alger',
    observations: d.observations || '',
  })), [dossiers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((d) => {
      if (filterCriticite && d.criticite !== filterCriticite) return false;
      if (filterStatut && d.statutDossier !== filterStatut) return false;
      if (filterPredom === 'oui' && !d.predom) return false;
      if (filterPredom === 'non' && d.predom) return false;
      if (!q) return true;
      return [d.id, d.poId, d.fournisseur, d.equipeTransit, d.statutDossier, d.observations]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [enriched, search, filterCriticite, filterStatut, filterPredom]);

  const resetFilters = () => {
    setSearch('');
    setFilterCriticite('');
    setFilterStatut('');
    setFilterPredom('');
  };

  const selectedDossier = selectedId ? filtered.find((d) => d.id === selectedId) : null;

  useEffect(() => {
    if (!onRegisterPrint) return undefined;
    onRegisterPrint(() => {
      const headers = ['N° Dossier', 'PO', 'Fournisseur', 'Équipe Transit', 'Criticité', 'Statut', 'TC/Colis', 'Pré-Dom', 'Création', 'Transmission', 'Complétude', 'Observations'];
      const rows = filtered.map((d) => [
        d.id, d.poId, d.fournisseur, d.equipeTransit, d.criticite, d.statutDossier,
        d.nbColis, d.predom ? 'Oui' : 'Non', d.dateCreation, d.dateTransmission || '—',
        `${d.completudeDoc}%`, d.observations || '—',
      ]);
      const sections = [{ title: 'Tableau des dossiers transit affichés', content: buildPrintTable(headers, rows) }];
      if (selectedDossier) {
        sections.push({
          title: `Détails du dossier sélectionné — ${selectedDossier.id}`,
          content: buildPrintFields([
            ['N° Dossier Transit', selectedDossier.id],
            ['Référence PO', selectedDossier.poId],
            ['Fournisseur', selectedDossier.fournisseur],
            ['Équipe Transit Responsable', selectedDossier.equipeTransit],
            ['Criticité', selectedDossier.criticite],
            ['Statut du Dossier', selectedDossier.statutDossier],
            ['Nombre de TC / Colis', selectedDossier.nbColis],
            ['Pré-Domiciliation Bancaire', selectedDossier.predom ? 'Oui' : 'Non'],
            ['Date de Création', selectedDossier.dateCreation],
            ['Date de Transmission', selectedDossier.dateTransmission || '—'],
            ['Complétude Documentaire', `${selectedDossier.completudeDoc}%`],
            ['Validé Appro', selectedDossier.validéAppro ? 'Oui' : 'Non'],
            ['Transit Créé', selectedDossier.transitCree ? 'Oui' : 'Non'],
            ['Observations', selectedDossier.observations || '—'],
          ]),
        });
      }
      printModuleReport('Approvisionnement — Dossiers Transit', sections);
    });
    return () => onRegisterPrint(null);
  }, [filtered, selectedDossier, onRegisterPrint]);

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Suivi des Dossiers Transit</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
          Pilotage des dossiers transit — criticité, complétude documentaire et pré-domiciliation
        </p>
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher N° dossier, PO, fournisseur, équipe…"
        onReset={resetFilters}
        filters={[
          {
            key: 'crit', label: 'Criticité', value: filterCriticite, onChange: setFilterCriticite,
            options: CRITICITE_OPTIONS.map((c) => ({ value: c, label: c })),
          },
          {
            key: 'statut', label: 'Statut dossier', value: filterStatut, onChange: setFilterStatut,
            options: STATUT_OPTIONS.map((s) => ({ value: s, label: s })),
          },
          {
            key: 'predom', label: 'Pré-domiciliation', value: filterPredom, onChange: setFilterPredom,
            options: [{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }],
          },
        ]}
      />

      <div style={{ padding: '0 18px 8px', fontSize: 12, color: 'var(--muted)' }}>
        {filtered.length} dossier(s) · {selectedId ? `Sélectionné : ${selectedId}` : 'Cliquez sur une ligne pour sélectionner un dossier'}
      </div>

      {filtered.length === 0 ? (
        <Empty t="Aucun dossier transit. Les dossiers apparaissent après transmission fournisseur." />
      ) : (
        <StickyTable maxHeight={520}>
          <thead>
            <tr>
              <th>N° Dossier Transit</th>
              <th>Référence PO</th>
              <th>Fournisseur</th>
              <th>Équipe Transit Responsable</th>
              <th>Criticité</th>
              <th>Statut du Dossier</th>
              <th>Nombre de TC / Colis</th>
              <th>Pré-Domiciliation Bancaire</th>
              <th>Date de Création</th>
              <th>Date de Transmission</th>
              <th>Niveau de Complétude Documentaire</th>
              <th>Observations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                className={`${d.criticite === 'Haute' ? 'row-danger' : d.criticite === 'Moyenne' ? 'row-alert' : ''}${selectedId === d.id ? ' ld-row-selected' : ''}`}
                onClick={() => setSelectedId((prev) => (prev === d.id ? null : d.id))}
                style={{ cursor: 'pointer' }}
              >
                <td className="mono" style={{ fontWeight: 600 }}>{d.id}</td>
                <td className="mono">{d.poId}</td>
                <td>{d.fournisseur}</td>
                <td style={{ fontSize: 12 }}>{d.equipeTransit}</td>
                <td><CriticitéBadge niveau={d.criticite} /></td>
                <td><StatBadge statut={d.statutDossier} /></td>
                <td style={{ fontSize: 12 }}>{d.nbColis}</td>
                <td><OuiNonBadge value={d.predom} /></td>
                <td className="mono" style={{ fontSize: 12 }}>{d.dateCreation}</td>
                <td className="mono" style={{ fontSize: 12 }}>{d.dateTransmission || '—'}</td>
                <td><CompletenessBar value={d.completudeDoc} /></td>
                <td style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 120 }}>
                  {d.observations || '—'}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {!d.validéAppro && (
                    <button type="button" className="btn btn-p" style={{ padding: '5px 10px', fontSize: 11 }}
                      onClick={() => validerDoc(d.id)}>Valider</button>
                  )}
                  {d.validéAppro && !d.transitCree && (
                    <button type="button" className="btn btn-p" style={{ padding: '5px 10px', fontSize: 11 }}
                      onClick={() => createTransit(d.id)}>Transmettre→</button>
                  )}
                  {d.transitCree && (
                    <span style={{ fontSize: 11, color: 'var(--brand-d)', fontWeight: 600 }}> Transmis</span>
                  )}
                  <button type="button" className="ld-action-btn" style={{ marginLeft: 4 }} title="Modifier observations"
                    onClick={() => {
                      const obs = window.prompt('Observations :', d.observations || '');
                      if (obs !== null) updateDossier?.(d.id, { observations: obs });
                    }}></button>
                </td>
              </tr>
            ))}
          </tbody>
        </StickyTable>
      )}
    </div>
  );
}
