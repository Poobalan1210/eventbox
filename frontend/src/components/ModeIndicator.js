import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MODE_CONFIGS = {
    draft: {
        label: 'Draft',
        icon: '📝',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300',
        description: 'Quiz is being created',
    },
    setup: {
        label: 'Setup Mode',
        icon: '🛠️',
        color: 'text-blue-700',
        bgColor: 'bg-answer-blue/20',
        borderColor: 'border-answer-blue',
        description: 'Add and configure questions',
    },
    live: {
        label: 'Live Mode',
        icon: '🔴',
        color: 'text-red-700',
        bgColor: 'bg-answer-red/20',
        borderColor: 'border-answer-red',
        description: 'Quiz is active',
    },
    completed: {
        label: 'Completed',
        icon: '✅',
        color: 'text-green-700',
        bgColor: 'bg-answer-green/20',
        borderColor: 'border-answer-green',
        description: 'Quiz has ended',
    },
    waiting: {
        label: 'Waiting',
        icon: '⏳',
        color: 'text-yellow-700',
        bgColor: 'bg-answer-yellow/20',
        borderColor: 'border-answer-yellow',
        description: 'Waiting for participants',
    },
    active: {
        label: 'Active',
        icon: '▶️',
        color: 'text-green-700',
        bgColor: 'bg-answer-green/20',
        borderColor: 'border-answer-green',
        description: 'Quiz in progress',
    },
};
export default function ModeIndicator({ status, className = '' }) {
    const config = MODE_CONFIGS[status] || MODE_CONFIGS.draft;
    return (_jsx("div", { className: `${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 ${className}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [(status === 'live' || status === 'active') && (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-3 h-3 bg-answer-red rounded-full animate-pulse" }), _jsx("div", { className: "absolute inset-0 w-3 h-3 bg-answer-red rounded-full animate-ping opacity-75" })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: config.icon }), _jsxs("div", { children: [_jsx("p", { className: `font-bold ${config.color}`, children: config.label }), _jsx("p", { className: "text-sm text-gray-600", children: config.description })] })] })] }) }));
}
