/**
 * Custom hook for managing notifications
 */
import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';

export interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
}

/**
 * Hook to manage notification state and display
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: NotificationData = { id, type, message };
    
    setNotifications((prev) => [...prev, notification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}
