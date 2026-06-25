// src/context/NotificationContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Announcement banner states
  const [banner, setBanner] = useState(null);
  const [bannerDismissedId, setBannerDismissedId] = useState(
    localStorage.getItem('staypik_banner_dismissed_id') || ''
  );

  const fetchBanner = useCallback(async () => {
    try {
      const res = await api.get('/rentals/banner/');
      setBanner(res.data);
    } catch (e) {
      console.error("Failed to fetch active banner:", e);
    }
  }, []);

  const dismissBanner = useCallback((id) => {
    localStorage.setItem('staypik_banner_dismissed_id', String(id));
    setBannerDismissedId(String(id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/rentals/notifications/');
      const notifs = res.data;
      
      const seenIds = JSON.parse(localStorage.getItem('staypik_seen_notifs') || '[]');
      const clearedIds = JSON.parse(localStorage.getItem('staypik_cleared_notifs') || '[]');
      
      const visibleNotifs = notifs.filter(n => !clearedIds.includes(n.id));
      const unseen = visibleNotifs.filter(n => !seenIds.includes(n.id));
      
      setNotifications(visibleNotifs);
      setUnreadCount(unseen.length);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchBanner();
    
    // Poll for notifications and banner updates every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchBanner();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications, fetchBanner]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const allIds = prev.map(n => n.id);
      localStorage.setItem('staypik_seen_notifs', JSON.stringify(allIds));
      return prev;
    });
    setUnreadCount(0);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      const currentCleared = JSON.parse(localStorage.getItem('staypik_cleared_notifs') || '[]');
      const newCleared = [...new Set([...currentCleared, ...prev.map(n => n.id)])];
      localStorage.setItem('staypik_cleared_notifs', JSON.stringify(newCleared));
      return [];
    });
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      fetchNotifications, 
      markAllRead, 
      clearAllNotifications,
      banner,
      bannerDismissedId,
      fetchBanner,
      dismissBanner
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
