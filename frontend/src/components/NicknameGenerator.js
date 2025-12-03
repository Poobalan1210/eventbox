import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * NicknameGenerator Component
 * Displays nickname suggestions and allows custom name input
 */
import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
export const NicknameGenerator = ({ onSelectName, }) => {
    const { socket, emit, on } = useWebSocket();
    const [suggestions, setSuggestions] = useState([]);
    const [customName, setCustomName] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);
    // Request initial suggestions when component mounts
    useEffect(() => {
        if (socket) {
            requestSuggestions();
        }
    }, [socket]);
    // Listen for nickname suggestions
    useEffect(() => {
        if (!socket)
            return;
        const unsubscribe = on('nickname-suggestions', (payload) => {
            setSuggestions(payload.suggestions);
        });
        return unsubscribe;
    }, [socket, on]);
    const requestSuggestions = () => {
        emit('get-nickname-suggestions', { count: 3 });
    };
    const handleSuggestionClick = (suggestion) => {
        onSelectName(suggestion);
    };
    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (customName.trim().length > 0) {
            onSelectName(customName.trim());
        }
    };
    const handleRefresh = () => {
        requestSuggestions();
    };
    return (_jsx("div", { className: "w-full max-w-md mx-auto", children: !isCustomMode ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Choose a nickname" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Pick one of these fun suggestions or create your own" })] }), _jsx("div", { className: "space-y-2", children: suggestions.map((suggestion, index) => (_jsx("button", { onClick: () => handleSuggestionClick(suggestion), className: "w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 active:scale-95", children: suggestion }, `${suggestion}-${index}`))) }), _jsxs("button", { onClick: handleRefresh, className: "w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center gap-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }), "Refresh Suggestions"] }), _jsx("button", { onClick: () => setIsCustomMode(true), className: "w-full px-4 py-2 text-purple-600 font-medium hover:text-purple-700 transition-colors duration-200", children: "Or enter a custom name" })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-center", children: _jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Enter your name" }) }), _jsxs("form", { onSubmit: handleCustomSubmit, className: "space-y-4", children: [_jsx("input", { type: "text", value: customName, onChange: (e) => setCustomName(e.target.value), placeholder: "Your name", maxLength: 30, className: "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg", autoFocus: true }), _jsx("button", { type: "submit", disabled: customName.trim().length === 0, className: "w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100", children: "Continue" }), _jsx("button", { type: "button", onClick: () => setIsCustomMode(false), className: "w-full px-4 py-2 text-purple-600 font-medium hover:text-purple-700 transition-colors duration-200", children: "\u2190 Back to suggestions" })] })] })) }));
};
