import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ActivityList from '../components/ActivityList';
import QuizActivityConfig from '../components/QuizActivityConfig';
import PollActivityConfig from '../components/PollActivityConfig';
import RaffleActivityConfig from '../components/RaffleActivityConfig';
import ConnectionStatus from '../components/ConnectionStatus';
import { Activity, QuizActivity, PollActivity, RaffleActivity } from '../types/models';

interface EventDetails {
  id: string;
  name: string;
  status: string;
  gamePin?: string;
}

export default function EventActivities() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load event');
        }

        const data: EventDetails = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleActivityEdit = async (activityId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}`, {
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load activity');
      }

      const data = await response.json();
      setEditingActivity(data.activity);
    } catch (err) {
      console.error('Failed to load activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to load activity');
    }
  };

  const handleActivityUpdate = async () => {
    // If we're editing an activity, refresh its data instead of going back to the list
    if (editingActivity) {
      try {
        const response = await fetch(`${apiBaseUrl}/activities/${editingActivity.activityId}`, {
          headers: {
            'x-organizer-id': organizerId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEditingActivity(data.activity);
        }
      } catch (err) {
        console.error('Failed to refresh activity:', err);
      }
    }
    // If not editing, this will trigger a refresh of the activity list
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
  };

  if (!eventId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-6">
          <p className="text-white">Invalid event ID</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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

  // If editing an activity, show the appropriate config component
  if (editingActivity) {
    if (editingActivity.type === 'quiz') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <ConnectionStatus />
          <QuizActivityConfig
            activity={editingActivity as QuizActivity}
            onUpdate={handleActivityUpdate}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
    
    if (editingActivity.type === 'poll') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <ConnectionStatus />
          <PollActivityConfig
            activity={editingActivity as PollActivity}
            onUpdate={handleActivityUpdate}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
    
    if (editingActivity.type === 'raffle') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <ConnectionStatus />
          <RaffleActivityConfig
            activity={editingActivity as RaffleActivity}
            onUpdate={handleActivityUpdate}
            onCancel={handleCancelEdit}
          />
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
      {/* Connection Status */}
      <ConnectionStatus />

      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white hover:text-white/80 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.name}</h1>
            {event.gamePin && (
              <p className="text-white/80 mt-2">
                Join Code: <span className="font-mono font-bold">{event.gamePin}</span>
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/events/${eventId}/control`)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>🎮</span>
              <span>Live Control Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <ActivityList
        eventId={eventId}
        organizerId={organizerId}
        onActivityEdit={handleActivityEdit}
      />
    </div>
  );
}
