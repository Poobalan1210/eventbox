import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/Notification';
import EventCard from '../components/EventCard';
import { useNavigationState, useScrollRestoration } from '../hooks/useNavigationState';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';
import { useDashboardUpdates } from '../hooks/useDashboardUpdates';
import { useNotifications } from '../hooks/useNotifications';
import { Event, EventStatus, EventVisibility } from '../types/models';

interface EventListResponse {
  quizzes: Event[];
}

interface EventCardData {
  eventId: string;
  name: string;
  gamePin?: string;
  status: EventStatus;
  visibility?: EventVisibility;
  participantCount?: number;
  activityCount?: number;
  activeActivityName?: string;
  topic?: string;
  description?: string;
  createdAt: number;
  lastModified?: number;
  startedAt?: number;
  completedAt?: number;
}

type FilterType = 'all' | 'draft' | 'setup' | 'live' | 'completed';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  // Navigation state preservation
  const { saveState, loadState } = useNavigationState();
  useScrollRestoration('dashboard');

  // Track active events
  const { markAsRead } = useActiveQuizzes(organizerId);

  // Notification management
  const { notifications, addNotification, removeNotification } = useNotifications();

  const [events, setEvents] = useState<EventCardData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(() => loadState('dashboardFilter', 'all'));
  const [searchQuery, setSearchQuery] = useState(() => loadState('dashboardSearch', ''));

  // Fetch events from API
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/events/organizer/${organizerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data: EventListResponse = await response.json();
      const quizzes = data.quizzes || [];
      
      // Transform events to EventCardData format
      const eventCards: EventCardData[] = await Promise.all(
        quizzes.map(async (event) => {
          // Fetch activities for each event to get activity count
          try {
            const activitiesResponse = await fetch(
              `${apiBaseUrl}/events/${event.eventId}/activities`,
              {
                headers: {
                  'x-organizer-id': organizerId,
                },
              }
            );
            
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json();
              const activities = activitiesData.activities || [];
              const activeActivity = activities.find((a: any) => a.status === 'active');
              
              return {
                eventId: event.eventId,
                name: event.name,
                gamePin: event.gamePin,
                status: event.status,
                visibility: event.visibility,
                participantCount: event.participantCount || 0,
                activityCount: activities.length,
                activeActivityName: activeActivity?.name,
                topic: event.topic,
                description: event.description,
                createdAt: event.createdAt,
                lastModified: event.lastModified,
                startedAt: event.startedAt,
                completedAt: event.completedAt,
              };
            }
          } catch (err) {
            console.error(`Failed to fetch activities for event ${event.eventId}:`, err);
          }
          
          // Fallback if activities fetch fails
          return {
            eventId: event.eventId,
            name: event.name,
            gamePin: event.gamePin,
            status: event.status,
            visibility: event.visibility,
            participantCount: event.participantCount || 0,
            activityCount: 0,
            topic: event.topic,
            description: event.description,
            createdAt: event.createdAt,
            lastModified: event.lastModified,
            startedAt: event.startedAt,
            completedAt: event.completedAt,
          };
        })
      );
      
      setEvents(eventCards);
      setFilteredEvents(eventCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let result = events;

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter((event) => event.status === filter);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.topic?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.gamePin?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(result);
  }, [events, filter, searchQuery]);

  // Save filter and search state when they change
  useEffect(() => {
    saveState('dashboardFilter', filter);
  }, [filter, saveState]);

  useEffect(() => {
    saveState('dashboardSearch', searchQuery);
  }, [searchQuery, saveState]);

  // Real-time updates via WebSocket
  const handleEventStatusChanged = useCallback((eventId: string, status: string, timestamp: number) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.map((event) => {
        if (event.eventId === eventId) {
          const updates: Partial<EventCardData> = {
            status: status as EventStatus,
            lastModified: timestamp,
          };
          
          // Update timestamps based on status
          if (status === 'live' && !event.startedAt) {
            updates.startedAt = timestamp;
          } else if (status === 'completed' && !event.completedAt) {
            updates.completedAt = timestamp;
          }
          
          return { ...event, ...updates };
        }
        return event;
      });
      
      return updatedEvents;
    });
    
    // Show notification for status changes
    const event = events.find(e => e.eventId === eventId);
    if (event) {
      if (status === 'live') {
        addNotification('info', `"${event.name}" is now live! 🔴`);
      } else if (status === 'completed') {
        addNotification('success', `"${event.name}" has been completed ✓`);
      }
    }
  }, [events, addNotification]);

  const handleEventMetadataUpdated = useCallback((eventId: string, updates: any) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.eventId === eventId ? { ...event, ...updates } : event
      )
    );
  }, []);

  const handleParticipantCountUpdated = useCallback((eventId: string, count: number) => {
    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.map((event) => {
        if (event.eventId === eventId) {
          const oldCount = event.participantCount || 0;
          // Only show notification if count increased significantly (new participant joined)
          if (count > oldCount && event.status === 'live') {
            const event = prevEvents.find(e => e.eventId === eventId);
            if (event) {
              addNotification('info', `New participant joined "${event.name}"! (${count} total)`);
            }
          }
          return { ...event, participantCount: count };
        }
        return event;
      });
      
      return updatedEvents;
    });
  }, [addNotification]);

  // Subscribe to real-time dashboard updates
  useDashboardUpdates(organizerId, {
    onQuizStatusChanged: handleEventStatusChanged,
    onQuizMetadataUpdated: handleEventMetadataUpdated,
    onParticipantCountUpdated: handleParticipantCountUpdated,
  });

  const handleCreateNew = () => {
    navigate('/create');
  };

  const handleEventSelect = (eventId: string) => {
    // Mark notifications as read when navigating to event
    markAsRead(eventId);
    navigate(`/events/${eventId}/activities`);
  };

  const handleEventDelete = async (eventId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this event? This will delete all activities and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-organizer-id': organizerId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      // Refresh the event list
      await fetchEvents();
      addNotification('success', 'Event deleted successfully');
    } catch (err) {
      console.error('Failed to delete event:', err);
      addNotification('error', err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const getFilterCounts = () => {
    return {
      all: events.length,
      draft: events.filter((e) => e.status === 'draft').length,
      setup: events.filter((e) => e.status === 'setup').length,
      live: events.filter((e) => e.status === 'live').length,
      completed: events.filter((e) => e.status === 'completed').length,
    };
  };

  const counts = getFilterCounts();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white mt-4">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">My Events</h1>
            <p className="text-white/80 mt-2">
              Manage all your events and activities in one place
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-2 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors shadow-lg"
          >
            ➕ Create New Event
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tab Filters */}
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
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'draft'
                  ? 'bg-white text-kahoot-purple-dark shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              📝 Draft ({counts.draft})
            </button>
            <button
              onClick={() => setFilter('setup')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'setup'
                  ? 'bg-white text-kahoot-purple-dark shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ⚙️ Setup ({counts.setup})
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'live'
                  ? 'bg-white text-kahoot-purple-dark shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🔴 Live ({counts.live})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-kahoot-purple-dark shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ✓ Completed ({counts.completed})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white/90 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-answer-yellow"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Event Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center">
          <p className="text-white text-lg mb-4">
            {searchQuery
              ? 'No events match your search'
              : filter === 'all'
              ? 'No events yet'
              : `No ${filter} events`}
          </p>
          {!searchQuery && filter === 'all' && (
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors"
            >
              Create Your First Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              onSelect={handleEventSelect}
              onDelete={handleEventDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
