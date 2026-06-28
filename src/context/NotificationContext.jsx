import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NOTIFICATION_ROUTES } from '../data/config';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'logidoc_notifications';

export function NotificationProvider({ children, onNavigate, userRole }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const resolveRoute = useCallback((payload) => {
    if (payload.route) {
      let route = payload.route;
      if (userRole === 'approvisionnement' && route === 'documents') route = 'po';
      if (userRole === 'transit' && route === 'dashboard') route = 'transit';
      if (userRole === 'tresorerie' && route === 'dashboard') route = 'treasury';
      return route;
    }
    if (payload.category && NOTIFICATION_ROUTES[payload.category]) {
      let route = NOTIFICATION_ROUTES[payload.category];
      if (userRole === 'approvisionnement' && route === 'documents') route = 'po';
      return route;
    }
    const text = `${payload.title || ''} ${payload.message || ''}`.toLowerCase();
    if (text.includes('document') || text.includes('dossier transmis')) {
      return userRole === 'approvisionnement' ? 'po' : 'documents';
    }
    if (text.includes('transit') || text.includes('déclar') || text.includes('dédouan')) return 'transit';
    if (text.includes('chèque') || text.includes('domicil') || text.includes('trésor')) return 'treasury';
    if (text.includes('po') || text.includes('purchase') || text.includes('commande')) return 'po';
    if (userRole === 'management') return 'dashboard';
    return null;
  }, [userRole]);

  const addNotification = useCallback((payload) => {
    const route = resolveRoute(payload);
    const item = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: payload.type || 'info',
      title: payload.title || 'Notification',
      message: payload.message || '',
      route: route || payload.route || null,
      read: false,
      time: new Date().toISOString(),
    };
    setNotifications((prev) => [item, ...prev]);
    const toastId = `t-${item.id}`;
    setToasts((prev) => [...prev, { ...item, toastId }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 4500);
    return item;
  }, [resolveRoute]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    if (notification.route && onNavigate) {
      onNavigate(notification.route);
    }
  }, [markAsRead, onNavigate]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, toasts, unreadCount, addNotification, markAsRead, markAllAsRead, handleNotificationClick,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
