import React, { useState, useCallback } from 'react';
import {
  Style, INITIAL_POS, todayISO, ROLES,
  InterfaceFournisseur, InterfaceResponsable,
} from './platform/logidoc-core';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLE_DEFAULT_VIEW } from './data/config';
import AuthPage from './components/layout/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import RoleDashboard from './components/dashboard/RoleDashboard';
import ApproDashboard from './components/dashboard/ApproDashboard';
import TransitDashboard from './components/dashboard/TransitDashboard';
import TresorerieDashboard from './components/dashboard/TresorerieDashboard';
import ProfilePage from './components/profile/ProfilePage';
import AdminUsers from './components/admin/AdminUsers';
import AdminReports from './components/admin/AdminReports';
import AdminSettings from './components/admin/AdminSettings';
import AdminLogs from './components/admin/AdminLogs';
import AdminNotifications from './components/admin/AdminNotifications';
import { SkeletonCard } from './components/ui/Skeleton';
import { INITIAL_APPRO_DOCS, INITIAL_DOSSIERS } from './data/approData';

function AppShell() {
  const { user, loading, logout, getAllUsers } = useAuth();
  const [role, setRole] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pos, setPos] = useState(INITIAL_POS);
  const [docsByPo, setDocsByPo] = useState({});
  const [dossiers, setDossiers] = useState(INITIAL_DOSSIERS);
  const [approDocuments, setApproDocuments] = useState(INITIAL_APPRO_DOCS);

  React.useEffect(() => {
    if (user) {
      setRole(user.role);
      setActiveView(ROLE_DEFAULT_VIEW[user.role] || 'dashboard');
    } else {
      setRole(null);
    }
  }, [user]);

  const navigate = useCallback((view) => {
    setActiveView(view);
  }, []);

  return (
    <NotificationProvider onNavigate={navigate} userRole={role}>
      <AppContent
        user={user}
        loading={loading}
        role={role}
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        pos={pos}
        setPos={setPos}
        docsByPo={docsByPo}
        setDocsByPo={setDocsByPo}
        dossiers={dossiers}
        setDossiers={setDossiers}
        approDocuments={approDocuments}
        setApproDocuments={setApproDocuments}
        onLogout={logout}
        getAllUsers={getAllUsers}
      />
    </NotificationProvider>
  );
}

