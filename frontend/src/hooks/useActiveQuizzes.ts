import { useState, useEffect, useCallback } from 'react';
import { useWebSocketEvent } from './useWebSocketEvent';

interface ActiveQuiz {
  eventId: string;
  name: string;
  participantCount: number;
  hasUnreadNotifications: boolean;
}

/**
 * Hook to track active (live) quizzes and their notification status
 * Used to display notification badges in the navigation
 */
export function useActiveQuizzes(organizerId: string) {
  const [activeQuizzes, setActiveQuizzes] = useState<ActiveQuiz[]>([]);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch active quizzes
  const fetchActiveQuizzes = useCallback(async () => {
    if (!organizerId) return;

    try {
      const fullUrl = `${apiBaseUrl}/events/organizer/${organizerId}`;
      console.log('useActiveQuizzes - API Base URL:', apiBaseUrl);
      console.log('useActiveQuizzes - Full URL:', fullUrl);
      const response = await fetch(fullUrl);
      if (!response.ok) return;

      const data = await response.json();
      const quizzes = data.quizzes || [];
      const liveQuizzes = quizzes
        .filter((quiz: any) => quiz.status === 'live')
        .map((quiz: any) => ({
          eventId: quiz.eventId,
          name: quiz.name,
          participantCount: quiz.participantCount || 0,
          hasUnreadNotifications: false, // Will be updated by WebSocket events
        }));

      setActiveQuizzes(liveQuizzes);
    } catch (error) {
      console.error('Failed to fetch active quizzes:', error);
    }
  }, [organizerId, apiBaseUrl]);

  useEffect(() => {
    fetchActiveQuizzes();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchActiveQuizzes, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveQuizzes]);

  // Handle real-time participant updates
  const handleParticipantUpdate = useCallback((payload: any) => {
    const { participants } = payload;
    if (!participants || participants.length === 0) return;

    const eventId = participants[0].eventId;
    setActiveQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.eventId === eventId
          ? {
              ...quiz,
              participantCount: participants.length,
              hasUnreadNotifications: true,
            }
          : quiz
      )
    );
  }, []);

  // Subscribe to WebSocket events
  useWebSocketEvent('participants-updated', handleParticipantUpdate);
  // Note: Quiz status changes are detected through polling
  // WebSocket event for status changes can be added in the future

  // Mark notifications as read for a specific quiz
  const markAsRead = useCallback((eventId: string) => {
    setActiveQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.eventId === eventId
          ? { ...quiz, hasUnreadNotifications: false }
          : quiz
      )
    );
  }, []);

  // Get total unread notification count
  const unreadCount = activeQuizzes.filter((q) => q.hasUnreadNotifications).length;

  return {
    activeQuizzes,
    unreadCount,
    markAsRead,
    refresh: fetchActiveQuizzes,
  };
}
