import React, { useState } from 'react';
import LogiDocLogo from '../ui/LogiDocLogo';
import { useAuth } from '../../context/AuthContext';
import { REGISTERABLE_ROLES } from '../../data/config';

const CSS = `
  @keyframes authFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,-24px)} }
  @keyframes authSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes authPulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
  @keyframes authShine { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

  .auth-page {
    min-height: 100vh; display: flex; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #0B1F3A 0%, #102A4C 50%, #0a3d2e 100%);
  }
  .auth-bg-grid {
    position: absolute; inset: 0; opacity: 0.035;
    background-image: linear-gradient(#DFF7ED 1px, transparent 1px), linear-gradient(90deg, #DFF7ED 1px, transparent 1px);
    background-size: 56px 56px;
  }
  .auth-orb { position: absolute; border-radius: 50%; filter: blur(80px); animation: authFloat 14s ease-in-out infinite; }
  .auth-orb-1 { width: 500px; height: 500px; background: rgba(0,168,112,0.18); top: -12%; right: -8%; }
  .auth-orb-2 { width: 400px; height: 400px; background: rgba(223,247,237,0.08); bottom: -10%; left: -6%; animation-delay: -5s; }
  .auth-orb-3 { width: 280px; height: 280px; background: rgba(16,42,76,0.6); top: 50%; left: 40%; animation-delay: -8s; }

  .auth-brand-panel {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 48px 56px; position: relative; z-index: 1; color: #fff;
    min-width: 0;
  }
  .auth-brand-panel h1 {
    font-family: Archivo, sans-serif; font-size: clamp(28px, 4vw, 42px); font-weight: 800;
    line-height: 1.15; margin-top: 32px; letter-spacing: -0.02em;
  }
  .auth-brand-panel h1 span { color: #DFF7ED; }
  .auth-brand-desc { font-size: 16px; color: rgba(255,255,255,0.65); margin-top: 16px; max-width: 420px; line-height: 1.6; }
  .auth-features { display: grid; gap: 14px; margin-top: 40px; max-width: 400px; }
  .auth-feature {
    display: flex; align-items: center; gap: 14px; padding: 14px 18px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; backdrop-filter: blur(8px); transition: 0.3s;
  }
  .auth-feature:hover { background: rgba(255,255,255,0.1); transform: translateX(4px); }
  .auth-feature-icon {
    width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
    background: linear-gradient(135deg, rgba(0,168,112,0.3), rgba(0,168,112,0.1)); font-size: 18px;
  }
  .auth-feature-text { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.85); }
  .auth-feature-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }

  .auth-form-panel {
    width: 100%; max-width: 520px; display: flex; align-items: center; justify-content: center;
    padding: 32px 40px; position: relative; z-index: 1;
  }
  .auth-card {
    width: 100%; padding: 40px 36px; position: relative; overflow: hidden;
    background: rgba(255,255,255,0.07); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
    border-radius: 24px; border: 1px solid rgba(255,255,255,0.14);
    box-shadow: 0 32px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    animation: authSlide 0.6s ease;
  }
  .auth-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,168,112,0.5), transparent);
  }
  .auth-card-shine {
    position: absolute; top: 0; left: 0; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    animation: authShine 6s ease-in-out infinite;
  }

  .auth-tabs { display: flex; gap: 4px; margin-bottom: 28px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 12px; }
  .auth-tab {
    flex: 1; padding: 11px; border: none; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: 0.25s; background: transparent; color: rgba(255,255,255,0.5);
  }
  .auth-tab.active {
    background: linear-gradient(135deg, #00A870, #008A5C); color: #fff;
    box-shadow: 0 4px 16px rgba(0,168,112,0.4);
  }
  .auth-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 6px; display: block; }
  .auth-input {
    width: 100%; padding: 13px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; margin-bottom: 16px;
    outline: none; transition: 0.25s;
  }
  .auth-input::placeholder { color: rgba(255,255,255,0.3); }
  .auth-input:focus {
    border-color: #00A870; box-shadow: 0 0 0 3px rgba(0,168,112,0.2);
    background: rgba(255,255,255,0.1);
  }
  .auth-select { appearance: none; cursor: pointer; }
  .auth-btn {
    width: 100%; padding: 15px; border-radius: 12px; border: none; margin-top: 8px;
    background: linear-gradient(135deg, #00A870, #008A5C); color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: 0.25s; box-shadow: 0 6px 20px rgba(0,168,112,0.35);
    letter-spacing: 0.01em;
  }
  .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,168,112,0.45); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-error {
    background: rgba(192,57,43,0.15); border: 1px solid rgba(192,57,43,0.35); color: #ffc9c9;
    padding: 12px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px;
  }
  .auth-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .auth-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); cursor: pointer; }
  .auth-forgot { background: none; border: none; color: #DFF7ED; font-size: 13px; cursor: pointer; font-weight: 500; }
  .auth-forgot:hover { text-decoration: underline; }
  .auth-title { font-family: Archivo, sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px; }
  .auth-sub { font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 28px; }
  .auth-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: rgba(255,255,255,0.45); cursor: pointer; font-size: 15px;
  }
  .auth-mobile-logo { display: none; margin-bottom: 24px; }

  @media (max-width: 960px) {
    .auth-page { flex-direction: column; }
    .auth-brand-panel { display: none; }
    .auth-form-panel { max-width: 100%; padding: 24px; }
    .auth-mobile-logo { display: block; }
  }
`;

