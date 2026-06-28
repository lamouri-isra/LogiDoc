import React, { useMemo } from 'react';
import DataTable from '../ui/DataTable';
import { StatutPill } from '../../platform/logidoc-core';
import { REGISTERABLE_ROLES } from '../../data/config';

export default function AdminUsers({ getAllUsers }) {
  const users = useMemo(() => {
    const list = getAllUsers?.() || [];
    return list.map((u, i) => ({
      id: u.id || i,
      name: u.name,
      email: u.email,
      role: REGISTERABLE_ROLES.find((r) => r.id === u.role)?.nom || u.role,
      status: u.status || 'Actif',
      lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : '—',
    }));
  }, [getAllUsers]);

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle', filter: true },
    { key: 'status', label: 'Statut', render: (r) => <StatutPill s={r.status === 'Actif' ? 'Validé' : 'En attente'} /> },
    { key: 'lastLogin', label: 'Dernière connexion' },
  ];

  return (
    <div className="card fade" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff' }}>
        <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}>👥 Gestion des utilisateurs</h3>
        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Comptes enregistrés sur la plateforme</p>
      </div>
      <DataTable columns={columns} data={users} pageSize={8} emptyMessage="Aucun utilisateur enregistré." />
    </div>
  );
}
