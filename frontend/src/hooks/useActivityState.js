/**
 * Hook to track and manage active activity state
 *
 * This hook listens to activity lifecycle events and maintains
 * the current active activity state for an event.
 *
 * Requirements: 4.1, 6.5
 */
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
/**
 * Hook to track the active activity state for an event
 *
 * @param options - Configuration options
 * @returns Current activity state and control functions
 */
export const useActivityState = (options = {}) => {
    const { eventId, onActivityActivated, onActivityDeactivated, onActivityUpdated, onWaitingStateChanged } = options;
    const { on } = useWebSocket();
    const [state, setState] = useState({
        activeActivity: null,
        isWaiting: true,
        waitingMessage: 'Waiting for organizer to start an activity',
        lastUpdate: Date.now(),
    });
    // Handle activity activation
    useEffect(() => {
        const cleanup = on('activity-activated', (payload) => {
            // Only update if this is for our event (or no event filter specified)
            if (!eventId || payload.eventId === eventId) {
                setState({
                    activeActivity: payload.activity,
                    isWaiting: false,
                    waitingMessage: '',
                    lastUpdate: Date.now(),
                });
                onActivityActivated?.(payload.activity);
                onWaitingStateChanged?.(false, '');
            }
        });
        return cleanup;
    }, [on, eventId, onActivityActivated, onWaitingStateChanged]);
    // Handle activity deactivation
    useEffect(() => {
        const cleanup = on('activity-deactivated', (payload) => {
            // Only update if this is for our event (or no event filter specified)
            if (!eventId || payload.eventId === eventId) {
                const message = 'Waiting for organizer to start an activity';
                setState({
                    activeActivity: null,
                    isWaiting: true,
                    waitingMessage: message,
                    lastUpdate: Date.now(),
                });
                onActivityDeactivated?.(payload.activityId);
                onWaitingStateChanged?.(true, message);
            }
        });
        return cleanup;
    }, [on, eventId, onActivityDeactivated, onWaitingStateChanged]);
    // Handle activity updates
    useEffect(() => {
        const cleanup = on('activity-updated', (payload) => {
            // Only update if this is for our event (or no event filter specified)
            if (!eventId || payload.eventId === eventId) {
                setState((prev) => {
                    // Only update if this is the currently active activity
                    if (prev.activeActivity?.activityId === payload.activity.activityId) {
                        return {
                            ...prev,
                            activeActivity: payload.activity,
                            lastUpdate: Date.now(),
                        };
                    }
                    return prev;
                });
                onActivityUpdated?.(payload.activity);
            }
        });
        return cleanup;
    }, [on, eventId, onActivityUpdated]);
    // Handle waiting state
    useEffect(() => {
        const cleanup = on('waiting-for-activity', (payload) => {
            // Only update if this is for our event (or no event filter specified)
            if (!eventId || payload.eventId === eventId) {
                setState({
                    activeActivity: null,
                    isWaiting: true,
                    waitingMessage: payload.message,
                    lastUpdate: Date.now(),
                });
                onWaitingStateChanged?.(true, payload.message);
            }
        });
        return cleanup;
    }, [on, eventId, onWaitingStateChanged]);
    // Helper to check if a specific activity is active
    const isActivityActive = useCallback((activityId) => {
        return state.activeActivity?.activityId === activityId;
    }, [state.activeActivity]);
    // Helper to get activity type
    const getActiveActivityType = useCallback(() => {
        return state.activeActivity?.type ?? null;
    }, [state.activeActivity]);
    return {
        ...state,
        isActivityActive,
        getActiveActivityType,
    };
};
