import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ActivityList from '../components/ActivityList';
import QuizActivityConfig from '../components/QuizActivityConfig';
import PollActivityConfig from '../components/PollActivityConfig';
import RaffleActivityConfig from '../components/RaffleActivityConfig';
import ConnectionStatus from '../components/ConnectionStatus';
export default function EventActivities() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // For demo purposes, using a hardcoded organizerId
    // In production, this would come from authentication context
    const organizerId = 'demo-organizer-123';
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingActivity, setEditingActivity] = useState(null);
    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId)
                return;
            try {
                const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
                if (!response.ok) {
                    throw new Error('Failed to load event');
                }
                const data = await response.json();
                setEvent(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);
    const handleActivityEdit = async (activityId) => {
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
        }
        catch (err) {
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
            }
            catch (err) {
                console.error('Failed to refresh activity:', err);
            }
        }
        // If not editing, this will trigger a refresh of the activity list
    };
    const handleCancelEdit = () => {
        setEditingActivity(null);
    };
    if (!eventId) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsx("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-lg p-6", children: _jsx("p", { className: "text-white", children: "Invalid event ID" }) }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" }), _jsx("p", { className: "text-white mt-4", children: "Loading event..." })] }) }));
    }
    if (error || !event) {
        return (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: _jsxs("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Error" }), _jsx("p", { className: "text-white mb-4", children: error || 'Event not found' }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "px-4 py-2 bg-white text-kahoot-purple rounded-lg hover:bg-white/90 transition-colors font-medium", children: "Back to Dashboard" })] }) }));
    }
    // If editing an activity, show the appropriate config component
    if (editingActivity) {
        if (editingActivity.type === 'quiz') {
            return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-8", children: [_jsx(ConnectionStatus, {}), _jsx(QuizActivityConfig, { activity: editingActivity, onUpdate: handleActivityUpdate, onCancel: handleCancelEdit })] }));
        }
        if (editingActivity.type === 'poll') {
            return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-8", children: [_jsx(ConnectionStatus, {}), _jsx(PollActivityConfig, { activity: editingActivity, onUpdate: handleActivityUpdate, onCancel: handleCancelEdit })] }));
        }
        if (editingActivity.type === 'raffle') {
            return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-8", children: [_jsx(ConnectionStatus, {}), _jsx(RaffleActivityConfig, { activity: editingActivity, onUpdate: handleActivityUpdate, onCancel: handleCancelEdit })] }));
        }
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 pb-8", children: [_jsx(ConnectionStatus, {}), _jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "flex items-center gap-4 mb-4", children: _jsx("button", { onClick: () => navigate('/dashboard'), className: "text-white hover:text-white/80 transition-colors", children: "\u2190 Back to Dashboard" }) }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-white", children: event.name }), event.gamePin && (_jsxs("p", { className: "text-white/80 mt-2", children: ["Join Code: ", _jsx("span", { className: "font-mono font-bold", children: event.gamePin })] }))] }), _jsx("div", { className: "flex gap-3", children: _jsxs("button", { onClick: () => navigate(`/events/${eventId}/control`), className: "px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2", children: [_jsx("span", { children: "\uD83C\uDFAE" }), _jsx("span", { children: "Live Control Dashboard" })] }) })] })] }), _jsx(ActivityList, { eventId: eventId, organizerId: organizerId, onActivityEdit: handleActivityEdit })] }));
}
