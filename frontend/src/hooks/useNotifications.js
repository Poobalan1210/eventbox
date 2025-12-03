/**
 * Custom hook for managing notifications
 */
import { useState, useCallback } from 'react';
/**
 * Hook to manage notification state and display
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const addNotification = useCallback((type, message) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const notification = { id, type, message };
        setNotifications((prev) => [...prev, notification]);
        return id;
    }, []);
    const removeNotification = useCallback((id) => {
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
