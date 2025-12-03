import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/Notification';
import EventCard from '../components/EventCard';
import { useNavigationState, useScrollRestoration } from '../hooks/useNavigationState';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';
import { useDashboardUpdates } from '../hooks/useDashboardUpdates';
import { useNotifications } from '../hooks/useNotifications';
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
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState(() => loadState('dashboardFilter', 'all'));
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
            const data = await response.json();
            const quizzes = data.quizzes || [];
            // Transform events to EventCardData format
            const eventCards = await Promise.all(quizzes.map(async (event) => {
                // Fetch activities for each event to get activity count
                try {
                    const activitiesResponse = await fetch(`${apiBaseUrl}/events/${event.eventId}/activities`, {
                        headers: {
                            'x-organizer-id': organizerId,
                        },
                    });
                    if (activitiesResponse.ok) {
                        const activitiesData = await activitiesResponse.json();
                        const activities = activitiesData.activities || [];
                        const activeActivity = activities.find((a) => a.status === 'active');
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
                }
                catch (err) {
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
            }));
            setEvents(eventCards);
            setFilteredEvents(eventCards);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
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
            result = result.filter((event) => event.name.toLowerCase().includes(query) ||
                event.topic?.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.gamePin?.toLowerCase().includes(query));
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
    const handleEventStatusChanged = useCallback((eventId, status, timestamp) => {
        setEvents((prevEvents) => {
            const updatedEvents = prevEvents.map((event) => {
                if (event.eventId === eventId) {
                    const updates = {
                        status: status,
                        lastModified: timestamp,
                    };
                    // Update timestamps based on status
                    if (status === 'live' && !event.startedAt) {
                        updates.startedAt = timestamp;
                    }
                    else if (status === 'completed' && !event.completedAt) {
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
            }
            else if (status === 'completed') {
                addNotification('success', `"${event.name}" has been completed ✓`);
            }
        }
    }, [events, addNotification]);
    const handleEventMetadataUpdated = useCallback((eventId, updates) => {
        setEvents((prevEvents) => prevEvents.map((event) => event.eventId === eventId ? { ...event, ...updates } : event));
    }, []);
    const handleParticipantCountUpdated = useCallback((eventId, count) => {
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
    const handleEventSelect = (eventId) => {
        // Mark notifications as read when navigating to event
        markAsRead(eventId);
        navigate(`/events/${eventId}/activities`);
    };
    const handleEventDelete = async (eventId) => {
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
        }
        catch (err) {
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
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" }), _jsx("p", { className: "text-white mt-4", children: "Loading your events..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: [_jsx("p", { className: "text-red-600", children: error }), _jsx("button", { onClick: fetchEvents, className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Retry" })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-8", children: [notifications.map((notification) => (_jsx(Notification, { type: notification.type, message: notification.message, onClose: () => removeNotification(notification.id) }, notification.id))), _jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-white", children: "My Events" }), _jsx("p", { className: "text-white/80 mt-2", children: "Manage all your events and activities in one place" })] }), _jsx("button", { onClick: handleCreateNew, className: "px-6 py-2 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors shadow-lg", children: "\u2795 Create New Event" })] }) }), _jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                        ? 'bg-white text-kahoot-purple-dark shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["All (", counts.all, ")"] }), _jsxs("button", { onClick: () => setFilter('draft'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'draft'
                                        ? 'bg-white text-kahoot-purple-dark shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\uD83D\uDCDD Draft (", counts.draft, ")"] }), _jsxs("button", { onClick: () => setFilter('setup'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'setup'
                                        ? 'bg-white text-kahoot-purple-dark shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\u2699\uFE0F Setup (", counts.setup, ")"] }), _jsxs("button", { onClick: () => setFilter('live'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'live'
                                        ? 'bg-white text-kahoot-purple-dark shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\uD83D\uDD34 Live (", counts.live, ")"] }), _jsxs("button", { onClick: () => setFilter('completed'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                                        ? 'bg-white text-kahoot-purple-dark shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\u2713 Completed (", counts.completed, ")"] })] }), _jsxs("div", { className: "relative flex-1 lg:max-w-md", children: [_jsx("input", { type: "text", placeholder: "Search events...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full px-4 py-2 pl-10 bg-white/90 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-answer-yellow" }), _jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500", children: "\uD83D\uDD0D" })] })] }) }), filteredEvents.length === 0 ? (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center", children: [_jsx("p", { className: "text-white text-lg mb-4", children: searchQuery
                            ? 'No events match your search'
                            : filter === 'all'
                                ? 'No events yet'
                                : `No ${filter} events` }), !searchQuery && filter === 'all' && (_jsx("button", { onClick: handleCreateNew, className: "px-6 py-3 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors", children: "Create Your First Event" }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredEvents.map((event) => (_jsx(EventCard, { event: event, onSelect: handleEventSelect, onDelete: handleEventDelete }, event.eventId))) }))] }));
}
