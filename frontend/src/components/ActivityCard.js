import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function ActivityCard({ activity, isActive, onActivate, onDeactivate, onEdit, onDelete, onViewResults, }) {
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
    const getActivityTypeLabel = (type) => {
        switch (type) {
            case 'quiz':
                return 'Quiz';
            case 'poll':
                return 'Poll';
            case 'raffle':
                return 'Raffle';
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", children: "\uD83D\uDCDD Draft" }));
            case 'ready':
                return (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: "\u2713 Ready" }));
            case 'active':
                return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx("span", { className: "w-2 h-2 mr-1.5 rounded-full bg-green-600 animate-pulse" }), "Active"] }));
            case 'completed':
                return (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800", children: "\u2713 Completed" }));
        }
    };
    const getActivityDetails = () => {
        switch (activity.type) {
            case 'quiz':
                return (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: [activity.questions?.length || 0, " questions"] }), activity.scoringEnabled && _jsx("p", { className: "text-xs", children: "\u2022 Scoring enabled" }), activity.speedBonusEnabled && _jsx("p", { className: "text-xs", children: "\u2022 Speed bonus" }), activity.streakTrackingEnabled && _jsx("p", { className: "text-xs", children: "\u2022 Streak tracking" })] }));
            case 'poll':
                return (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { className: "truncate", children: activity.question || 'No question set' }), _jsxs("p", { className: "text-xs", children: [activity.options?.length || 0, " options"] }), activity.showResultsLive && _jsx("p", { className: "text-xs", children: "\u2022 Live results" })] }));
            case 'raffle':
                return (_jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("p", { className: "truncate", children: activity.prizeDescription || 'No prize set' }), _jsxs("p", { className: "text-xs", children: [activity.winnerCount, " winner(s)"] }), _jsxs("p", { className: "text-xs capitalize", children: ["\u2022 ", activity.entryMethod, " entry"] })] }));
        }
    };
    const handleActivate = (e) => {
        e.stopPropagation();
        onActivate(activity.activityId);
    };
    const handleDeactivate = (e) => {
        e.stopPropagation();
        onDeactivate(activity.activityId);
    };
    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(activity.activityId);
    };
    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${activity.name}"?`)) {
            onDelete(activity.activityId);
        }
    };
    const handleViewResults = (e) => {
        e.stopPropagation();
        if (onViewResults) {
            onViewResults(activity.activityId);
        }
    };
    const canActivate = activity.status === 'ready' && !isActive;
    const canDeactivate = isActive;
    const canViewResults = activity.status === 'completed' && onViewResults;
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-2 ${isActive
            ? 'border-green-400 shadow-green-200'
            : 'border-gray-200 hover:border-blue-300'}`, children: [isActive && (_jsx("div", { className: "h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse" })), _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx("span", { className: "text-2xl flex-shrink-0", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 truncate", children: activity.name }), _jsx("p", { className: "text-sm text-gray-500", children: getActivityTypeLabel(activity.type) })] })] }), _jsx("div", { className: "ml-2 flex-shrink-0", children: getStatusBadge(activity.status) })] }), _jsx("div", { className: "mb-4", children: getActivityDetails() }), _jsxs("div", { className: "flex gap-2", children: [canActivate && (_jsx("button", { onClick: handleActivate, className: "flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors", children: "\u25B6\uFE0F Activate" })), canDeactivate && (_jsx("button", { onClick: handleDeactivate, className: "flex-1 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors", children: "\u23F8\uFE0F Deactivate" })), canViewResults && (_jsx("button", { onClick: handleViewResults, className: "flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors", children: "\uD83D\uDCCA View Results" })), !isActive && activity.status !== 'completed' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: handleEdit, className: "flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors", children: "\u270F\uFE0F Edit" }), _jsx("button", { onClick: handleDelete, className: "px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors", title: "Delete activity", children: "\uD83D\uDDD1\uFE0F" })] }))] }), _jsxs("div", { className: "mt-3 text-xs text-gray-400", children: ["Order: ", activity.order] })] })] }));
}
