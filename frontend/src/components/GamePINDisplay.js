import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function GamePINDisplay({ eventId }) {
    const [gamePin, setGamePin] = useState(null);
    const [copied, setCopied] = useState(false);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
                if (response.ok) {
                    const data = await response.json();
                    // The gamePin might be in the event data if the backend returns it
                    // For now, we'll need to fetch it separately or include it in the event response
                    // Since we're updating the backend to include it, let's check if it exists
                    if (data.gamePin) {
                        setGamePin(data.gamePin);
                    }
                }
            }
            catch (error) {
                console.error('Error fetching game PIN:', error);
            }
        };
        fetchEventDetails();
    }, [eventId, apiBaseUrl]);
    const handleCopyPin = async () => {
        if (gamePin) {
            try {
                await navigator.clipboard.writeText(gamePin);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
            catch (err) {
                console.error('Failed to copy PIN:', err);
            }
        }
    };
    if (!gamePin) {
        return null; // Don't show anything if no game PIN
    }
    return (_jsx("div", { className: "bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 sm:p-6 mb-6", children: _jsx("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-sm font-medium text-gray-700 mb-2", children: "Game PIN" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-4xl sm:text-5xl font-bold text-indigo-600 tracking-widest", children: gamePin }), _jsx("button", { onClick: handleCopyPin, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]", children: copied ? 'Copied!' : 'Copy' })] }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: "Share this PIN with participants for quick access" })] }) }) }));
}
