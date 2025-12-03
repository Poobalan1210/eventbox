import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Confirmation dialog for starting a quiz
 * Displays Game PIN and join information
 */
import { useEffect, useState } from 'react';
export default function StartQuizConfirmation({ isOpen, eventId, eventName, questionCount, onConfirm, onCancel, isLoading = false, }) {
    const [gamePin, setGamePin] = useState('');
    const [joinLink, setJoinLink] = useState('');
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    useEffect(() => {
        if (isOpen && eventId) {
            // Fetch event details to get Game PIN
            fetch(`${apiBaseUrl}/events/${eventId}`)
                .then((res) => res.json())
                .then((data) => {
                setGamePin(data.gamePin || '');
                setJoinLink(`${frontendUrl}/join/${eventId}`);
            })
                .catch((err) => {
                console.error('Failed to fetch game PIN:', err);
            });
        }
    }, [isOpen, eventId, apiBaseUrl, frontendUrl]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-answer-green to-answer-blue rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDE80" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Ready to Start Quiz?" }), _jsx("p", { className: "text-gray-600", children: eventName })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCDD" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 font-medium", children: "Questions" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: questionCount })] })] }), gamePin && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDFAF" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 font-medium", children: "Game PIN" }), _jsx("p", { className: "text-2xl font-bold text-kahoot-purple tracking-wider", children: gamePin })] })] }))] }), joinLink && (_jsxs("div", { className: "bg-white/80 rounded-lg p-3 border border-purple-200", children: [_jsx("p", { className: "text-xs text-gray-600 font-medium mb-1", children: "Participants can join at:" }), _jsx("p", { className: "text-sm font-mono text-kahoot-purple break-all", children: joinLink })] }))] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6", children: [_jsxs("p", { className: "text-sm text-gray-700 font-semibold mb-3 flex items-center gap-2", children: [_jsx("span", { children: "\u26A1" }), "What happens next:"] }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-2", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-answer-green font-bold mt-0.5", children: "\u2713" }), _jsxs("span", { children: ["Quiz transitions to ", _jsx("strong", { children: "Live Mode" })] })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-answer-green font-bold mt-0.5", children: "\u2713" }), _jsx("span", { children: "Participants can join using the Game PIN" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-answer-green font-bold mt-0.5", children: "\u2713" }), _jsx("span", { children: "You'll control when to show each question" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-answer-red font-bold mt-0.5", children: "\u26A0" }), _jsxs("span", { children: ["Questions ", _jsx("strong", { children: "cannot be edited" }), " once started"] })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onCancel, disabled: isLoading, className: "flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[48px] font-medium disabled:opacity-50 disabled:cursor-not-allowed", children: "Cancel" }), _jsx("button", { onClick: onConfirm, disabled: isLoading, className: "flex-1 px-6 py-3 bg-gradient-to-r from-answer-green to-answer-blue text-white rounded-lg hover:opacity-90 transition-all min-h-[48px] font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-5 w-5", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Starting..."] })) : ('🚀 Start Quiz') })] })] }) }));
}
