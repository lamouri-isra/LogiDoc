import React, { useState, useRef } from 'react';
import { ROLES } from '../../platform/logidoc-core';
import { COMMON_PROFILE_FIELDS, ROLE_PROFILE_FIELDS } from '../../data/config';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const CSS = `
  .profile-modal-overlay {
    position: fixed; inset: 0; background: rgba(11,31,58,0.55);
    display: grid; place-items: center; z-index: 1000; padding: 24px;
    animation: profileFadeIn 0.25s ease;
  }
  .profile-modal {
    width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto;
    background: #fff; border-radius: 18px; box-shadow: var(--shadow-lg);
    animation: profileSlideUp 0.3s ease;
  }
  .profile-modal-header {
    padding: 22px 26px; border-bottom: 1px solid var(--line);
    background: linear-gradient(135deg, #0B1F3A, #102A4C); color: #fff;
    display: flex; justify-content: space-between; align-items: center;
  }
  .profile-modal-body { padding: 26px; display: grid; gap: 18px; }
  .profile-field label {
    display: block; font-size: 12px; font-weight: 600; color: var(--accent);
    margin-bottom: 6px;
  }
  .profile-field input, .profile-field textarea {
    width: 100%; padding: 12px 14px; border-radius: 11px;
    border: 1px solid var(--line); font-size: 14px; transition: var(--transition);
    background: var(--bg);
  }
  .profile-field input:focus, .profile-field textarea:focus {
    outline: none; border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(0,168,112,0.12); background: #fff;
  }
  .profile-field input:disabled { opacity: 0.65; cursor: not-allowed; }
  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .profile-section-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--brand); margin-top: 8px;
    padding-bottom: 8px; border-bottom: 1px solid var(--line);
  }
  .profile-avatar-upload {
    display: flex; align-items: center; gap: 16px; padding: 16px;
    background: var(--bg); border-radius: 14px; border: 1px dashed var(--line);
  }
  .profile-avatar-preview {
    width: 72px; height: 72px; border-radius: 16px; overflow: hidden;
    background: linear-gradient(135deg, #0B1F3A, #102A4C);
    display: grid; place-items: center; color: #fff; font-size: 28px; font-weight: 700;
    flex-shrink: 0;
  }
  .profile-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
  .profile-error {
    background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.25);
    color: var(--ko); padding: 12px 14px; border-radius: 10px; font-size: 13px;
  }
  .profile-modal-footer {
    padding: 18px 26px; border-top: 1px solid var(--line);
    display: flex; justify-content: flex-end; gap: 10px;
  }
  .profile-btn {
    padding: 11px 22px; border-radius: 11px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: var(--transition); border: none;
  }
  .profile-btn-secondary {
    background: var(--bg); color: var(--accent); border: 1px solid var(--line);
  }
  .profile-btn-primary {
    background: linear-gradient(135deg, #00A870, #008A5C); color: #fff;
    box-shadow: 0 4px 14px rgba(0,168,112,0.3);
  }
  .profile-btn-primary:hover { transform: translateY(-1px); }
  .profile-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  @keyframes profileFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes profileSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @media (max-width: 560px) { .profile-grid { grid-template-columns: 1fr; } }
`;

export default function EditProfileModal({ open, onClose, role }) {
  const { user, updateProfile, changePassword } = useAuth();
  const { addNotification } = useNotifications();
  const fileRef = useRef(null);
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open && user?.profile) {
      setForm({ ...user.profile });
      setPasswords({ current: '', new: '', confirm: '' });
      setError('');
    }
  }, [open, user?.profile]);

  if (!open) return null;

  const roleFields = ROLE_PROFILE_FIELDS[role] || [];
  const currentRole = ROLES.find((r) => r.id === role);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleChange('profilePicture', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const profileResult = updateProfile(form);
    if (!profileResult.ok) {
      setError(profileResult.error);
      setSaving(false);
      return;
    }

    if (passwords.new || passwords.current || passwords.confirm) {
      const pwResult = changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      });
      if (!pwResult.ok) {
        setError(pwResult.error);
        setSaving(false);
        return;
      }
    }

    addNotification({
      type: 'success',
      category: 'profile',
      route: 'profile',
      title: 'Profil mis à jour',
      message: 'Vos informations ont été enregistrées avec succès.',
    });
    setSaving(false);
    onClose();
  };

  const initials = [form.firstName, form.lastName].filter(Boolean).map((n) => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <style>{CSS}</style>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 18, margin: 0 }}>Modifier le profil</h3>
            <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{currentRole?.icon} {currentRole?.nom}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div className="profile-modal-body">
          {error && <div className="profile-error">{error}</div>}

          <div className="profile-avatar-upload">
            <div className="profile-avatar-preview">
              {form.profilePicture ? <img src={form.profilePicture} alt="Avatar" /> : initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>Photo de profil</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 10 }}>JPG, PNG — max 2 Mo</div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
              <button type="button" className="profile-btn profile-btn-secondary" onClick={() => fileRef.current?.click()}>
                Choisir une photo
              </button>
              {form.profilePicture && (
                <button type="button" className="profile-btn profile-btn-secondary" style={{ marginLeft: 8 }} onClick={() => handleChange('profilePicture', '')}>
                  Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="profile-section-title">Informations personnelles</div>
          <div className="profile-grid">
            {COMMON_PROFILE_FIELDS.map((field) => (
              <div key={field.key} className="profile-field" style={field.key === 'email' ? { gridColumn: '1 / -1' } : undefined}>
                <label>{field.label}{field.required ? ' *' : ''}</label>
                <input
                  type={field.type}
                  value={form[field.key] || ''}
                  disabled={field.disabled}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {roleFields.length > 0 && (
            <>
              <div className="profile-section-title">Informations {currentRole?.nom}</div>
              <div className="profile-grid">
                {roleFields.map((field) => (
                  <div key={field.key} className="profile-field">
                    <label>{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="profile-section-title">Changer le mot de passe</div>
          <div className="profile-grid">
            <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
              <label>Mot de passe actuel</label>
              <input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} placeholder="Laisser vide pour ne pas modifier" />
            </div>
            <div className="profile-field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))} />
            </div>
            <div className="profile-field">
              <label>Confirmer le mot de passe</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button type="button" className="profile-btn profile-btn-secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="profile-btn profile-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
