import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Component to display recently accessed quiz tabs
 * Helps users navigate between multiple quizzes they have open
 */
export default function ActiveQuizTabs() {
    const navigate = useNavigate();
    const [recentQuizzes, setRecentQuizzes] = useState([]);
    useEffect(() => {
        // Load recent quiz tabs from sessionStorage
        const loadRecentQuizzes = () => {
            const quizzes = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('nav_quiz_') && !key.includes('_lastView')) {
                    try {
                        const value = sessionStorage.getItem(key);
                        if (value) {
                            const quizInfo = JSON.parse(value);
                            const eventId = key.replace('nav_quiz_', '');
                            quizzes.push({ ...quizInfo, eventId });
                        }
                    }
                    catch (error) {
                        console.error('Failed to parse quiz info:', error);
                    }
                }
            }
            // Sort by last accessed (most recent first)
            quizzes.sort((a, b) => b.lastAccessed - a.lastAccessed);
            // Keep only the 5 most recent
            setRecentQuizzes(quizzes.slice(0, 5));
        };
        loadRecentQuizzes();
        // Refresh every 5 seconds to catch updates from other tabs
        const interval = setInterval(loadRecentQuizzes, 5000);
        return () => clearInterval(interval);
    }, []);
    if (recentQuizzes.length === 0) {
        return null;
    }
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'waiting':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'completed':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return '🔴 Live';
            case 'waiting':
                return '⏸️ Setup';
            case 'completed':
                return '✓ Done';
            default:
                return status;
        }
    };
    const formatLastAccessed = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60)
            return 'Just now';
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)}h ago`;
        return 'Earlier';
    };
    return (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6", children: [_jsxs("h3", { className: "text-white font-semibold mb-3 flex items-center", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCD1" }), "Recently Accessed Quizzes"] }), _jsx("div", { className: "space-y-2", children: recentQuizzes.map((quiz) => (_jsx("button", { onClick: () => navigate(`/organizer/${quiz.eventId}`), className: "w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 hover:border-white/20", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white font-medium truncate", children: quiz.name }), _jsxs("p", { className: "text-white/60 text-sm", children: [quiz.questionCount, " question", quiz.questionCount !== 1 ? 's' : '', " \u2022 ", formatLastAccessed(quiz.lastAccessed)] })] }), _jsx("span", { className: `ml-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(quiz.status)}`, children: getStatusLabel(quiz.status) })] }) }, quiz.eventId))) })] }));
}
