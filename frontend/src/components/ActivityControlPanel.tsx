import { useState, useEffect } from 'react';
import { Activity, ActivityType, ActivityStatus } from '../types/models';

interface ActivityControlPanelProps {
  eventId: string;
  organizerId: string;
  onActivityChange?: () => void;
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

export default function ActivityControlPanel({
  eventId,
  organizerId,
  onActivityChange,
}: ActivityControlPanelProps) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
      const sortedActivities = data.activities.sort((a, b) => a.order - b.order);
      setActivities(sortedActivities);

      // Find active activity
      const active = sortedActivities.find((a) => a.status === 'active');
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

  // Activate activity
  const handleActivate = async (activityId: string) => {
    setActionInProgress(activityId);
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
        if (onActivityChange) {
          onActivityChange();
        }
      }
    } catch (err) {
      console.error('Failed to activate activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to activate activity');
    } finally {
      setActionInProgress(null);
    }
  };

  // Deactivate activity
  const handleDeactivate = async (activityId: string) => {
    setActionInProgress(activityId);
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
        if (onActivityChange) {
          onActivityChange();
        }
      }
    } catch (err) {
      console.error('Failed to deactivate activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to deactivate activity');
    } finally {
      setActionInProgress(null);
    }
  };

  // Get activity icon
  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'quiz':
        return '❓';
      case 'poll':
        return '📊';
      case 'raffle':
        return '🎁';
    }
  };

  // Get status badge
  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            📝 Draft
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            ✓ Ready
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-600 animate-pulse"></span>
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
            ✓ Completed
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white ml-3">Loading control panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <p className="text-white text-center">
          No activities to control. Add activities to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Activity Control Panel</h3>
            <p className="text-sm text-white/70 mt-0.5">
              Manage which activity is currently active for participants
            </p>
          </div>
          <a
            href={`/events/${eventId}/control`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🎮</span>
            <span>Advanced Controls</span>
          </a>
        </div>
      </div>

      {/* Active Activity Banner */}
      {activeActivityId && (
        <div className="bg-green-500/20 border-b border-green-500/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-100 font-medium text-sm">
                Currently Active:
              </span>
              <span className="text-white font-semibold">
                {activities.find((a) => a.activityId === activeActivityId)?.name}
              </span>
            </div>
            <button
              onClick={() => handleDeactivate(activeActivityId)}
              disabled={actionInProgress === activeActivityId}
              className="px-3 py-1 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionInProgress === activeActivityId ? '⏳ Deactivating...' : '⏸️ Deactivate'}
            </button>
          </div>
        </div>
      )}

      {/* No Active Activity Banner */}
      {!activeActivityId && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-100 font-medium text-sm">⏸️ No active activity</span>
            <span className="text-white/80 text-sm">
              - Participants are in waiting state
            </span>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="divide-y divide-white/10">
        {activities.map((activity) => {
          const isActive = activity.activityId === activeActivityId;
          const canActivate = activity.status === 'ready' && !isActive;
          const isProcessing = actionInProgress === activity.activityId;

          return (
            <div
              key={activity.activityId}
              className={`px-4 py-3 transition-colors ${
                isActive ? 'bg-green-500/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Activity Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium truncate">
                        {activity.name}
                      </h4>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-sm text-white/60 capitalize">
                      {activity.type} • Order: {activity.order}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <button
                      onClick={() => handleDeactivate(activity.activityId)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      {isProcessing ? '⏳ Deactivating...' : '⏸️ Deactivate'}
                    </button>
                  )}
                  {canActivate && (
                    <button
                      onClick={() => handleActivate(activity.activityId)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      {isProcessing ? '⏳ Activating...' : '▶️ Activate'}
                    </button>
                  )}
                  {!canActivate && !isActive && (
                    <span className="px-4 py-2 text-sm text-white/50">
                      {activity.status === 'draft' && 'Not ready'}
                      {activity.status === 'completed' && 'Completed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="bg-white/5 px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Total Activities: {activities.length}</span>
          <span>
            Ready: {activities.filter((a) => a.status === 'ready').length} | 
            Active: {activities.filter((a) => a.status === 'active').length} | 
            Completed: {activities.filter((a) => a.status === 'completed').length}
          </span>
        </div>
      </div>
    </div>
  );
}
