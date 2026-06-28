import React from 'react';
import DataTable from '../ui/DataTable';
import { SYSTEM_LOGS } from '../../data/config';

const LEVEL_STYLE = {
  info: { bg: '#e4eefb', color: '#1c5ca8' },
  success: { bg: '#DFF7ED', color: '#008A5C' },
  warning: { bg: '#fdf2dc', color: '#b3760a' },
  error: { bg: '#fbe6e3', color: '#c0392b' },
};

export default function AdminLogs() {
  const columns = [
    { key: 'time', label: 'Horodatage' },
    { key: 'level', label: 'Niveau', filter: true, render: (r) => {
      const s = LEVEL_STYLE[r.level] || LEVEL_STYLE.info;
      return <span className="pill" style={{ background: s.bg, color: s.color }}>{r.level}</span>;
    }},
    { key: 'module', label: 'Module', filter: true },
    { key: 'message', label: 'Message' },
  ];

  return (
    <div className="card fade" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,#0B1F3A,#102A4C)', color: '#fff' }}>
        <h3 style={{ fontFamily: 'Archivo,sans-serif', fontSize: 16, margin: 0 }}>≡ System Logs</h3>
        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Journal d'activité système</p>
      </div>
      <DataTable columns={columns} data={SYSTEM_LOGS} pageSize={10} />
    </div>
  );
}
