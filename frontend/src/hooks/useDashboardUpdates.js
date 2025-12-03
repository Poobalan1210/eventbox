/**
 * Custom hook for managing real-time dashboard updates via WebSocket
 */
import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
/**
 * Hook to manage real-time dashboard updates
 * Subscribes to WebSocket events and calls appropriate handlers
 */
export function useDashboardUpdates(organizerId, handlers) {
    const { emit, on, connectionStatus } = useWebSocket();
    // Join organizer room when connected
    useEffect(() => {
        if (connectionStatus === 'connected' && organizerId) {
            emit('join-organizer', { organizerId });
            console.log(`Joined organizer room: ${organizerId}`);
        }
    }, [connectionStatus, organizerId, emit]);
    // Handle quiz status changes
    const handleStatusChange = useCallback((payload) => {
        console.log('Quiz status changed:', payload);
        if (handlers.onQuizStatusChanged) {
            handlers.onQuizStatusChanged(payload.eventId, payload.status, payload.timestamp);
        }
    }, [handlers]);
    // Handle quiz metadata updates
    const handleMetadataUpdate = useCallback((payload) => {
        console.log('Quiz metadata updated:', payload);
        if (handlers.onQuizMetadataUpdated) {
            const updates = {
                lastModified: payload.lastModified,
            };
            if (payload.name)
                updates.name = payload.name;
            if (payload.topic)
                updates.topic = payload.topic;
            if (payload.description)
                updates.description = payload.description;
            if (payload.visibility)
                updates.visibility = payload.visibility;
            handlers.onQuizMetadataUpdated(payload.eventId, updates);
        }
    }, [handlers]);
    // Handle participant count updates
    const handleParticipantsUpdate = useCallback((payload) => {
        console.log('Participants updated:', payload);
        if (handlers.onParticipantCountUpdated && payload.participants.length > 0) {
            const eventId = payload.participants[0].eventId;
            const count = payload.participants.length;
            handlers.onParticipantCountUpdated(eventId, count);
        }
    }, [handlers]);
    // Subscribe to WebSocket events
    useEffect(() => {
        const cleanupStatus = on('quiz-status-changed', handleStatusChange);
        const cleanupMetadata = on('quiz-metadata-updated', handleMetadataUpdate);
        const cleanupParticipants = on('participants-updated', handleParticipantsUpdate);
        return () => {
            cleanupStatus();
            cleanupMetadata();
            cleanupParticipants();
        };
    }, [on, handleStatusChange, handleMetadataUpdate, handleParticipantsUpdate]);
    return {
        connectionStatus,
    };
}
