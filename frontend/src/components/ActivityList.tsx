import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ActivityType } from '../types/models';
import ActivityCard from './ActivityCard';
import AddActivityDialog from './AddActivityDialog';

// API types
interface CreateActivityRequest {
  name: string;
  type: ActivityType;
  scoringEnabled?: boolean;
  speedBonusEnabled?: boolean;
  streakTrackingEnabled?: boolean;
  question?: string;
  options?: string[];
  allowMultipleVotes?: boolean;
  showResultsLive?: boolean;
  prizeDescription?: string;
  entryMethod?: 'automatic' | 'manual';
  winnerCount?: number;
}

interface CreateActivityResponse {
  activityId: string;
  activity: Activity;
}

interface GetActivitiesResponse {
  activities: Activity[];
}

interface ActivateActivityResponse {
  success: boolean;
}

interface DeactivateActivityResponse {
  success: boolean;
}

interface DeleteActivityResponse {
  success: boolean;
}

interface ActivityListProps {
  eventId: string;
  organizerId: string;
  onActivityEdit?: (activityId: string) => void;
}

export default function ActivityList({ eventId, organizerId, onActivityEdit }: ActivityListProps) {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  // Fetch activities
  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}/activities`, {
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load activities');
      }

      const data: GetActivitiesResponse = await response.json();
      setActivities(data.activities.sort((a: Activity, b: Activity) => a.order - b.order));

      // Find active activity
      const active = data.activities.find((a: Activity) => a.status === 'active');
      setActiveActivityId(active?.activityId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventId]);

  // Add new activity
  const handleAddActivity = async (type: ActivityType, name: string) => {
    try {
      const request: CreateActivityRequest = {
        name,
        type,
        // Set defaults based on type
        ...(type === 'quiz' && {
          scoringEnabled: true,
          speedBonusEnabled: true,
          streakTrackingEnabled: true,
        }),
        ...(type === 'poll' && {
          allowMultipleVotes: false,
          showResultsLive: true,
        }),
        ...(type === 'raffle' && {
          entryMethod: 'automatic' as const,
          winnerCount: 1,
        }),
      };

      const response = await fetch(`${apiBaseUrl}/events/${eventId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-id': organizerId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create activity');
      }

      const data: CreateActivityResponse = await response.json();
      
      // Refresh activities list
      await fetchActivities();

      // Navigate to edit if handler provided
      if (onActivityEdit) {
        onActivityEdit(data.activityId);
      }
    } catch (err) {
      console.error('Failed to create activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to create activity');
    }
  };

  // Activate activity
  const handleActivate = async (activityId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}/activate`, {
        method: 'POST',
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to activate activity');
      }

      const data: ActivateActivityResponse = await response.json();
      if (data.success) {
        await fetchActivities();
      }
    } catch (err) {
      console.error('Failed to activate activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to activate activity');
    }
  };

  // Deactivate activity
  const handleDeactivate = async (activityId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}/deactivate`, {
        method: 'POST',
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate activity');
      }

      const data: DeactivateActivityResponse = await response.json();
      if (data.success) {
        await fetchActivities();
      }
    } catch (err) {
      console.error('Failed to deactivate activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to deactivate activity');
    }
  };

  // Delete activity
  const handleDelete = async (activityId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete activity');
      }

      const data: DeleteActivityResponse = await response.json();
      if (data.success) {
        await fetchActivities();
      }
    } catch (err) {
      console.error('Failed to delete activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  // View activity results
  const handleViewResults = (activityId: string) => {
    navigate(`/activities/${activityId}/results`);
  };

  // Edit activity
  const handleEdit = (activityId: string) => {
    if (onActivityEdit) {
      onActivityEdit(activityId);
    }
  };

  // Filter activities
  const filteredActivities =
    filter === 'all' ? activities : activities.filter((a) => a.type === filter);

  const getFilterCounts = () => ({
    all: activities.length,
    quiz: activities.filter((a) => a.type === 'quiz').length,
    poll: activities.filter((a) => a.type === 'poll').length,
    raffle: activities.filter((a) => a.type === 'raffle').length,
  });

  const counts = getFilterCounts();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-white mt-4">Loading activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Activities</h2>
            <p className="text-white/80 mt-1">
              Manage quizzes, polls, and raffles for your event
            </p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="px-6 py-2 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors shadow-lg"
          >
            ➕ Add Activity
          </button>
        </div>
      </div>

      {/* Active Activity Banner */}
      {activeActivityId && (
        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></span>
            <p className="text-green-800 font-semibold">
              {activities.find((a) => a.activityId === activeActivityId)?.name} is currently
              active
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-kahoot-purple-dark shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter('quiz')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'quiz'
                ? 'bg-white text-kahoot-purple-dark shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            ❓ Quizzes ({counts.quiz})
          </button>
          <button
            onClick={() => setFilter('poll')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'poll'
                ? 'bg-white text-kahoot-purple-dark shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📊 Polls ({counts.poll})
          </button>
          <button
            onClick={() => setFilter('raffle')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'raffle'
                ? 'bg-white text-kahoot-purple-dark shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🎁 Raffles ({counts.raffle})
          </button>
        </div>
      </div>

      {/* Activity Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center">
          <p className="text-white text-lg mb-4">
            {filter === 'all' ? 'No activities yet' : `No ${filter} activities`}
          </p>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="px-6 py-3 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors"
          >
            Add Your First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.activityId}
              activity={activity}
              isActive={activity.activityId === activeActivityId}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewResults={handleViewResults}
            />
          ))}
        </div>
      )}

      {/* Add Activity Dialog */}
      <AddActivityDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddActivity}
      />
    </div>
  );
}