function AppContent({
  user, loading, role, activeView, setActiveView,
  sidebarCollapsed, setSidebarCollapsed,
  pos, setPos, docsByPo, setDocsByPo, dossiers, setDossiers,
  approDocuments, setApproDocuments,
  onLogout, getAllUsers,
}) {
  const { addNotification } = useNotifications();

  React.useEffect(() => {
    if (user?.id) {
      addNotification({
        type: 'info',
        category: 'dashboard',
        route: ROLE_DEFAULT_VIEW[user.role] || 'dashboard',
        title: 'Utilisateur connecté',
        message: `${user.name} — ${ROLES.find((r) => r.id === user.role)?.nom}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updatePo = useCallback((poId, fields) => {
    setPos((prev) => prev.map((p) => (p.id === poId ? { ...p, ...fields } : p)));
    if (fields.packingDate || fields.goodsReady || fields.plannedReleaseDate) {
      addNotification({
        type: 'info', category: 'po', route: 'po',
        title: 'PO mis à jour', message: `PO ${poId} — données modifiées.`,
      });
    }
  }, [addNotification, setPos]);

  const sendToAppro = useCallback((po, requis, docs) => {
    const num = `DT-2026-${String(100 + dossiers.length).padStart(3, '0')}`;
    setDossiers((d) => [...d, {
      id: num, poId: po.id, fournisseur: po.fournisseur, transitaire: 'ALGER TRANSIT SARL',
      equipeTransit: 'Équipe Transit Alger',
      docs: requis.map((k) => ({ type: k, statut: docs[k]?.statut })),
      validéAppro: false, transitCree: false, predomDemandée: false, domiciliée: false,
      chequeDemandé: false, chequeValidé: false, declaration: false, d10: null, situation: 'Reçu appro',
      numDomiciliation: '', banque: 'BNA', dateCreationDom: '', statutDom: 'En attente',
      referenceTransfert: '', etapeDom: 1, dateValidationDom: '',
      dateDeclaration: '', dateDedouanement: '',
      dateArrivee: todayISO(), dateReceptionDossier: todayISO(),
      dateDemandeChèque: '', dateReceptionChèque: '',
      criticite: po.classeFourn === 'C' ? 'Haute' : po.classeFourn === 'B' ? 'Moyenne' : 'Faible',
      statutDossier: 'Créé',
      nbTC: 1, nbPackages: 12, nbColis: '1 TC / 12 colis',
      dateCreation: todayISO(), dateTransmission: '',
      completudeDoc: 55, observations: 'Dossier reçu — vérification documentaire en attente',
    }]);
    addNotification({
      type: 'success', category: 'documents', route: 'documents',
      title: 'Document envoyé', message: `Dossier ${num} transmis à l'approvisionnement.`,
    });
    alert(`Dossier transmis à l'approvisionnement — N° ${num}`);
  }, [dossiers.length, addNotification, setDossiers]);

  const validerDoc = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? {
      ...d, validéAppro: true, statutDossier: 'En Préparation', completudeDoc: Math.max(d.completudeDoc || 0, 85),
    } : d)));
    addNotification({
      type: 'success', category: 'documents', route: 'po',
      title: 'Document validé', message: `Dossier ${id} validé par l'approvisionnement.`,
    });
  }, [addNotification, setDossiers]);

  const createTransit = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? {
      ...d, transitCree: true, predomDemandée: true, situation: 'En cours transit',
      statutDossier: 'En Cours', dateTransmission: todayISO(),
      d10: `D10-${Math.floor(Math.random() * 90000 + 10000)}`,
    } : d)));
    addNotification({
      type: 'info', category: 'transit', route: 'transit',
      title: 'Dossier transit créé', message: `Dossier transit ${id} ouvert.`,
    });
  }, [addNotification, setDossiers]);

  const demandeChèque = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => {
      if (d.id !== id) return d;
      if (!d.domiciliée) {
        alert(' Impossible de demander un chèque : la domiciliation doit être validée (étape Clôturée) avant d\'initier le paiement.');
        return d;
      }
      addNotification({
        type: 'warning', category: 'cheque', route: 'treasury',
        title: 'Chèque demandé', message: `Demande de chèque pour le dossier ${id}.`,
      });
      return { ...d, chequeDemandé: true, dateDemandeChèque: todayISO() };
    }));
  }, [addNotification, setDossiers]);

  const majDeclaration = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? { ...d, declaration: true, dateDeclaration: todayISO(), situation: 'Déclaré' } : d)));
    addNotification({
      type: 'info', category: 'transit', route: 'transit',
      title: 'Déclaration douanière', message: `Dossier ${id} déclaré.`,
    });
  }, [addNotification, setDossiers]);

  const majDedouanement = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? { ...d, dateDedouanement: todayISO(), situation: 'Dédouané' } : d)));
    addNotification({
      type: 'success', category: 'transit', route: 'transit',
      title: 'Dédouanement terminé', message: `Dossier ${id} dédouané.`,
    });
  }, [addNotification, setDossiers]);

  const traiterPredom = useCallback((id, fields) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? { ...d, domiciliée: true, dateValidationDom: todayISO(), ...fields } : d)));
    addNotification({
      type: 'success', category: 'domiciliation', route: 'treasury',
      title: 'Domiciliation complétée', message: `Domiciliation clôturée — dossier ${id}.`,
    });
  }, [addNotification, setDossiers]);

  const validerChèque = useCallback((id) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? { ...d, chequeValidé: true, dateReceptionChèque: todayISO() } : d)));
    addNotification({
      type: 'success', category: 'cheque', route: 'treasury',
      title: 'Chèque approuvé', message: `Chèque émis pour le dossier ${id}.`,
    });
  }, [addNotification, setDossiers]);

  const updateDossier = useCallback((id, fields) => {
    setDossiers((ds) => ds.map((d) => (d.id === id ? { ...d, ...fields } : d)));
  }, [setDossiers]);

  const interfaceProps = {
    pos, docsByPo, setDocsByPo, dossiers,
    approDocuments, setApproDocuments,
    sendToAppro, updatePo, createTransit, validerDoc,
    demandeChèque, majDeclaration, majDedouanement,
    traiterPredom, validerChèque, updateDossier,
  };

  const renderProfile = () => <ProfilePage role={role} />;

  const renderManagementDashboard = () => (
    <RoleDashboard role={role} title="Control Tower Exécutif">
      <InterfaceResponsable dossiers={dossiers} pos={pos} updatePo={updatePo} />
    </RoleDashboard>
  );

  const renderContent = () => {
    if (activeView === 'profile') {
      return renderProfile();
    }

    if (role === 'management') {
      switch (activeView) {
        case 'dashboard':
          return renderManagementDashboard();
        case 'documents':
          return <RoleDashboard role={role} title="Fournisseur"><InterfaceFournisseur {...interfaceProps} /></RoleDashboard>;
        case 'po':
          return <ApproDashboard {...interfaceProps} />;
        case 'transit':
          return <TransitDashboard {...interfaceProps} />;
        case 'treasury':
          return <TresorerieDashboard {...interfaceProps} />;
        case 'notifications':
          return <AdminNotifications />;
        case 'reports':
          return <AdminReports pos={pos} dossiers={dossiers} />;
        case 'settings':
          return (
            <div style={{ display: 'grid', gap: 16 }}>
              <AdminSettings />
              <AdminUsers getAllUsers={getAllUsers} />
            </div>
          );
        case 'logs':
          return <AdminLogs />;
        default:
          return renderManagementDashboard();
      }
    }

    switch (role) {
      case 'fournisseur':
        return activeView === 'documents'
          ? <RoleDashboard role={role}><InterfaceFournisseur {...interfaceProps} /></RoleDashboard>
          : <RoleDashboard role={role}><InterfaceFournisseur {...interfaceProps} /></RoleDashboard>;
      case 'approvisionnement':
        return <ApproDashboard {...interfaceProps} />;
      case 'transit':
        return <TransitDashboard {...interfaceProps} />;
      case 'tresorerie':
        return <TresorerieDashboard {...interfaceProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="ld" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 40, background: '#F4F7F0' }}>
        <Style />
        <div style={{ display: 'grid', gap: 16, width: 320 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ld">
        <Style />
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="ld" style={{ display: 'flex', minHeight: '100vh' }}>
      <Style />
      <Sidebar
        role={role}
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onLogout={onLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar user={user} role={role} onLogout={onLogout} onNavigate={setActiveView} activeView={activeView} />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--bg)' }}>
          <div key={`${role}-${activeView}`} className="fade">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
