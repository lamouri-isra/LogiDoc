import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'logidoc_users';
const SESSION_KEY = 'logidoc_session';

function hashPassword(pw) {
  try { return btoa(unescape(encodeURIComponent(pw))); } catch { return pw; }
}

function splitName(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function defaultProfile(role, name, email) {
  const { firstName, lastName } = splitName(name);
  return {
    firstName,
    lastName,
    email: email || '',
    phone: '',
    position: '',
    department: '',
    profilePicture: '',
    companyName: '',
    country: '',
    supplierCode: '',
    buyerCode: '',
    transitAgency: '',
    clearanceZone: '',
    bankReference: '',
    financialDepartment: '',
    managementLevel: role === 'management' ? 'Direction' : '',
    globalAccessInfo: role === 'management' ? 'Accès global à tous les modules' : '',
  };
}

function normalizeRole(role) {
  if (role === 'responsable' || role === 'admin') return 'management';
  return role;
}

function buildSessionUser(found) {
  const role = normalizeRole(found.role);
  const profile = { ...defaultProfile(role, found.name, found.email), ...(found.profile || {}) };
  profile.email = found.email;
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || found.name;
  return {
    id: found.id,
    email: found.email,
    name: displayName,
    role,
    profile,
  };
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    let migrated = false;
    const normalized = users.map((u) => {
      if (u.role === 'responsable' || u.role === 'admin') {
        migrated = true;
        return { ...u, role: 'management' };
      }
      return u;
    });
    if (migrated) saveUsers(normalized);
    return normalized;
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session?.userId) {
      const users = loadUsers();
      const found = users.find((u) => u.id === session.userId);
      if (found) {
        setUser(buildSessionUser(found));
      } else {
        saveSession(null);
      }
    }
    setLoading(false);
  }, []);

  const register = useCallback(({ email, password, name, role }) => {
    const users = loadUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }
    if (!name?.trim()) {
      return { ok: false, error: 'Veuillez saisir votre nom.' };
    }
    if (!role) {
      return { ok: false, error: 'Veuillez sélectionner un rôle.' };
    }
    const normalizedRole = normalizeRole(role);
    const profile = defaultProfile(normalizedRole, name.trim(), normalized);
    const newUser = {
      id: `u-${Date.now()}`,
      email: normalized,
      passwordHash: hashPassword(password),
      name: name.trim(),
      role: normalizedRole,
      profile,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    users.push(newUser);
    saveUsers(users);
    const sessionUser = buildSessionUser(newUser);
    setUser(sessionUser);
    saveSession({ userId: newUser.id, remember: true });
    return { ok: true, user: sessionUser };
  }, []);

  const login = useCallback(({ email, password, remember }) => {
    const users = loadUsers();
    const normalized = email.trim().toLowerCase();
    const found = users.find((u) => u.email === normalized);
    if (!found || found.passwordHash !== hashPassword(password)) {
      return { ok: false, error: 'Email ou mot de passe incorrect.' };
    }
    found.lastLogin = new Date().toISOString();
    if (!found.profile) {
      found.profile = defaultProfile(normalizeRole(found.role), found.name, found.email);
    }
    saveUsers(users);
    const sessionUser = buildSessionUser(found);
    setUser(sessionUser);
    saveSession({ userId: found.id, remember: !!remember });
    return { ok: true, user: sessionUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  const updateProfile = useCallback((profileData) => {
    if (!user?.id) return { ok: false, error: 'Utilisateur non connecté.' };
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { ok: false, error: 'Utilisateur introuvable.' };

    if (!profileData.firstName?.trim()) {
      return { ok: false, error: 'Le prénom est obligatoire.' };
    }
    if (!profileData.lastName?.trim()) {
      return { ok: false, error: 'Le nom est obligatoire.' };
    }

    const updatedProfile = { ...users[idx].profile, ...profileData };
    const displayName = [updatedProfile.firstName, updatedProfile.lastName].filter(Boolean).join(' ');
    users[idx] = {
      ...users[idx],
      name: displayName,
      profile: updatedProfile,
    };
    saveUsers(users);
    const sessionUser = buildSessionUser(users[idx]);
    setUser(sessionUser);
    return { ok: true, user: sessionUser };
  }, [user?.id]);

  const changePassword = useCallback(({ currentPassword, newPassword, confirmPassword }) => {
    if (!user?.id) return { ok: false, error: 'Utilisateur non connecté.' };
    if (!currentPassword) return { ok: false, error: 'Veuillez saisir votre mot de passe actuel.' };
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, error: 'Les mots de passe ne correspondent pas.' };
    }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { ok: false, error: 'Utilisateur introuvable.' };
    if (users[idx].passwordHash !== hashPassword(currentPassword)) {
      return { ok: false, error: 'Mot de passe actuel incorrect.' };
    }

    users[idx].passwordHash = hashPassword(newPassword);
    saveUsers(users);
    return { ok: true };
  }, [user?.id]);

  const getAllUsers = useCallback(() => {
    return loadUsers().map(({ passwordHash, profile, ...u }) => ({
      ...u,
      profile: profile || defaultProfile(normalizeRole(u.role), u.name, u.email),
      status: 'Actif',
      roleLabel: normalizeRole(u.role),
    }));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, register, login, logout, getAllUsers,
      updateProfile, changePassword, isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
