import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function CompletedQuizResults({ eventId, eventName }) {
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Fetch participants for this event
                const response = await fetch(`${apiBaseUrl}/events/${eventId}/participants`);
                if (!response.ok) {
                    throw new Error('Failed to load results');
                }
                const data = await response.json();
                const sortedParticipants = data.participants
                    .sort((a, b) => {
                    if (b.score !== a.score)
                        return b.score - a.score;
                    return a.totalAnswerTime - b.totalAnswerTime;
                })
                    .map((participant, index) => ({
                    ...participant,
                    rank: index + 1,
                }));
                setParticipants(sortedParticipants);
                setError(null);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [eventId, apiBaseUrl]);
    const exportToCSV = () => {
        const headers = ['Rank', 'Name', 'Score', 'Time (seconds)'];
        const rows = participants.map(p => [
            p.rank,
            p.name,
            p.score,
            (p.totalAnswerTime / 1000).toFixed(2)
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventName.replace(/\s+/g, '_')}_results.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 pb-8", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" }), _jsx("p", { className: "text-white mt-4", children: "Loading results..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 pb-8", children: _jsx("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-lg p-6", children: _jsx("p", { className: "text-white", children: error }) }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 pb-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "inline-flex items-center text-white/80 hover:text-white mb-4 text-sm font-medium transition-colors", children: "\u2190 Back to Dashboard" }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-white mb-2", children: "Quiz Results" }), _jsxs("p", { className: "text-white/80", children: ["Event: ", _jsx("span", { className: "font-semibold", children: eventName })] })] }), _jsxs("button", { onClick: exportToCSV, disabled: participants.length === 0, className: "inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white font-medium transition-colors", children: [_jsx("span", { children: "\uD83D\uDCE5" }), "Export CSV"] })] })] }), participants.length > 0 ? (_jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-white/20 bg-white/5", children: [_jsx("th", { className: "px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider", children: "Rank" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider", children: "Participant" }), _jsx("th", { className: "px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider", children: "Score" }), _jsx("th", { className: "px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider", children: "Time (seconds)" })] }) }), _jsx("tbody", { className: "divide-y divide-white/10", children: participants.map((participant) => (_jsxs("tr", { className: `transition-colors ${participant.rank <= 3
                                        ? 'bg-white/5 hover:bg-white/10'
                                        : 'hover:bg-white/5'}`, children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "flex items-center gap-2", children: getRankIcon(participant.rank) ? (_jsx("span", { className: "text-2xl", children: getRankIcon(participant.rank) })) : (_jsxs("span", { className: "text-lg font-semibold text-white", children: ["#", participant.rank] })) }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "text-base font-medium text-white", children: participant.name }) }), _jsxs("td", { className: "px-6 py-4 text-right", children: [_jsx("span", { className: "text-xl font-bold text-white", children: participant.score }), _jsx("span", { className: "text-sm text-white/70 ml-1", children: "pts" })] }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("span", { className: "text-base text-white/90", children: [(participant.totalAnswerTime / 1000).toFixed(2), "s"] }) })] }, `${participant.name}-${participant.rank}`))) })] }) }) })) : (_jsx("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center", children: _jsx("p", { className: "text-white/80", children: "No participants joined this quiz" }) }))] }));
}
