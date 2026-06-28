import React, { useMemo, useState, useEffect } from 'react';
import { Empty } from '../../platform/logidoc-core';
import { buildPrintTable, printModuleReport } from '../../utils/print';
import {
  SearchFilterBar, StickyTable, StatBadge, CompletenessBar,
  DOC_TYPES_APPRO, DOC_STATUTS,
} from './shared';

export default function DocumentsTab({
  approDocuments, setApproDocuments, validerDoc, dossiers, onRegisterPrint,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approDocuments.filter((d) => {
      if (filterType && d.type !== filterType) return false;
      if (filterStatut && d.statutVerification !== filterStatut) return false;
      if (!q) return true;
      return [d.poRef, d.fournisseur, d.type, d.responsable, d.commentaires, d.fileName]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [approDocuments, search, filterType, filterStatut]);

  const addHistory = (docId, action) => {
    const entry = { date: new Date().toISOString().slice(0, 16).replace('T', ' '), action, user: 'Approvisionnement' };
    setApproDocuments((prev) => prev.map((d) => (
      d.id === docId ? { ...d, history: [entry, ...(d.history || [])] } : d
    )));
  };

  const handleUpload = (docId, file) => {
    if (!file) return;
    setApproDocuments((prev) => prev.map((d) => (
      d.id === docId
        ? {
            ...d,
            fileName: file.name,
            statutVerification: d.statutVerification === 'Reçu' ? 'En Vérification' : d.statutVerification,
            completude: Math.min(100, (d.completude || 0) + 15),
          }
        : d
    )));
    addHistory(docId, `Document téléversé : ${file.name}`);
    setUploadTarget(null);
  };

  const handleValidate = (doc) => {
    const linked = dossiers.find((d) => d.poId === doc.poRef && !d.validéAppro);
    if (linked) validerDoc(linked.id);
    setApproDocuments((prev) => prev.map((d) => (
      d.id === doc.id
        ? { ...d, statutVerification: 'Validé', completude: 100 }
        : d
    )));
    addHistory(doc.id, 'Document validé par l\'approvisionnement');
  };

  const handleReject = (docId) => {
    setApproDocuments((prev) => prev.map((d) => (
      d.id === docId ? { ...d, statutVerification: 'Rejeté', completude: Math.max(0, (d.completude || 0) - 20) } : d
    )));
    addHistory(docId, 'Document rejeté — anomalies détectées');
  };

  const resetFilters = () => { setSearch(''); setFilterType(''); setFilterStatut(''); };

  useEffect(() => {
    if (!onRegisterPrint) return undefined;
    onRegisterPrint(() => {
      const headers = ['PO', 'Fournisseur', 'Type', 'Date Réception', 'Statut', 'Complétude', 'Responsable', 'Commentaires'];
      const rows = filtered.map((doc) => [
        doc.poRef, doc.fournisseur, doc.type, doc.dateReception || '—',
        doc.statutVerification, `${doc.completude || 0}%`, doc.responsable, doc.commentaires || '—',
      ]);
      printModuleReport('Approvisionnement — Documents Fournisseur', [
        { title: 'Tableau des documents affichés', content: buildPrintTable(headers, rows) },
      ]);
    });
    return () => onRegisterPrint(null);
  }, [filtered, onRegisterPrint]);

  return (
    <>
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, margin: 0 }}>Fournisseur</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
              Gestion documentaire complète — réception, vérification et validation
            </p>
          </div>
          <label className="btn btn-p" style={{ position: 'relative', fontSize: 12, padding: '8px 14px' }}>
            ↑ Nouveau document
            <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f || approDocuments.length === 0) return;
                handleUpload(approDocuments[0].id, f);
                e.target.value = '';
              }} />
          </label>
        </div>

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher PO, fournisseur, type, responsable…"
          onReset={resetFilters}
          filters={[
            {
              key: 'type', label: 'Type de document', value: filterType, onChange: setFilterType,
              options: DOC_TYPES_APPRO.map((t) => ({ value: t, label: t })),
            },
            {
              key: 'statut', label: 'Statut vérification', value: filterStatut, onChange: setFilterStatut,
              options: DOC_STATUTS.map((s) => ({ value: s, label: s })),
            },
          ]}
        />

        {filtered.length === 0 ? (
          <Empty t="Aucun document ne correspond aux critères." />
        ) : (
          <StickyTable maxHeight={480}>
            <thead>
              <tr>
                <th>Référence PO</th>
                <th>Fournisseur</th>
                <th>Type de Document</th>
                <th>Date Réception</th>
                <th>Statut Vérification</th>
                <th>Niveau de Complétude</th>
                <th>Responsable</th>
                <th>Commentaires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{doc.poRef}</td>
                  <td>{doc.fournisseur}</td>
                  <td style={{ fontSize: 12 }}>{doc.type}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{doc.dateReception || '—'}</td>
                  <td><StatBadge statut={doc.statutVerification} /></td>
                  <td><CompletenessBar value={doc.completude} /></td>
                  <td style={{ fontSize: 12 }}>{doc.responsable}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 140 }}>{doc.commentaires || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                      <button type="button" className="ld-action-btn" title="Téléverser" onClick={() => setUploadTarget(doc.id)}>↑</button>
                      <button type="button" className="ld-action-btn" title="Télécharger" onClick={() => {
                        const blob = new Blob([doc.content || `Document ${doc.type} — ${doc.poRef}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = doc.fileName || `${doc.poRef}-${doc.type}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        addHistory(doc.id, 'Document téléchargé');
                      }}>↓</button>
                      <button type="button" className="ld-action-btn" title="Prévisualiser" onClick={() => setPreviewDoc(doc)}>👁</button>
                      <button type="button" className="ld-action-btn" title="Historique" onClick={() => setHistoryDoc(doc)}>⏱</button>
                      {doc.statutVerification !== 'Validé' && doc.statutVerification !== 'Rejeté' && (
                        <>
                          <button type="button" className="btn btn-p" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleValidate(doc)}>✓</button>
                          <button type="button" className="btn btn-g" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleReject(doc.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </StickyTable>
        )}
      </div>

      {uploadTarget && (
        <Modal title="Téléverser un document" onClose={() => setUploadTarget(null)}>
          <label className="btn btn-p" style={{ position: 'relative', display: 'inline-flex' }}>
            Choisir un fichier
            <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              onChange={(e) => { handleUpload(uploadTarget, e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </Modal>
      )}

      {previewDoc && (
        <Modal title={`Prévisualisation — ${previewDoc.type}`} onClose={() => setPreviewDoc(null)} wide>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            {previewDoc.fileName || 'Aucun fichier joint'} · PO {previewDoc.poRef}
          </div>
          <pre style={{
            background: '#f6f8f5', padding: 16, borderRadius: 10, fontSize: 12,
            lineHeight: 1.6, overflow: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap',
            border: '1px solid var(--line)',
          }}>
            {previewDoc.content || `Aperçu simulé du document « ${previewDoc.type} » pour la commande ${previewDoc.poRef}.\nFournisseur : ${previewDoc.fournisseur}\nStatut : ${previewDoc.statutVerification}`}
          </pre>
        </Modal>
      )}

      {historyDoc && (
        <Modal title={`Historique — ${historyDoc.poRef}`} onClose={() => setHistoryDoc(null)}>
          {(historyDoc.history || []).length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Aucune modification enregistrée.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {(historyDoc.history || []).map((h, i) => (
                <div key={i} style={{ padding: '10px 12px', background: '#f6f8f5', borderRadius: 8, fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{h.action}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 2 }}>{h.date} · {h.user}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,31,58,0.45)', zIndex: 500,
      display: 'grid', placeItems: 'center', padding: 20,
    }} onClick={onClose}>
      <div className="card fade" style={{
        width: '100%', maxWidth: wide ? 640 : 420, padding: 22, maxHeight: '90vh', overflow: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>{title}</strong>
          <button type="button" className="btn btn-g" style={{ padding: '6px 10px' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
