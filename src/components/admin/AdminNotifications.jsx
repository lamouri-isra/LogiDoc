import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import DataTable from '../ui/DataTable';

const TYPE_STYLE = {
  success: { bg: '#DFF7ED', color: '#008A5C' },
  warning: { bg: '#fdf2dc', color: '#b3760a' },
  error: { bg: '#fbe6e3', color: '#c0392b' },
  info: { bg: '#e4eefb', color: '#1c5ca8' },
};

export default function AdminNotifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const columns = [
    { key: 'type', label: 'Type', filter: true, render: (r) => {
      const s = TYPE_STYLE[r.type] || TYPE_STYLE.info;
      return <span className="pill" style={{ background: s.bg, color: s.color }}>{r.type}</span>;
    }},
    { key: 'title', label: 'Titre' },
    { key: 'message', label: 'Message' },
    { key: 'time', label: 'Date', render: (r) => new Date(r.time).toLocaleString('fr-FR') },
    { key: 'read', label: 'Lu', render: (r) => r.read ? '✓' : '—' },
  ];

  return (
    <div className="card fade" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}> Historique des notifications</h3>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Toutes les notifications système</p>
        </div>
        <button className="btn btn-g" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }} onClick={markAllAsRead}>
          Tout marquer lu
        </button>
      </div>
      <DataTable
        columns={columns}
        data={notifications}
        pageSize={15}
        emptyMessage="Aucune notification."
      />
    </div>
  );
}
