import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from './ActivityCard';
import AddActivityDialog from './AddActivityDialog';
export default function ActivityList({ eventId, organizerId, onActivityEdit }) {
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const [activities, setActivities] = useState([]);
    const [activeActivityId, setActiveActivityId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [filter, setFilter] = useState('all');
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
            const data = await response.json();
            setActivities(data.activities.sort((a, b) => a.order - b.order));
            // Find active activity
            const active = data.activities.find((a) => a.status === 'active');
            setActiveActivityId(active?.activityId || null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchActivities();
    }, [eventId]);
    // Add new activity
    const handleAddActivity = async (type, name) => {
        try {
            const request = {
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
                    entryMethod: 'automatic',
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
            const data = await response.json();
            // Refresh activities list
            await fetchActivities();
            // Navigate to edit if handler provided
            if (onActivityEdit) {
                onActivityEdit(data.activityId);
            }
        }
        catch (err) {
            console.error('Failed to create activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to create activity');
        }
    };
    // Activate activity
    const handleActivate = async (activityId) => {
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
            const data = await response.json();
            if (data.success) {
                await fetchActivities();
            }
        }
        catch (err) {
            console.error('Failed to activate activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to activate activity');
        }
    };
    // Deactivate activity
    const handleDeactivate = async (activityId) => {
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
            const data = await response.json();
            if (data.success) {
                await fetchActivities();
            }
        }
        catch (err) {
            console.error('Failed to deactivate activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to deactivate activity');
        }
    };
    // Delete activity
    const handleDelete = async (activityId) => {
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
            const data = await response.json();
            if (data.success) {
                await fetchActivities();
            }
        }
        catch (err) {
            console.error('Failed to delete activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete activity');
        }
    };
    // View activity results
    const handleViewResults = (activityId) => {
        navigate(`/activities/${activityId}/results`);
    };
    // Edit activity
    const handleEdit = (activityId) => {
        if (onActivityEdit) {
            onActivityEdit(activityId);
        }
    };
    // Filter activities
    const filteredActivities = filter === 'all' ? activities : activities.filter((a) => a.type === filter);
    const getFilterCounts = () => ({
        all: activities.length,
        quiz: activities.filter((a) => a.type === 'quiz').length,
        poll: activities.filter((a) => a.type === 'poll').length,
        raffle: activities.filter((a) => a.type === 'raffle').length,
    });
    const counts = getFilterCounts();
    if (isLoading) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" }), _jsx("p", { className: "text-white mt-4", children: "Loading activities..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: [_jsx("p", { className: "text-red-600", children: error }), _jsx("button", { onClick: fetchActivities, className: "mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Retry" })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Activities" }), _jsx("p", { className: "text-white/80 mt-1", children: "Manage quizzes, polls, and raffles for your event" })] }), _jsx("button", { onClick: () => setIsAddDialogOpen(true), className: "px-6 py-2 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors shadow-lg", children: "\u2795 Add Activity" })] }) }), activeActivityId && (_jsx("div", { className: "bg-green-100 border-2 border-green-400 rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-green-600 animate-pulse" }), _jsxs("p", { className: "text-green-800 font-semibold", children: [activities.find((a) => a.activityId === activeActivityId)?.name, " is currently active"] })] }) })), _jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-white text-kahoot-purple-dark shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["All (", counts.all, ")"] }), _jsxs("button", { onClick: () => setFilter('quiz'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'quiz'
                                ? 'bg-white text-kahoot-purple-dark shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\u2753 Quizzes (", counts.quiz, ")"] }), _jsxs("button", { onClick: () => setFilter('poll'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'poll'
                                ? 'bg-white text-kahoot-purple-dark shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\uD83D\uDCCA Polls (", counts.poll, ")"] }), _jsxs("button", { onClick: () => setFilter('raffle'), className: `px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'raffle'
                                ? 'bg-white text-kahoot-purple-dark shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'}`, children: ["\uD83C\uDF81 Raffles (", counts.raffle, ")"] })] }) }), filteredActivities.length === 0 ? (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-12 text-center", children: [_jsx("p", { className: "text-white text-lg mb-4", children: filter === 'all' ? 'No activities yet' : `No ${filter} activities` }), _jsx("button", { onClick: () => setIsAddDialogOpen(true), className: "px-6 py-3 bg-answer-yellow text-kahoot-purple-dark rounded-lg font-semibold hover:bg-answer-yellow/90 transition-colors", children: "Add Your First Activity" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredActivities.map((activity) => (_jsx(ActivityCard, { activity: activity, isActive: activity.activityId === activeActivityId, onActivate: handleActivate, onDeactivate: handleDeactivate, onEdit: handleEdit, onDelete: handleDelete, onViewResults: handleViewResults }, activity.activityId))) })), _jsx(AddActivityDialog, { isOpen: isAddDialogOpen, onClose: () => setIsAddDialogOpen(false), onAdd: handleAddActivity })] }));
}
