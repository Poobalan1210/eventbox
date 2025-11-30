/**
 * Quiz Mode Manager - Orchestrates mode transitions and renders appropriate mode component
 * Implements state machine: draft → setup → live → completed
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupMode from './SetupMode';
import LiveMode from './LiveMode';
import CompletedQuizResults from './CompletedQuizResults';
import type { EventStatus } from '../types/models';

interface QuizModeManagerProps {
  eventId: string;
}

interface EventDetails {
  id: string;
  name: string;
  status: EventStatus;
  gamePin: string;
}

export default function QuizModeManager({ eventId }: QuizModeManagerProps) {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`);

      if (response.status === 404) {
        setError('Event not found');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load event details');
      }

      const data: EventDetails = await response.json();
      setEvent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // Handle status changes from mode components
  const handleStatusChange = (newStatus: EventStatus) => {
    if (event) {
      setEvent({ ...event, status: newStatus });
    }
  };

  // Handle quiz start (transition to live mode)
  const handleStartQuiz = () => {
    // Status is already updated by the mode transition hook
    // Just refresh to ensure we have latest data
    fetchEventDetails();
  };

  // Handle quiz end (transition to completed)
  const handleEndQuiz = () => {
    // Status is already updated by the mode transition hook
    // Optionally navigate to results or dashboard
    fetchEventDetails();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="text-white mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white mb-4">{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-white text-kahoot-purple rounded-lg hover:bg-white/90 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate mode component based on status
  const renderModeComponent = () => {
    switch (event.status) {
      case 'draft':
      case 'setup':
        return (
          <SetupMode
            eventId={eventId}
            eventName={event.name}
            currentStatus={event.status}
            onStartQuiz={handleStartQuiz}
            onStatusChange={handleStatusChange}
          />
        );

      case 'live':
      case 'active': // Legacy support
        return (
          <LiveMode
            eventId={eventId}
            eventName={event.name}
            currentStatus={event.status}
            gamePin={event.gamePin}
            onEndQuiz={handleEndQuiz}
            onStatusChange={handleStatusChange}
          />
        );

      case 'completed':
        return (
          <CompletedQuizResults
            eventId={eventId}
            eventName={event.name}
          />
        );

      default:
        return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-answer-yellow/20 border-2 border-answer-yellow rounded-lg p-6">
              <p className="text-white">Unknown quiz status: {event.status}</p>
            </div>
          </div>
        );
    }
  };

  return <>{renderModeComponent()}</>;
}
