import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
function RaffleParticipantsTable({ activityId }) {
    const { colors } = useTheme();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/activities/${activityId}/entries`);
                if (response.ok) {
                    const data = await response.json();
                    setParticipants(data.entries || []);
                }
            }
            catch (error) {
                console.error('Error fetching raffle participants:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchParticipants();
        const interval = setInterval(fetchParticipants, 3000); // Refresh every 3 seconds
        return () => clearInterval(interval);
    }, [activityId, apiBaseUrl]);
    return (_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsxs("h4", { className: "text-lg font-semibold mb-3", style: { color: colors.textPrimary }, children: ["\uD83C\uDFAB Raffle Participants (", participants.length, ")"] }), loading ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto" }), _jsx("p", { className: "text-sm mt-2", style: { color: colors.textSecondary }, children: "Loading participants..." })] })) : participants.length === 0 ? (_jsxs("div", { className: "text-center py-6", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83C\uDFAA" }), _jsx("p", { style: { color: colors.textSecondary }, children: "No participants yet" }), _jsx("p", { className: "text-sm mt-1", style: { color: colors.textSecondary }, children: "Participants will appear here when they enter the raffle" })] })) : (_jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto", children: participants.map((participant, index) => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-md", style: { backgroundColor: 'rgba(255, 255, 255, 0.05)' }, children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDC64" }), _jsx("span", { style: { color: colors.textPrimary }, className: "font-medium", children: participant.participantName }), _jsxs("span", { className: "ml-auto text-xs", style: { color: colors.textSecondary }, children: ["#", index + 1] })] }, participant.participantId))) }))] }));
}
export default function OrganizerControlDashboard({ eventId, organizerId, }) {
    const { colors } = useTheme();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const [activities, setActivities] = useState([]);
    const [activeActivity, setActiveActivity] = useState(null);
    const [stats, setStats] = useState({
        participantCount: 0,
        totalResponses: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(null);
    // Fetch activities and find active one
    const fetchActivities = async () => {
        try {
            console.log('Fetching activities for event:', eventId);
            const response = await fetch(`${apiBaseUrl}/events/${eventId}/activities`, {
                headers: { 'x-organizer-id': organizerId },
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Activities API response:', data);
                const activities = data.activities || [];
                setActivities(activities);
                // Find active activity
                const active = activities.find((a) => a.status === 'active');
                setActiveActivity(active || null);
            }
            else {
                console.error('Failed to fetch activities:', response.status, response.statusText);
                setActivities([]);
                setActiveActivity(null);
            }
        }
        catch (error) {
            console.error('Error fetching activities:', error);
            setActivities([]);
            setActiveActivity(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Fetch real-time stats
    const fetchStats = async () => {
        if (!activeActivity)
            return;
        try {
            const response = await fetch(`${apiBaseUrl}/events/${eventId}/participants`);
            if (response.ok) {
                const data = await response.json();
                setStats(prev => ({
                    ...prev,
                    participantCount: data.participants?.length || 0,
                }));
            }
        }
        catch (error) {
            console.error('Error fetching stats:', error);
        }
    };
    useEffect(() => {
        fetchActivities();
    }, [eventId]);
    useEffect(() => {
        if (activeActivity) {
            fetchStats();
            const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
            return () => clearInterval(interval);
        }
    }, [activeActivity]);
    // Activity control functions
    const handleQuizAction = async (action) => {
        console.log('Quiz action clicked:', action, 'Active activity:', activeActivity);
        if (!activeActivity) {
            console.log('No active activity found');
            return;
        }
        setActionInProgress(action);
        try {
            let endpoint = '';
            let method = 'POST';
            switch (action) {
                case 'start':
                    endpoint = `/activities/${activeActivity.activityId}/start-quiz`;
                    break;
                case 'next':
                    endpoint = `/activities/${activeActivity.activityId}/next-question`;
                    break;
                case 'end':
                    endpoint = `/activities/${activeActivity.activityId}/end-quiz`;
                    break;
                case 'show-results':
                    console.log('Show results - not implemented yet');
                    return;
                case 'show-leaderboard':
                    console.log('Show leaderboard - not implemented yet');
                    return;
            }
            console.log('Making request to:', `${apiBaseUrl}${endpoint}`);
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-organizer-id': organizerId,
                },
            });
            console.log('Response status:', response.status);
            if (response.ok) {
                const result = await response.json();
                console.log('Response:', result);
                await fetchActivities();
            }
            else {
                const error = await response.json();
                console.error('Error response:', error);
            }
        }
        catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
        finally {
            setActionInProgress(null);
        }
    };
    const handlePollAction = async (action) => {
        if (!activeActivity)
            return;
        setActionInProgress(action);
        try {
            let endpoint = '';
            switch (action) {
                case 'start':
                    endpoint = `/activities/${activeActivity.activityId}/start-poll`;
                    break;
                case 'end':
                    endpoint = `/activities/${activeActivity.activityId}/end-poll`;
                    break;
                case 'show-results':
                    endpoint = `/activities/${activeActivity.activityId}/show-results`;
                    break;
            }
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-organizer-id': organizerId,
                },
            });
            if (response.ok) {
                await fetchActivities();
            }
        }
        catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
        finally {
            setActionInProgress(null);
        }
    };
    const handleRaffleAction = async (action, winnerCount) => {
        if (!activeActivity)
            return;
        setActionInProgress(action);
        try {
            if (action === 'draw') {
                // Draw winners (this now handles starting the raffle automatically)
                const drawResponse = await fetch(`${apiBaseUrl}/activities/${activeActivity.activityId}/draw-winners`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-organizer-id': organizerId,
                    },
                    body: JSON.stringify({ count: winnerCount || 1 }),
                });
                if (!drawResponse.ok) {
                    const errorData = await drawResponse.json();
                    throw new Error(errorData.message || 'Failed to draw winners');
                }
                // Wait for the drawing animation to complete
                await new Promise(resolve => setTimeout(resolve, 4000));
                // End the raffle
                const endResponse = await fetch(`${apiBaseUrl}/activities/${activeActivity.activityId}/end-raffle`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-organizer-id': organizerId,
                    },
                });
                if (!endResponse.ok) {
                    console.warn('Failed to end raffle, but winners were drawn successfully');
                }
            }
            await fetchActivities();
        }
        catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(error instanceof Error ? error.message : `Failed to ${action} raffle`);
        }
        finally {
            setActionInProgress(null);
        }
    };
    const renderQuizControls = (activity) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs("button", { onClick: () => handleQuizAction('start'), disabled: !!actionInProgress, className: "px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'start' ? '⏳' : '▶️', " Start Quiz"] }), _jsxs("button", { onClick: () => handleQuizAction('next'), disabled: !!actionInProgress, className: "px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'next' ? '⏳' : '⏭️', " Next Question"] }), _jsxs("button", { onClick: () => handleQuizAction('show-results'), disabled: !!actionInProgress, className: "px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'show-results' ? '⏳' : '📊', " Show Results"] }), _jsxs("button", { onClick: () => handleQuizAction('show-leaderboard'), disabled: !!actionInProgress, className: "px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'show-leaderboard' ? '⏳' : '🏆', " Leaderboard"] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("h4", { className: "text-lg font-semibold mb-2", style: { color: colors.textPrimary }, children: "Quiz Progress" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Questions: " }), _jsxs("span", { style: { color: colors.textPrimary }, children: [activity.currentQuestionIndex + 1, " / ", activity.questions?.length || 0] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Scoring: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.scoringEnabled ? 'Enabled' : 'Disabled' })] })] })] }), _jsx("button", { onClick: () => handleQuizAction('end'), disabled: !!actionInProgress, className: "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: actionInProgress === 'end' ? '⏳ Ending...' : '⏹️ End Quiz' })] }));
    const renderPollControls = (activity) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("button", { onClick: () => handlePollAction('start'), disabled: !!actionInProgress, className: "px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'start' ? '⏳' : '▶️', " Start Poll"] }), _jsxs("button", { onClick: () => handlePollAction('show-results'), disabled: !!actionInProgress, className: "px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'show-results' ? '⏳' : '📊', " Show Results"] }), _jsxs("button", { onClick: () => handlePollAction('end'), disabled: !!actionInProgress, className: "px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50", children: [actionInProgress === 'end' ? '⏳' : '⏹️', " End Poll"] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("h4", { className: "text-lg font-semibold mb-2", style: { color: colors.textPrimary }, children: "Poll Details" }), _jsxs("div", { className: "text-sm", children: [_jsxs("div", { className: "mb-2", children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Question: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.question || 'No question set' })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Options: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.options?.length || 0 })] })] })] })] }));
    const renderRaffleControls = (activity) => (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx("button", { onClick: () => handleRaffleAction('draw', activity.winnerCount), disabled: !!actionInProgress, className: "px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg transform hover:scale-105", children: actionInProgress === 'draw' ? '⏳ Drawing Winners...' : '🎉 Draw Winners' }) }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("h4", { className: "text-lg font-semibold mb-2", style: { color: colors.textPrimary }, children: "Raffle Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Prize: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.prizeDescription || 'No prize set' })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Winners: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.winnerCount || 1 })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Entry Method: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.entryMethod || 'manual' })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.textSecondary }, children: "Status: " }), _jsx("span", { style: { color: colors.textPrimary }, children: activity.status })] })] })] }), _jsx(RaffleParticipantsTable, { activityId: activity.activityId }), _jsx("div", { className: "bg-blue-500/10 border border-blue-500/30 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "text-blue-400 text-xl", children: "\uD83D\uDCA1" }), _jsxs("div", { children: [_jsx("h5", { className: "font-medium text-blue-300 mb-1", children: "How it works:" }), _jsxs("p", { className: "text-sm text-blue-200", children: [activity.entryMethod === 'automatic'
                                            ? 'Participants are automatically entered when the raffle starts. '
                                            : 'Participants must click "Enter Raffle" to join. ', "Click \"Draw Winners\" to select ", activity.winnerCount || 1, " winner", (activity.winnerCount || 1) > 1 ? 's' : '', " and end the raffle!"] })] })] }) })] }));
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { style: { color: colors.textSecondary }, children: "Loading dashboard..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", style: { color: colors.textPrimary }, children: "Organizer Control Dashboard" }), _jsx("p", { style: { color: colors.textSecondary }, children: "Control your live activities in real-time" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: stats.participantCount }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Participants" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activities.length }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Total Activities" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activities.filter(a => a.status === 'ready').length }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Ready" })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activities.filter(a => a.status === 'completed').length }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Completed" })] })] }), activeActivity ? (_jsxs("div", { className: "bg-white/10 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsxs("span", { className: "text-3xl", children: [activeActivity.type === 'quiz' && '❓', activeActivity.type === 'poll' && '📊', activeActivity.type === 'raffle' && '🎁'] }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", style: { color: colors.textPrimary }, children: activeActivity.name }), _jsxs("p", { style: { color: colors.textSecondary }, children: ["Currently Active \u2022 ", activeActivity.type.charAt(0).toUpperCase() + activeActivity.type.slice(1)] })] })] }), activeActivity.type === 'quiz' && renderQuizControls(activeActivity), activeActivity.type === 'poll' && renderPollControls(activeActivity), activeActivity.type === 'raffle' && renderRaffleControls(activeActivity)] })) : (_jsxs("div", { className: "bg-white/5 rounded-lg p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u23F8\uFE0F" }), _jsx("h3", { className: "text-xl font-semibold mb-2", style: { color: colors.textPrimary }, children: "No Active Activity" }), _jsx("p", { style: { color: colors.textSecondary }, children: "Activate an activity from the activities list to start controlling it" })] }))] }));
}
