import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacySelector from '../components/PrivacySelector';
export default function CreateEvent() {
    const navigate = useNavigate();
    const [eventName, setEventName] = useState('');
    const [visibility, setVisibility] = useState('private');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [createdEvent, setCreatedEvent] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedPin, setCopiedPin] = useState(false);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // For demo purposes, using a hardcoded organizerId
    // In production, this would come from authentication context
    const organizerId = 'demo-organizer-123';
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            // Create a blank event
            const response = await fetch(`${apiBaseUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: eventName,
                    visibility: visibility,
                    organizerId: organizerId,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create event');
            }
            const data = await response.json();
            setCreatedEvent(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCopyLink = async () => {
        if (createdEvent) {
            try {
                await navigator.clipboard.writeText(createdEvent.joinLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
            catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };
    const handleCopyPin = async () => {
        if (createdEvent) {
            try {
                await navigator.clipboard.writeText(createdEvent.gamePin);
                setCopiedPin(true);
                setTimeout(() => setCopiedPin(false), 2000);
            }
            catch (err) {
                console.error('Failed to copy PIN:', err);
            }
        }
    };
    const handleGoToSetup = () => {
        if (createdEvent) {
            // Navigate to event activities management
            navigate(`/events/${createdEvent.eventId}/activities`);
        }
    };
    if (createdEvent) {
        return (_jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6", children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-white mb-6 text-center", children: "\uD83C\uDF89 Event Created!" }), _jsxs("div", { className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 border border-white/20", children: [_jsxs("div", { className: "bg-answer-yellow/20 border-3 border-answer-yellow rounded-2xl p-8 pulse-glow", children: [_jsx("label", { className: "block text-lg font-bold text-white mb-4 text-center", children: "\uD83C\uDFAF Game PIN" }), _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "text-6xl sm:text-7xl font-bold text-white tracking-widest animate-pulse", children: createdEvent.gamePin }), _jsx("button", { onClick: handleCopyPin, className: "px-8 py-3 bg-white text-kahoot-purple rounded-xl hover:bg-answer-yellow hover:text-white transition-all min-h-[44px] font-bold text-lg shadow-lg transform hover:scale-105 active:scale-95", children: copiedPin ? '✓ Copied!' : '📋 Copy PIN' }), _jsx("p", { className: "text-base text-white/90 text-center font-medium", children: "Participants can use this PIN to join quickly" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-base font-bold text-white mb-3", children: "\uD83D\uDD17 Or share this link:" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("input", { type: "text", readOnly: true, value: createdEvent.joinLink, className: "flex-1 px-4 py-3 border-2 border-white/30 rounded-xl bg-white/10 text-white text-sm sm:text-base font-medium backdrop-blur-sm" }), _jsx("button", { onClick: handleCopyLink, className: "px-6 py-3 bg-answer-blue text-white rounded-xl hover:bg-answer-blue/80 transition-all min-h-[44px] font-bold shadow-lg transform hover:scale-105 active:scale-95", children: copied ? '✓ Copied!' : '📋 Copy' })] })] }), _jsxs("div", { className: "flex flex-col items-center bg-white/10 rounded-2xl p-6 border border-white/20", children: [_jsx("label", { className: "block text-base font-bold text-white mb-4", children: "\uD83D\uDCF1 Or scan this QR code:" }), _jsx("div", { className: "bg-white p-4 rounded-xl shadow-xl", children: _jsx("img", { src: createdEvent.qrCode, alt: "Event QR Code", className: "w-48 h-48 sm:w-64 sm:h-64" }) })] }), _jsx("div", { className: "pt-4", children: _jsx("button", { onClick: handleGoToSetup, className: "w-full px-8 py-4 bg-answer-green text-white rounded-xl hover:bg-answer-green/80 transition-all min-h-[56px] font-bold text-xl shadow-lg transform hover:scale-105 active:scale-95", children: "\uD83C\uDFAF Manage Event Activities" }) })] })] }));
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6", children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-white mb-6 text-center", children: "\uD83C\uDFAF Create Event" }), _jsx("div", { className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 border border-white/20", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "eventName", className: "block text-lg font-bold text-white mb-3", children: "Event Name" }), _jsx("input", { type: "text", id: "eventName", value: eventName, onChange: (e) => setEventName(e.target.value), required: true, placeholder: "Enter event name", className: "w-full px-5 py-4 border-2 border-white/30 rounded-xl bg-white/10 text-white placeholder-white/50 focus:ring-4 focus:ring-answer-yellow/50 focus:border-answer-yellow min-h-[56px] text-lg font-medium backdrop-blur-sm transition-all", disabled: isLoading })] }), _jsx(PrivacySelector, { value: visibility, onChange: setVisibility, disabled: isLoading }), error && (_jsx("div", { className: "p-4 bg-answer-red/20 border-2 border-answer-red rounded-xl backdrop-blur-sm", children: _jsxs("p", { className: "text-base text-white font-medium", children: ["\u274C ", error] }) })), _jsx("button", { type: "submit", disabled: isLoading || !eventName.trim(), className: "w-full px-8 py-4 bg-white text-kahoot-purple rounded-xl hover:bg-answer-yellow hover:text-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed transition-all min-h-[56px] font-bold text-xl shadow-lg transform hover:scale-105 active:scale-95", children: isLoading ? '⏳ Creating Event...' : '🚀 Create Event' })] }) })] }));
}
