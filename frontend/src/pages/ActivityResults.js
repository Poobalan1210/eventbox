import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Activity Results Page
 * Shows detailed results and participant information for completed activities
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
export default function ActivityResults() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { colors } = useTheme();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    // Quiz-specific data
    const [leaderboard, setLeaderboard] = useState([]);
    // Poll-specific data
    const [pollResults, setPollResults] = useState([]);
    // Raffle-specific data
    const [raffleEntries, setRaffleEntries] = useState([]);
    useEffect(() => {
        fetchActivityDetails();
    }, [activityId]);
    const fetchActivityDetails = async () => {
        if (!activityId)
            return;
        try {
            // Fetch activity details
            const activityResponse = await fetch(`${apiBaseUrl}/activities/${activityId}`);
            if (!activityResponse.ok) {
                throw new Error('Failed to fetch activity');
            }
            const activityData = await activityResponse.json();
            const act = activityData.activity;
            setActivity(act);
            // Fetch type-specific data
            if (act.type === 'quiz') {
                await fetchQuizResults(activityId);
            }
            else if (act.type === 'poll') {
                await fetchPollResults(activityId);
            }
            else if (act.type === 'raffle') {
                await fetchRaffleResults(activityId, act);
            }
        }
        catch (error) {
            console.error('Error fetching activity details:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchQuizResults = async (activityId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${activityId}/leaderboard`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data || []);
            }
        }
        catch (error) {
            console.error('Error fetching quiz results:', error);
        }
    };
    const fetchPollResults = async (activityId) => {
        try {
            console.log('getting for poll view results');
            const response = await fetch(`${apiBaseUrl}/activities/${activityId}/poll-results`);
            if (response.ok) {
                const data = await response.json();
                console.log('Poll results data:', data);
                const pollData = data.results;
                if (!pollData || !pollData.options) {
                    console.error('Invalid poll data structure:', pollData);
                    setPollResults([]);
                    return;
                }
                // Transform backend format to frontend format
                const totalVotes = pollData.totalVotes || 0;
                const results = (pollData.options || []).map((option) => ({
                    optionId: option.id,
                    text: option.text,
                    voteCount: option.voteCount || 0,
                    percentage: totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0,
                }));
                console.log('Transformed poll results:', results);
                setPollResults(results);
            }
            else {
                console.error('Failed to fetch poll results:', response.status, response.statusText);
                setPollResults([]);
            }
        }
        catch (error) {
            console.error('Error fetching poll results:', error);
            setPollResults([]);
        }
    };
    const fetchRaffleResults = async (activityId, activity) => {
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${activityId}/entries`);
            if (response.ok) {
                const data = await response.json();
                const entries = (data.entries || []).map((entry) => ({
                    ...entry,
                    isWinner: activity.winners?.includes(entry.participantId) || false,
                }));
                setRaffleEntries(entries);
            }
        }
        catch (error) {
            console.error('Error fetching raffle entries:', error);
        }
    };
    const renderQuizResults = (activity) => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Total Participants" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: leaderboard.length })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Questions" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activity.questions?.length || 0 })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Avg Score" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: leaderboard.length > 0
                                    ? Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)
                                    : 0 })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Scoring" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activity.scoringEnabled ? 'Enabled' : 'Disabled' })] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-semibold mb-4", style: { color: colors.textPrimary }, children: "\uD83C\uDFC6 Final Leaderboard" }), leaderboard.length === 0 ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { style: { color: colors.textSecondary }, children: "No participants" }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-white/10", children: [_jsx("th", { className: "text-left py-3 px-2", style: { color: colors.textSecondary }, children: "Rank" }), _jsx("th", { className: "text-left py-3 px-2", style: { color: colors.textSecondary }, children: "Name" }), _jsx("th", { className: "text-right py-3 px-2", style: { color: colors.textSecondary }, children: "Score" }), _jsx("th", { className: "text-right py-3 px-2", style: { color: colors.textSecondary }, children: "Correct" }), _jsx("th", { className: "text-right py-3 px-2", style: { color: colors.textSecondary }, children: "Time" })] }) }), _jsx("tbody", { children: leaderboard.map((participant, index) => (_jsxs("tr", { className: `border-b border-white/5 ${index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}`, children: [_jsx("td", { className: "py-3 px-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [index === 0 && _jsx("span", { className: "text-lg", children: "\uD83E\uDD47" }), index === 1 && _jsx("span", { className: "text-lg", children: "\uD83E\uDD48" }), index === 2 && _jsx("span", { className: "text-lg", children: "\uD83E\uDD49" }), _jsxs("span", { className: "font-medium", style: { color: colors.textPrimary }, children: ["#", participant.rank] })] }) }), _jsx("td", { className: "py-3 px-2", children: _jsx("span", { className: "font-medium", style: { color: colors.textPrimary }, children: participant.name }) }), _jsx("td", { className: "py-3 px-2 text-right", children: _jsx("span", { className: "font-bold text-lg", style: { color: colors.accent }, children: participant.score }) }), _jsx("td", { className: "py-3 px-2 text-right", children: _jsxs("span", { style: { color: colors.textPrimary }, children: [participant.correctAnswers, "/", participant.totalQuestions] }) }), _jsx("td", { className: "py-3 px-2 text-right", children: _jsxs("span", { className: "text-sm", style: { color: colors.textSecondary }, children: [(participant.totalAnswerTime / 1000).toFixed(1), "s"] }) })] }, participant.participantId))) })] }) }))] })] }));
    const renderPollResults = (activity) => {
        // Safety check: ensure pollResults is an array
        const safeResults = Array.isArray(pollResults) ? pollResults : [];
        const totalVotes = safeResults.reduce((sum, r) => sum + r.voteCount, 0);
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Total Votes" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: totalVotes })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Options" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activity.options?.length || 0 })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Multiple Votes" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activity.allowMultipleVotes ? 'Yes' : 'No' })] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-semibold mb-2", style: { color: colors.textPrimary }, children: "Question" }), _jsx("p", { className: "text-lg", style: { color: colors.textSecondary }, children: activity.question })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-semibold mb-4", style: { color: colors.textPrimary }, children: "\uD83D\uDCCA Results" }), _jsx("div", { className: "space-y-4", children: safeResults.map((result, index) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { style: { color: colors.textPrimary }, className: "font-medium", children: result.text }), _jsxs("span", { style: { color: colors.textSecondary }, className: "text-sm", children: [result.voteCount, " votes (", result.percentage.toFixed(1), "%)"] })] }), _jsx("div", { className: "w-full bg-white/10 rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
                                                width: `${result.percentage}%`,
                                                backgroundColor: colors.accent,
                                            } }) })] }, result.optionId))) })] })] }));
    };
    const renderRaffleResults = (activity) => {
        const winners = raffleEntries.filter(e => e.isWinner);
        const nonWinners = raffleEntries.filter(e => !e.isWinner);
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Total Entries" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: raffleEntries.length })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Winners" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: winners.length })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-4", children: [_jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Entry Method" }), _jsx("div", { className: "text-2xl font-bold", style: { color: colors.accent }, children: activity.entryMethod === 'automatic' ? 'Auto' : 'Manual' })] })] }), _jsxs("div", { className: "bg-white/5 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-semibold mb-2", style: { color: colors.textPrimary }, children: "\uD83C\uDF81 Prize" }), _jsx("p", { className: "text-lg", style: { color: colors.textSecondary }, children: activity.prizeDescription || 'No prize description' })] }), winners.length > 0 && (_jsxs("div", { className: "bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg p-6 border border-yellow-500/30", children: [_jsx("h3", { className: "text-xl font-semibold mb-4", style: { color: colors.textPrimary }, children: "\uD83C\uDF89 Winners" }), _jsx("div", { className: "space-y-3", children: winners.map((winner, index) => (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-white/10", children: [_jsx("span", { className: "text-2xl", children: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆' }), _jsx("span", { className: "font-bold text-lg", style: { color: colors.textPrimary }, children: winner.participantName })] }, winner.participantId))) })] })), _jsxs("div", { className: "bg-white/5 rounded-lg p-6", children: [_jsxs("h3", { className: "text-xl font-semibold mb-4", style: { color: colors.textPrimary }, children: ["\uD83D\uDC65 All Participants (", raffleEntries.length, ")"] }), raffleEntries.length === 0 ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { style: { color: colors.textSecondary }, children: "No participants" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: raffleEntries.map((entry) => (_jsx("div", { className: `p-3 rounded-lg ${entry.isWinner
                                    ? 'bg-yellow-500/20 border border-yellow-500/30'
                                    : 'bg-white/5'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: entry.isWinner ? '🏆' : '👤' }), _jsx("span", { style: { color: colors.textPrimary }, className: "font-medium", children: entry.participantName })] }) }, entry.participantId))) }))] })] }));
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: colors.background }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { style: { color: colors.textSecondary }, children: "Loading activity results..." })] }) }));
    }
    if (!activity) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: colors.background }, children: _jsxs("div", { className: "text-center", children: [_jsx("p", { style: { color: colors.textSecondary }, children: "Activity not found" }), _jsx("button", { onClick: () => navigate(-1), className: "mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg", children: "Go Back" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen", style: { backgroundColor: colors.background, color: colors.textPrimary }, children: _jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("button", { onClick: () => navigate(-1), className: "flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors", style: { color: colors.textPrimary }, children: "\u2190 Back" }) }), _jsx("div", { className: "bg-white/10 rounded-lg p-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsxs("span", { className: "text-3xl", children: [activity.type === 'quiz' && '❓', activity.type === 'poll' && '📊', activity.type === 'raffle' && '🎁'] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", style: { color: colors.textPrimary }, children: activity.name }), _jsxs("p", { style: { color: colors.textSecondary }, children: [activity.type.charAt(0).toUpperCase() + activity.type.slice(1), " \u2022 ", activity.status] })] })] }) }), activity.type === 'quiz' && renderQuizResults(activity), activity.type === 'poll' && renderPollResults(activity), activity.type === 'raffle' && renderRaffleResults(activity)] }) }));
}
