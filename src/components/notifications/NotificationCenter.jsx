import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_COLORS = {
  success: { bg: '#DFF7ED', color: '#008A5C', icon: '✓' },
  warning: { bg: '#fdf2dc', color: '#b3760a', icon: '!' },
  error: { bg: '#fbe6e3', color: '#c0392b', icon: '✕' },
  info: { bg: '#e4eefb', color: '#1c5ca8', icon: 'i' },
};

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return d.toLocaleDateString('fr-FR');
}

export default function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, toasts, handleNotificationClick } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onItemClick = (n) => {
    handleNotificationClick(n);
    setOpen(false);
  };

  return (
    <>
      <style>{`
        .nc-bell { position: relative; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 10px; transition: 0.2s; font-size: 20px; }
        .nc-bell:hover { background: #F5F8FA; }
        .nc-badge { position: absolute; top: 2px; right: 2px; min-width: 18px; height: 18px; border-radius: 999px; background: #c0392b; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        .nc-panel { position: absolute; right: 0; top: calc(100% + 8px); width: 380px; max-height: 480px; background: #fff; border: 1px solid #DCE6E4; border-radius: 14px; box-shadow: 0 15px 50px rgba(0,0,0,0.15); z-index: 300; animation: slideDown 0.25s; overflow: hidden; display: flex; flex-direction: column; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .nc-header { padding: 14px 16px; border-bottom: 1px solid #DCE6E4; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg,#0B1F3A,#102A4C); color: #fff; }
        .nc-list { overflow-y: auto; flex: 1; }
        .nc-item { padding: 12px 16px; border-bottom: 1px solid #F5F8FA; cursor: pointer; transition: 0.15s; display: flex; gap: 10px; }
        .nc-item:hover { background: #F5F8FA; }
        .nc-item.unread { background: rgba(0,168,112,0.04); }
        .nc-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .nc-toasts { position: fixed; top: 80px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
        .nc-toast { padding: 14px 18px; border-radius: 12px; background: #fff; border: 1px solid #DCE6E4; box-shadow: 0 8px 30px rgba(0,0,0,0.12); min-width: 300px; animation: toastIn 0.35s; display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }
        @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:none} }
        @media (max-width: 480px) { .nc-panel { width: calc(100vw - 32px); right: -60px; } }
      `}</style>

      <div style={{ position: 'relative' }} ref={ref}>
        <button className="nc-bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
          🔔
          {unreadCount > 0 && <span className="nc-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {open && (
          <div className="nc-panel">
            <div className="nc-header">
              <strong style={{ fontSize: 14 }}>Notifications</strong>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#DFF7ED', fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="nc-list">
              {notifications.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#667085', fontSize: 13 }}>Aucune notification</div>
              ) : notifications.map((n) => {
                const tc = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                return (
                  <div
                    key={n.id}
                    className={`nc-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => onItemClick(n)}
                  >
                    <div className="nc-icon" style={{ background: tc.bg, color: tc.color }}>{tc.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1F2C' }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#667085', marginTop: 4 }}>{formatTime(n.time)}</div>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00A870', flexShrink: 0, marginTop: 6 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="nc-toasts no-print">
        {toasts.map((t) => {
          const tc = TYPE_COLORS[t.type] || TYPE_COLORS.info;
          return (
            <div key={t.toastId} className="nc-toast" onClick={() => handleNotificationClick(t)}>
              <div className="nc-icon" style={{ background: tc.bg, color: tc.color }}>{tc.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: '#667085' }}>{t.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
