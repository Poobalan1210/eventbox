import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function ActivityControlPanel({ eventId, organizerId, onActivityChange, }) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const [activities, setActivities] = useState([]);
    const [activeActivityId, setActiveActivityId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(null);
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
            const sortedActivities = data.activities.sort((a, b) => a.order - b.order);
            setActivities(sortedActivities);
            // Find active activity
            const active = sortedActivities.find((a) => a.status === 'active');
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
    // Activate activity
    const handleActivate = async (activityId) => {
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
            const data = await response.json();
            if (data.success) {
                await fetchActivities();
                if (onActivityChange) {
                    onActivityChange();
                }
            }
        }
        catch (err) {
            console.error('Failed to activate activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to activate activity');
        }
        finally {
            setActionInProgress(null);
        }
    };
    // Deactivate activity
    const handleDeactivate = async (activityId) => {
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
            const data = await response.json();
            if (data.success) {
                await fetchActivities();
                if (onActivityChange) {
                    onActivityChange();
                }
            }
        }
        catch (err) {
            console.error('Failed to deactivate activity:', err);
            alert(err instanceof Error ? err.message : 'Failed to deactivate activity');
        }
        finally {
            setActionInProgress(null);
        }
    };
    // Get activity icon
    const getActivityIcon = (type) => {
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
    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700", children: "\uD83D\uDCDD Draft" }));
            case 'ready':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700", children: "\u2713 Ready" }));
            case 'active':
                return (_jsxs("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700", children: [_jsx("span", { className: "w-1.5 h-1.5 mr-1 rounded-full bg-green-600 animate-pulse" }), "Active"] }));
            case 'completed':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700", children: "\u2713 Completed" }));
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-6", children: _jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" }), _jsx("p", { className: "text-white ml-3", children: "Loading control panel..." })] }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsx("p", { className: "text-red-600 text-sm", children: error }), _jsx("button", { onClick: fetchActivities, className: "mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700", children: "Retry" })] }));
    }
    if (activities.length === 0) {
        return (_jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-6", children: _jsx("p", { className: "text-white text-center", children: "No activities to control. Add activities to get started." }) }));
    }
    return (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-white/5 px-4 py-3 border-b border-white/10", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Activity Control Panel" }), _jsx("p", { className: "text-sm text-white/70 mt-0.5", children: "Manage which activity is currently active for participants" })] }), _jsxs("a", { href: `/events/${eventId}/control`, className: "px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2", children: [_jsx("span", { children: "\uD83C\uDFAE" }), _jsx("span", { children: "Advanced Controls" })] })] }) }), activeActivityId && (_jsx("div", { className: "bg-green-500/20 border-b border-green-500/30 px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" }), _jsx("span", { className: "text-green-100 font-medium text-sm", children: "Currently Active:" }), _jsx("span", { className: "text-white font-semibold", children: activities.find((a) => a.activityId === activeActivityId)?.name })] }), _jsx("button", { onClick: () => handleDeactivate(activeActivityId), disabled: actionInProgress === activeActivityId, className: "px-3 py-1 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: actionInProgress === activeActivityId ? '⏳ Deactivating...' : '⏸️ Deactivate' })] }) })), !activeActivityId && (_jsx("div", { className: "bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-yellow-100 font-medium text-sm", children: "\u23F8\uFE0F No active activity" }), _jsx("span", { className: "text-white/80 text-sm", children: "- Participants are in waiting state" })] }) })), _jsx("div", { className: "divide-y divide-white/10", children: activities.map((activity) => {
                    const isActive = activity.activityId === activeActivityId;
                    const canActivate = activity.status === 'ready' && !isActive;
                    const isProcessing = actionInProgress === activity.activityId;
                    return (_jsx("div", { className: `px-4 py-3 transition-colors ${isActive ? 'bg-green-500/10' : 'hover:bg-white/5'}`, children: _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx("span", { className: "text-2xl flex-shrink-0", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h4", { className: "text-white font-medium truncate", children: activity.name }), getStatusBadge(activity.status)] }), _jsxs("p", { className: "text-sm text-white/60 capitalize", children: [activity.type, " \u2022 Order: ", activity.order] })] })] }), _jsxs("div", { className: "flex-shrink-0", children: [isActive && (_jsx("button", { onClick: () => handleDeactivate(activity.activityId), disabled: isProcessing, className: "px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md", children: isProcessing ? '⏳ Deactivating...' : '⏸️ Deactivate' })), canActivate && (_jsx("button", { onClick: () => handleActivate(activity.activityId), disabled: isProcessing, className: "px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md", children: isProcessing ? '⏳ Activating...' : '▶️ Activate' })), !canActivate && !isActive && (_jsxs("span", { className: "px-4 py-2 text-sm text-white/50", children: [activity.status === 'draft' && 'Not ready', activity.status === 'completed' && 'Completed'] }))] })] }) }, activity.activityId));
                }) }), _jsx("div", { className: "bg-white/5 px-4 py-3 border-t border-white/10", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-white/70", children: [_jsxs("span", { children: ["Total Activities: ", activities.length] }), _jsxs("span", { children: ["Ready: ", activities.filter((a) => a.status === 'ready').length, " | Active: ", activities.filter((a) => a.status === 'active').length, " | Completed: ", activities.filter((a) => a.status === 'completed').length] })] }) })] }));
}
