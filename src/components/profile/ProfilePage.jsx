import React, { useState } from 'react';
import { ROLES } from '../../platform/logidoc-core';
import { COMMON_PROFILE_FIELDS, ROLE_PROFILE_FIELDS, REGISTERABLE_ROLES } from '../../data/config';
import { useAuth } from '../../context/AuthContext';
import EditProfileModal from './EditProfileModal';

const CSS = `
  .profile-page { display: grid; gap: 24px; max-width: 960px; }
  .profile-hero {
    display: flex; align-items: center; gap: 24px; padding: 28px 32px;
    background: linear-gradient(135deg, #0B1F3A 0%, #102A4C 60%, #0a3d2e 100%);
    border-radius: var(--radius); color: #fff; position: relative; overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .profile-hero::after {
    content: ''; position: absolute; top: -40%; right: -10%; width: 300px; height: 300px;
    background: rgba(0,168,112,0.12); border-radius: 50%; filter: blur(40px);
  }
  .profile-hero-avatar {
    width: 96px; height: 96px; border-radius: 20px; overflow: hidden;
    background: rgba(255,255,255,0.12); border: 3px solid rgba(0,168,112,0.5);
    display: grid; place-items: center; font-size: 36px; font-weight: 800;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .profile-hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-hero-info { position: relative; z-index: 1; flex: 1; min-width: 0; }
  .profile-hero-name { font-family: Archivo,sans-serif; font-size: 26px; font-weight: 800; margin: 0; }
  .profile-hero-role {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 8px;
    padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
    background: rgba(0,168,112,0.25); border: 1px solid rgba(0,168,112,0.4);
  }
  .profile-hero-meta { font-size: 13px; opacity: 0.75; margin-top: 10px; }
  .profile-edit-btn {
    position: relative; z-index: 1; padding: 12px 24px; border-radius: 12px;
    border: none; background: linear-gradient(135deg, #00A870, #008A5C);
    color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,168,112,0.35); transition: var(--transition);
  }
  .profile-edit-btn:hover { transform: translateY(-2px); }
  .profile-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
  .profile-card {
    background: #fff; border-radius: var(--radius); border: 1px solid var(--line);
    overflow: hidden; box-shadow: var(--shadow-sm); transition: var(--transition);
  }
  .profile-card:hover { box-shadow: var(--shadow-md); border-color: rgba(0,168,112,0.25); }
  .profile-card-header {
    padding: 14px 20px; background: var(--bg); border-bottom: 1px solid var(--line);
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--brand);
  }
  .profile-card-body { padding: 18px 20px; display: grid; gap: 14px; }
  .profile-info-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
  .profile-info-label { color: var(--muted); font-weight: 500; }
  .profile-info-value { color: var(--accent); font-weight: 600; text-align: right; }
  @media (max-width: 640px) {
    .profile-hero { flex-direction: column; text-align: center; }
    .profile-edit-btn { width: 100%; }
  }
`;

function InfoCard({ title, fields, profile }) {
  return (
    <div className="profile-card fade">
      <div className="profile-card-header">{title}</div>
      <div className="profile-card-body">
        {fields.map((field) => (
          <div key={field.key} className="profile-info-row">
            <span className="profile-info-label">{field.label}</span>
            <span className="profile-info-value">{profile?.[field.key] || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage({ role }) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profile = user?.profile || {};
  const currentRole = ROLES.find((r) => r.id === role);
  const roleLabel = REGISTERABLE_ROLES.find((r) => r.id === role)?.nom || currentRole?.nom;
  const roleFields = ROLE_PROFILE_FIELDS[role] || [];
  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || user?.name?.charAt(0) || 'U';
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.name;

  return (
    <div className="profile-page fade">
      <style>{CSS}</style>

      <div className="profile-hero">
        <div className="profile-hero-avatar">
          {profile.profilePicture ? <img src={profile.profilePicture} alt={displayName} /> : initials}
        </div>
        <div className="profile-hero-info">
          <h1 className="profile-hero-name">{displayName}</h1>
          <span className="profile-hero-role">{currentRole?.icon} {roleLabel}</span>
          <div className="profile-hero-meta">
            {profile.email || user?.email}
            {profile.phone && <> · {profile.phone}</>}
            {profile.position && <> · {profile.position}</>}
          </div>
        </div>
        <button type="button" className="profile-edit-btn" onClick={() => setEditOpen(true)}>
           Modifier le profil
        </button>
      </div>

      <div className="profile-cards">
        <InfoCard title="Informations personnelles" fields={COMMON_PROFILE_FIELDS.filter((f) => f.key !== 'email')} profile={profile} />
        <InfoCard title="Contact" fields={[{ key: 'email', label: 'Email' }, { key: 'phone', label: 'Téléphone' }]} profile={{ ...profile, email: profile.email || user?.email }} />
        {roleFields.length > 0 && (
          <InfoCard title={`Informations ${roleLabel}`} fields={roleFields} profile={profile} />
        )}
        {role === 'management' && (
          <InfoCard
            title="Accès & Supervision"
            fields={[
              { key: 'managementLevel', label: 'Niveau de management' },
              { key: 'globalAccessInfo', label: 'Accès global' },
              { key: 'department', label: 'Département' },
            ]}
            profile={profile}
          />
        )}
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} role={role} />
    </div>
  );
}
