import React from 'react';
import LogiDocLogo from '../ui/LogiDocLogo';

const ICONS = {
  dashboard: '☰',
  documents: '◈',
  po: '☰',
  transit: '☰',
  treasury: '◈',
  notifications: '🔔',
  reports: '☰',
  settings: '⚙',
  logs: '≡',
  profile: '',
  logout: '⏻',
};

const ALL_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: ['management'], section: 'principal' },
  { id: 'documents', label: 'Fournisseur', icon: ICONS.documents, roles: ['management', 'fournisseur'], section: 'modules' },
  { id: 'po', label: 'Approvisionnement', icon: ICONS.po, roles: ['management', 'approvisionnement'], section: 'modules' },
  { id: 'transit', label: 'Transit', icon: ICONS.transit, roles: ['management', 'transit'], section: 'modules' },
  { id: 'treasury', label: 'Trésorerie', icon: ICONS.treasury, roles: ['management', 'tresorerie'], section: 'modules' },
  { id: 'notifications', label: 'Notifications', icon: ICONS.notifications, roles: ['management'], section: 'management' },
  { id: 'reports', label: 'Rapports', icon: ICONS.reports, roles: ['management'], section: 'management' },
  { id: 'settings', label: 'Paramètres', icon: ICONS.settings, roles: ['management'], section: 'management' },
  { id: 'logs', label: 'Journaux système', icon: ICONS.logs, roles: ['management'], section: 'management' },
  { id: 'profile', label: 'Mon profil', icon: ICONS.profile, roles: ['management', 'fournisseur', 'approvisionnement', 'transit', 'tresorerie'], section: 'account' },
];

const SECTION_LABELS = {
  principal: 'Navigation',
  modules: 'Départements',
  management: 'Management',
  account: 'Compte',
};

export default function Sidebar({ role, activeView, onNavigate, collapsed, onToggleCollapse, onLogout }) {
  const items = ALL_ITEMS.filter((item) => item.roles.includes(role));
  const sections = ['principal', 'modules', 'management', 'account'];

  return (
    <aside className={`ld-sidebar no-print ${collapsed ? 'collapsed' : ''}`}>
      <style>{`
        .ld-sidebar {
          background: linear-gradient(180deg, #0B2362 0%, #1A3A7A 100%);
          color: #cdd7d1; display: flex; flex-direction: column;
          width: 272px; min-height: 100vh; transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          border-right: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
          box-shadow: 4px 0 24px rgba(11,31,58,0.08);
        }
        .ld-sidebar.collapsed { width: 76px; }
        .ld-sidebar-header {
          padding: 22px 18px; display: flex; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ld-sidebar.collapsed .ld-sidebar-text,
        .ld-sidebar.collapsed .ld-sidebar-section-label { display: none; }
        .ld-sidebar-nav { flex: 1; padding: 14px 12px; overflow-y: auto; }
        .ld-sidebar-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: rgba(255,255,255,0.3);
          padding: 12px 14px 6px; margin-top: 4px;
        }
        .ld-sidebar-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          border-radius: 11px; border: none; background: transparent; color: rgba(255,255,255,0.55);
          font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left;
          transition: all 0.25s; position: relative; width: 100%; margin-bottom: 2px;
        }
        .ld-sidebar-item:hover {
          background: rgba(255,255,255,0.07); color: #fff;
          transform: translateX(2px);
        }
        .ld-sidebar-item.active {
          background: linear-gradient(135deg, rgba(138,196,61,0.25), rgba(138,196,61,0.1));
          color: #fff; font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(138,196,61,0.35);
        }
        .ld-sidebar-item.active::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 55%; background: #8AC43D; border-radius: 0 3px 3px 0;
        }
        .ld-sidebar-icon {
          font-size: 17px; width: 26px; text-align: center; flex-shrink: 0;
          display: grid; place-items: center;
        }
        .ld-sidebar-footer { padding: 14px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .ld-sidebar-toggle {
          background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.5);
          padding: 10px; border-radius: 10px; cursor: pointer; width: 100%;
          margin-bottom: 8px; transition: 0.25s; font-size: 14px;
        }
        .ld-sidebar-toggle:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .ld-sidebar-logout { color: #f0a0a0 !important; }
        .ld-sidebar-logout:hover { background: rgba(192,57,43,0.15) !important; color: #ffc9c9 !important; }
        @media (max-width: 768px) {
          .ld-sidebar { position: fixed; z-index: 200; height: 100vh; }
          .ld-sidebar.collapsed { transform: translateX(-100%); width: 272px; }
        }
      `}</style>

      <div className="ld-sidebar-header">
        <LogiDocLogo size={collapsed ? 'sm' : 'md'} variant="light" />
      </div>

      <nav className="ld-sidebar-nav">
        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;
          return (
            <div key={section}>
              {!collapsed && <div className="ld-sidebar-section-label">{SECTION_LABELS[section]}</div>}
              {sectionItems.map((item) => (
                <button
                  key={item.id}
                  className={`ld-sidebar-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                >
                  <span className="ld-sidebar-icon">{item.icon}</span>
                  <span className="ld-sidebar-text">{item.label}</span>
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="ld-sidebar-footer">
        <button className="ld-sidebar-toggle" onClick={onToggleCollapse} title={collapsed ? 'Développer' : 'Réduire'}>
          {collapsed ? '→' : '←'}
        </button>
        <button className="ld-sidebar-item ld-sidebar-logout" onClick={onLogout}>
          <span className="ld-sidebar-icon">{ICONS.logout}</span>
          <span className="ld-sidebar-text">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
