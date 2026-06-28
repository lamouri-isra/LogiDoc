import React, { useState, useRef, useEffect } from 'react';
import { ROLES } from '../../platform/logidoc-core';
import NotificationCenter from '../notifications/NotificationCenter';

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  documents: 'Fournisseur',
  po: 'Approvisionnement',
  transit: 'Transit',
  treasury: 'Trésorerie',
  notifications: 'Notifications',
  reports: 'Rapports',
  settings: 'Paramètres',
  logs: 'Journaux système',
  profile: 'Mon profil',
};

export default function Navbar({ user, role, onLogout, onNavigate, activeView }) {
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const currentRole = ROLES.find((r) => r.id === role);
  const profile = user?.profile || {};
  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || user?.name?.charAt(0) || 'U';
  const viewLabel = VIEW_LABELS[activeView] || activeView;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="ld-navbar no-print">
      <style>{`
        .ld-navbar {
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          padding: 14px 28px; background: #fff;
          border-bottom: 1px solid var(--line);
          position: sticky; top: 0; z-index: 100; flex-wrap: wrap;
          box-shadow: 0 2px 12px rgba(11,31,58,0.04);
        }
        .ld-navbar-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
        .ld-navbar-breadcrumb {
          font-size: 13px; color: var(--muted); font-weight: 500;
          display: flex; align-items: center; gap: 8px;
        }
        .ld-navbar-breadcrumb strong { color: var(--accent); font-weight: 700; }
        .ld-navbar-search { flex: 1; max-width: 400px; min-width: 200px; position: relative; }
        .ld-navbar-search input {
          width: 100%; padding: 10px 16px 10px 40px; border-radius: 12px;
          border: 1px solid var(--line); background: var(--bg); font-size: 13px;
          transition: all 0.25s; color: var(--ink);
        }
        .ld-navbar-search input:focus {
          outline: none; border-color: #8AC43D;
          box-shadow: 0 0 0 3px rgba(138,196,61,0.15); background: #fff;
        }
        .ld-navbar-search input::placeholder { color: var(--muted); }
        .ld-navbar-search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--muted); font-size: 14px;
        }
        .ld-navbar-right { display: flex; align-items: center; gap: 14px; }
        .ld-navbar-badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
          border-radius: 999px; font-size: 11.5px; font-weight: 700;
          background: linear-gradient(135deg, rgba(138,196,61,0.12), rgba(202,223,179,0.6));
          color: #6FA32E; border: 1px solid rgba(138,196,61,0.25);
        }
        .ld-navbar-profile { position: relative; }
        .ld-navbar-profile-btn {
          display: flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px;
          border-radius: 12px; border: 1px solid var(--line); background: #fff;
          cursor: pointer; transition: 0.25s;
        }
        .ld-navbar-profile-btn:hover { border-color: #8AC43D; box-shadow: 0 2px 8px rgba(138,196,61,0.12); }
        .ld-navbar-avatar {
          width: 34px; height: 34px; border-radius: 10px; overflow: hidden;
          background: linear-gradient(135deg, #0B2362, #1A3A7A);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px;
        }
        .ld-navbar-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ld-navbar-dropdown {
          position: absolute; right: 0; top: calc(100% + 10px); min-width: 220px;
          background: #fff; border: 1px solid var(--line); border-radius: 14px;
          box-shadow: 0 12px 40px rgba(11,31,58,0.14); padding: 8px;
          animation: navFadeIn 0.25s ease;
        }
        .ld-navbar-dropdown button {
          display: block; width: 100%; padding: 11px 14px; border: none; background: none;
          text-align: left; font-size: 13px; border-radius: 10px; cursor: pointer;
          color: var(--ink); font-weight: 500; transition: 0.2s;
        }
        .ld-navbar-dropdown button:hover { background: var(--bg); }
        @keyframes navFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @media (max-width: 640px) {
          .ld-navbar-search { max-width: 100%; order: 3; flex-basis: 100%; }
          .ld-navbar-breadcrumb { display: none; }
        }
      `}</style>

      <div className="ld-navbar-left">
        <div className="ld-navbar-breadcrumb">
          LogiDoc <span style={{ opacity: 0.4 }}>/</span> <strong>{currentRole?.nom}</strong>
          <span style={{ opacity: 0.4 }}>/</span> {viewLabel}
        </div>
        <form className="ld-navbar-search" onSubmit={(e) => e.preventDefault()}>
          <span className="ld-navbar-search-icon">🔍</span>
          <input type="search" placeholder="Rechercher PO, dossiers, documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </div>

      <div className="ld-navbar-right">
        <span className="ld-navbar-badge">{currentRole?.icon} {currentRole?.nom}</span>
        <NotificationCenter />
        <div className="ld-navbar-profile" ref={profileRef}>
          <button className="ld-navbar-profile-btn" onClick={() => setProfileOpen((o) => !o)}>
            <div className="ld-navbar-avatar">
              {profile.profilePicture ? <img src={profile.profilePicture} alt="" /> : initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              {profile.firstName || user?.name?.split(' ')[0]}
            </span>
          </button>
          {profileOpen && (
            <div className="ld-navbar-dropdown">
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>{user?.name}</div>
                {user?.email}
              </div>
              <button onClick={() => { setProfileOpen(false); onNavigate?.('profile'); }}>
                 Mon profil
              </button>
              <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{ color: '#c0392b' }}>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
