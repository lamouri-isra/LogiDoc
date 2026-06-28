import React, { useRef, useMemo } from 'react';
import StatsCards from './StatsCards';
import ChartsSection from './ChartsSection';
import PrintButton, { PrintArea } from '../ui/PrintButton';
import DataTable from '../ui/DataTable';
import { StatutPill, calcCriticite } from '../../platform/logidoc-core';
import { useNotifications } from '../../context/NotificationContext';

export default function KpiDashboard({ pos, dossiers, docsByPo, getAllUsers }) {
  const printRef = useRef(null);
  const { notifications } = useNotifications();

  const metrics = useMemo(() => {
    const totalDocs = Object.values(docsByPo).reduce((s, po) => s + Object.keys(po).length, 0);
    const validatedDocs = Object.values(docsByPo).reduce(
      (s, po) => s + Object.values(po).filter((d) => d.statut === 'Conforme').length, 0
    );
    const pendingDocs = totalDocs - validatedDocs;

    const activePOs = pos.filter((p) => !p.deliveryDate).length;
    const completedPOs = pos.filter((p) => p.deliveryDate).length + dossiers.filter((d) => d.dateDedouanement).length;

    const transitFiles = dossiers.filter((d) => d.transitCree).length;
    const treasuryRequests = dossiers.filter((d) => d.predomDemandée || d.chequeDemandé).length;

    const delayedOrders = pos.filter((p) =>
      (p.packingDate && p.plannedReleaseDate && p.packingDate > p.plannedReleaseDate)
      || (p.deliveryDate && p.eta && p.deliveryDate > p.eta)
    ).length;

    const criticalFiles = dossiers.filter((d) => {
      const po = pos.find((p) => p.id === d.poId);
      if (!po) return false;
      const docsComplets = d.docs?.every((doc) => doc.statut === 'Conforme');
      return ['Très critique', 'Critique'].includes(calcCriticite(po, docsComplets).niveau);
    }).length;

    const onTimePOs = pos.filter((p) => {
      if (!p.packingDate || !p.plannedReleaseDate) return true;
      return p.packingDate <= p.plannedReleaseDate;
    }).length;
    const supplierPerf = pos.length ? Math.round((onTimePOs / pos.length) * 100) : 100;

    const processingDossiers = dossiers.filter((d) => d.dateArrivee && d.validéAppro);
    const processingTime = processingDossiers.length
      ? Math.round(processingDossiers.reduce((s, d) => {
        const days = Math.round((new Date(d.dateReceptionDossier || d.dateArrivee) - new Date(d.dateArrivee)) / 86400000);
        return s + Math.max(0, days);
      }, 0) / processingDossiers.length)
      : 0;

    const deliveredPOs = pos.filter((p) => p.deliveryDate);
    const onTimeDelivery = deliveredPOs.filter((p) => !p.eta || p.deliveryDate <= p.eta).length;
    const deliveryPerf = deliveredPOs.length ? Math.round((onTimeDelivery / deliveredPOs.length) * 100) : (pos.length ? 100 : 0);

    const users = getAllUsers ? getAllUsers() : [];

    return {
      totalDocs, validatedDocs, pendingDocs, activePOs, completedPOs,
      transitFiles, treasuryRequests, delayedOrders, criticalFiles,
      supplierPerf, processingTime, deliveryPerf, users,
    };
  }, [pos, dossiers, docsByPo, getAllUsers]);

  const stats = [
    { icon: '', label: 'Total POs', value: pos.length, color: '#0B1F3A', sub: 'Commandes enregistrées' },
    { icon: '', label: 'POs Actifs', value: metrics.activePOs, color: '#102A4C', sub: 'En cours de traitement' },
    { icon: '', label: 'POs Complétés', value: metrics.completedPOs, color: '#00A870', sub: 'Livrés ou dédouanés' },
    { icon: '', label: 'Documents en attente', value: metrics.pendingDocs, color: metrics.pendingDocs > 0 ? '#0B3D91' : '#22C55E', sub: `${metrics.totalDocs} documents total` },
    { icon: '', label: 'Fichiers critiques', value: metrics.criticalFiles, color: metrics.criticalFiles > 0 ? '#0B3D91' : '#22C55E', sub: 'Priorité élevée' },
    { icon: '', label: 'Dossiers transit', value: metrics.transitFiles, color: '#0B3D91', sub: 'En cours douanier' },
    { icon: '', label: 'Demandes trésorerie', value: metrics.treasuryRequests, color: '#0B3D91', sub: 'Domiciliation & chèques' },
    { icon: '', label: 'Commandes en retard', value: metrics.delayedOrders, color: metrics.delayedOrders > 0 ? '#0B3D91' : '#22C55E', sub: 'Délais dépassés' },
    { icon: '', label: 'Performance fournisseur', value: `${metrics.supplierPerf}%`, color: metrics.supplierPerf >= 80 ? '#22C55E' : '#0B3D91', trend: metrics.supplierPerf >= 80 ? '✓ Bon' : '⚠ Suivi', trendStyle: { background: metrics.supplierPerf >= 80 ? 'var(--brand-l)' : '#E8EEF8', color: metrics.supplierPerf >= 80 ? 'var(--brand-d)' : '#0B3D91' } },
    { icon: '', label: 'Temps de traitement', value: `${metrics.processingTime} j`, color: metrics.processingTime > 7 ? '#0B3D91' : '#22C55E', sub: 'Moyenne validation' },
    { icon: '', label: 'Performance livraison', value: `${metrics.deliveryPerf}%`, color: metrics.deliveryPerf >= 80 ? '#22C55E' : '#0B3D91', sub: 'Livraisons à temps' },
    { icon: '', label: 'Utilisateurs', value: metrics.users.length, color: '#0B1F3A', sub: `${notifications.length} notifications` },
  ];

  const activities = [
    ...dossiers.slice(-6).reverse().map((d) => ({
      id: d.id,
      time: d.dateArrivee || '—',
      action: `Dossier ${d.id} — ${d.situation}`,
      dept: d.validéAppro ? (d.transitCree ? (d.domiciliée ? 'Trésorerie' : 'Transit') : 'Approvisionnement') : 'Fournisseur',
      type: d.domiciliée || d.dateDedouanement ? 'success' : d.validéAppro ? 'info' : 'warning',
    })),
    ...notifications.slice(0, 3).map((n) => ({
      id: n.id,
      time: n.time?.slice(0, 10) || '—',
      action: n.title,
      dept: 'Système',
      type: n.type === 'success' ? 'success' : n.type === 'error' ? 'error' : 'info',
    })),
  ];

  const activityColumns = [
    { key: 'time', label: 'Date' },
    { key: 'action', label: 'Activité' },
    { key: 'dept', label: 'Département' },
    {
      key: 'type', label: 'Statut',
      render: (r) => <StatutPill s={r.type === 'success' ? 'Validé' : r.type === 'warning' ? 'À vérifier' : r.type === 'error' ? 'Non conforme' : 'En attente'} />,
    },
  ];

  return (
    <div className="fade" style={{ display: 'grid', gap: 24 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 16, padding: '24px 28px',
        background: 'linear-gradient(135deg, #0B1F3A 0%, #102A4C 60%, rgba(0,168,112,0.15) 100%)',
        borderRadius: 16, color: '#fff', boxShadow: '0 8px 32px rgba(11,31,58,0.2)',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DFF7ED', marginBottom: 8 }}>
            Supervision globale — HOLCIM
          </div>
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Tableau de bord exécutif
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 8, maxWidth: 520 }}>
            Vue consolidée de l'activité Fournisseur, Approvisionnement, Transit et Trésorerie
          </p>
        </div>
        <PrintButton targetRef={printRef} label="Exporter le rapport" />
      </div>

      <PrintArea ref={printRef}>
        <StatsCards stats={stats} columns="repeat(auto-fit, minmax(180px, 1fr))" />
        <ChartsSection pos={pos} dossiers={dossiers} docsByPo={docsByPo} showDepartments />
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 22px',
            background: 'linear-gradient(135deg, #0B1F3A, #102A4C)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <strong style={{ fontFamily: 'Archivo,sans-serif', fontSize: 15 }}>Activités récentes — Tous départements</strong>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{activities.length} événements</span>
          </div>
          <DataTable columns={activityColumns} data={activities} pageSize={8} searchable />
        </div>
      </PrintArea>
    </div>
  );
}
