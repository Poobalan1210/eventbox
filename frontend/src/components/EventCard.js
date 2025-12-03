import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function EventCard({ event, onSelect, onDelete }) {
    const getStatusBadge = () => {
        switch (event.status) {
            case 'draft':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700", children: "\uD83D\uDCDD Draft" }));
            case 'setup':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700", children: "\u2699\uFE0F Setup" }));
            case 'live':
                return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700", children: [_jsx("span", { className: "w-1.5 h-1.5 mr-1 rounded-full bg-green-600 animate-pulse" }), "Live"] }));
            case 'completed':
                return (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700", children: "\u2713 Completed" }));
            default:
                return null;
        }
    };
    const getVisibilityBadge = () => {
        if (!event.visibility)
            return null;
        return event.visibility === 'private' ? (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700", children: "\uD83D\uDD12 Private" })) : (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700", children: "\uD83C\uDF10 Public" }));
    };
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(event.eventId);
    };
    return (_jsxs("div", { onClick: () => onSelect(event.eventId), className: "bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer border-2 border-transparent hover:border-answer-yellow shadow-lg", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-xl font-bold text-white truncate mb-2", children: event.name }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [getStatusBadge(), getVisibilityBadge()] })] }) }), event.gamePin && (_jsxs("div", { className: "mb-4 p-3 bg-white/10 rounded-lg", children: [_jsx("p", { className: "text-white/70 text-xs mb-1", children: "Join Code" }), _jsx("p", { className: "text-white font-mono font-bold text-lg", children: event.gamePin })] })), event.activeActivityName && (_jsx("div", { className: "mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-green-400 animate-pulse" }), _jsxs("p", { className: "text-green-100 text-sm font-medium", children: ["Active: ", event.activeActivityName] })] }) })), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white/70 text-xs mb-1", children: "Activities" }), _jsx("p", { className: "text-white font-semibold text-lg", children: event.activityCount || 0 })] }), _jsxs("div", { children: [_jsx("p", { className: "text-white/70 text-xs mb-1", children: "Participants" }), _jsx("p", { className: "text-white font-semibold text-lg", children: event.participantCount || 0 })] })] }), event.topic && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-white/70 text-xs", children: "Topic" }), _jsx("p", { className: "text-white text-sm", children: event.topic })] })), event.description && (_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-white/70 text-xs", children: "Description" }), _jsx("p", { className: "text-white text-sm line-clamp-2", children: event.description })] })), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-white/10", children: [_jsxs("div", { className: "text-white/60 text-xs", children: ["Created ", formatDate(event.createdAt)] }), _jsx("button", { onClick: handleDelete, className: "text-answer-red hover:text-answer-red/80 transition-colors text-sm font-medium", children: "\uD83D\uDDD1\uFE0F Delete" })] })] }));
}
