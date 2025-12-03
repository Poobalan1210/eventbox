import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export default function QuizCard({ quiz, onSelect, onDelete, onDuplicate }) {
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };
    const getStatusBadge = () => {
        switch (quiz.status) {
            case 'live':
                return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800", children: [_jsx("span", { className: "w-2 h-2 mr-1.5 rounded-full bg-red-600 animate-pulse" }), "Live"] }));
            case 'upcoming':
                return (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: "\uD83D\uDCC5 Upcoming" }));
            case 'completed':
                return (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", children: "\u2713 Completed" }));
        }
    };
    const getVisibilityIcon = () => {
        return quiz.visibility === 'public' ? (_jsx("span", { className: "text-gray-500", title: "Public", children: "\uD83C\uDF10" })) : (_jsx("span", { className: "text-gray-500", title: "Private", children: "\uD83D\uDD12" }));
    };
    const handleCardClick = () => {
        if (onSelect) {
            onSelect(quiz.eventId);
        }
    };
    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(quiz.eventId);
        }
    };
    const handleDuplicate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDuplicate) {
            onDuplicate(quiz.eventId);
        }
    };
    const isLive = quiz.status === 'live';
    return (_jsxs(Link, { to: `/organizer/${quiz.eventId}`, onClick: handleCardClick, className: `block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-2 ${isLive
            ? 'border-red-400 shadow-red-200 hover:border-red-500 animate-pulse-border'
            : 'border-gray-200 hover:border-blue-300'}`, children: [isLive && (_jsx("div", { className: "h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" })), _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: `text-lg font-semibold truncate mb-1 ${isLive ? 'text-red-600' : 'text-gray-900'}`, children: quiz.name }), quiz.topic && (_jsx("p", { className: "text-sm text-gray-600 truncate", children: quiz.topic }))] }), _jsx("div", { className: "ml-2 flex-shrink-0", children: getStatusBadge() })] }), quiz.description && (_jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: quiz.description })), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 mb-3", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDC65" }), _jsxs("span", { children: [quiz.participantCount, " participants"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [getVisibilityIcon(), _jsx("span", { className: "capitalize", children: quiz.visibility })] })] }), _jsxs("div", { className: "text-xs text-gray-500", children: [quiz.status === 'live' && quiz.startedAt && (_jsxs("p", { children: ["Started: ", formatTime(quiz.startedAt)] })), quiz.status === 'completed' && quiz.completedAt && (_jsxs("p", { children: ["Completed: ", formatDate(quiz.completedAt)] })), quiz.status === 'upcoming' && (_jsxs("p", { children: ["Created: ", formatDate(quiz.createdAt)] })), _jsxs("p", { className: "mt-1", children: ["Last modified: ", formatDate(quiz.lastModified)] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 flex gap-2", children: [_jsx("button", { onClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/organizer/${quiz.eventId}`;
                                }, className: "flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors", children: quiz.status === 'live' ? 'Manage' : quiz.status === 'upcoming' ? 'Edit' : 'View' }), onDuplicate && quiz.status === 'upcoming' && (_jsx("button", { onClick: handleDuplicate, className: "px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors", title: "Duplicate quiz", children: "\uD83D\uDCCB" })), onDelete && quiz.status === 'upcoming' && (_jsx("button", { onClick: handleDelete, className: "px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors", title: "Delete quiz", children: "\uD83D\uDDD1\uFE0F" }))] })] })] }));
}