function PasswordField({ value, onChange, show, onToggle, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <input
        className="auth-input" type={show ? 'text' : 'password'}
        value={value} onChange={onChange} placeholder={placeholder}
        required style={{ marginBottom: 0, paddingRight: 44 }}
      />
      <button type="button" className="auth-eye" onClick={onToggle} aria-label="Toggle password">
        {show ? '' : '👁'}
      </button>
    </div>
  );
}

export default function AuthPage({ onAuthenticated }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('fournisseur');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = mode === 'login'
      ? login({ email, password, remember })
      : register({ email, password, name, role });
    setLoading(false);
    if (result.ok) {
      onAuthenticated?.(result.user);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <style>{CSS}</style>
      <div className="auth-bg-grid" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-brand-panel">
        <LogiDocLogo size="lg" variant="light" />
        <h1>Plateforme <span>Logistique</span> & Documentaire</h1>
        <p className="auth-brand-desc">
          Solution enterprise HOLCIM pour la gestion des commandes, documents fournisseurs,
          transit douanier et trésorerie — en temps réel.
        </p>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon"></div>
            <div>
              <div className="auth-feature-text">Gestion des Purchase Orders</div>
              <div className="auth-feature-sub">Suivi complet du cycle d'approvisionnement</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon"></div>
            <div>
              <div className="auth-feature-text">Contrôle documentaire intelligent</div>
              <div className="auth-feature-sub">Conformité et validation automatisée</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon"></div>
            <div>
              <div className="auth-feature-text">Transit & Trésorerie intégrés</div>
              <div className="auth-feature-sub">Dédouanement, domiciliation et chèques</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-shine" />
          <div className="auth-mobile-logo">
            <LogiDocLogo size="md" variant="light" />
          </div>

          <div className="auth-tabs">
            <button type="button" className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
              Connexion
            </button>
            <button type="button" className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
              Inscription
            </button>
          </div>

          <h2 className="auth-title">{mode === 'login' ? 'Bienvenue' : 'Créer un compte'}</h2>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Accédez à votre espace LogiDoc HOLCIM'
              : 'Rejoignez la plateforme de gestion logistique'}
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            {mode === 'register' && (
              <>
                <label className="auth-label">Nom complet</label>
                <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom" required />
                <label className="auth-label">Rôle</label>
                <select className="auth-input auth-select" value={role} onChange={(e) => setRole(e.target.value)} required>
                  {REGISTERABLE_ROLES.map((r) => (
                    <option key={r.id} value={r.id} style={{ color: '#1A1F2C' }}>{r.icon} {r.nom}</option>
                  ))}
                </select>
              </>
            )}

            <label className="auth-label">Email professionnel</label>
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@holcim.com" required autoComplete="email" />

            <label className="auth-label">Mot de passe</label>
            <PasswordField
              value={password} onChange={(e) => setPassword(e.target.value)}
              show={showPassword} onToggle={() => setShowPassword((s) => !s)}
              placeholder={mode === 'register' ? 'Minimum 6 caractères' : '••••••••'}
            />

            {mode === 'login' && (
              <div className="auth-row">
                <label className="auth-check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    style={{ accentColor: '#00A870' }} />
                  Se souvenir de moi
                </label>
                <button type="button" className="auth-forgot"
                  onClick={() => setError('Contactez votre Responsable / Management HOLCIM pour réinitialiser votre mot de passe.')}>
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Connexion en cours…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
