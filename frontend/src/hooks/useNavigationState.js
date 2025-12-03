import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
/**
 * Hook to preserve navigation state when navigating between dashboard and quiz pages
 * Stores scroll position, filter state, and search query in sessionStorage
 */
export function useNavigationState() {
    const location = useLocation();
    // Save navigation state when leaving a page
    useEffect(() => {
        const handleBeforeUnload = () => {
            const state = {
                pathname: location.pathname,
                search: location.search,
                scrollY: window.scrollY,
                timestamp: Date.now(),
            };
            sessionStorage.setItem('navigationState', JSON.stringify(state));
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [location]);
    return {
        saveState: (key, value) => {
            try {
                sessionStorage.setItem(`nav_${key}`, JSON.stringify(value));
            }
            catch (error) {
                console.error('Failed to save navigation state:', error);
            }
        },
        loadState: (key, defaultValue) => {
            try {
                const item = sessionStorage.getItem(`nav_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            }
            catch (error) {
                console.error('Failed to load navigation state:', error);
                return defaultValue;
            }
        },
        clearState: (key) => {
            try {
                sessionStorage.removeItem(`nav_${key}`);
            }
            catch (error) {
                console.error('Failed to clear navigation state:', error);
            }
        },
    };
}
/**
 * Hook to restore scroll position after navigation
 */
export function useScrollRestoration(key) {
    const location = useLocation();
    useEffect(() => {
        // Restore scroll position
        const savedPosition = sessionStorage.getItem(`scroll_${key}`);
        if (savedPosition) {
            const position = parseInt(savedPosition, 10);
            window.scrollTo(0, position);
        }
        // Save scroll position on unmount
        return () => {
            sessionStorage.setItem(`scroll_${key}`, window.scrollY.toString());
        };
    }, [key, location.pathname]);
}
