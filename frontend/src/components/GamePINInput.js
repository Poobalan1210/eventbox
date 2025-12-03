import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function GamePINInput({ onSubmit }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const validatePinFormat = (value) => {
        return /^\d{6}$/.test(value);
    };
    const handleInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 6) {
            setPin(value);
            setError('');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Validate PIN format
        if (!validatePinFormat(pin)) {
            setError('Please enter a valid 6-digit PIN');
            return;
        }
        setIsLoading(true);
        try {
            // Call the API to lookup event by PIN
            const response = await fetch(`${apiBaseUrl}/events/by-pin/${pin}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError('Invalid PIN. Please check and try again.');
                }
                else {
                    setError('An error occurred. Please try again.');
                }
                setIsLoading(false);
                return;
            }
            const data = await response.json();
            // Call the onSubmit callback if provided
            if (onSubmit) {
                onSubmit(pin);
            }
            // Navigate to the event join page
            navigate(`/join/${data.eventId}`);
        }
        catch (err) {
            console.error('Error looking up game PIN:', err);
            setError('Unable to connect. Please try again.');
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "w-full max-w-md mx-auto", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "gamePin", className: "block text-lg font-bold text-white mb-3 text-center", children: "\uD83C\uDFAF Enter Game PIN" }), _jsx("input", { type: "text", id: "gamePin", value: pin, onChange: handleInputChange, placeholder: "000000", maxLength: 6, className: "w-full px-6 py-5 text-center text-4xl font-bold tracking-widest border-3 border-white/30 rounded-2xl bg-white/10 text-white placeholder-white/30 focus:ring-4 focus:ring-answer-yellow/50 focus:border-answer-yellow transition-all backdrop-blur-sm shadow-lg", disabled: isLoading, autoComplete: "off", inputMode: "numeric", pattern: "\\d{6}" }), _jsx("p", { className: "mt-3 text-base text-white/80 text-center font-medium", children: "Enter the 6-digit code shown by the organizer" })] }), error && (_jsx("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-xl p-4 backdrop-blur-sm", children: _jsxs("p", { className: "text-base text-white font-medium text-center", children: ["\u274C ", error] }) })), _jsx("button", { type: "submit", disabled: pin.length !== 6 || isLoading, className: "w-full px-8 py-4 text-xl font-bold rounded-xl text-kahoot-purple bg-white hover:bg-answer-yellow hover:text-white focus:outline-none focus:ring-4 focus:ring-answer-yellow/50 disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105 active:scale-95", style: { minHeight: '56px' }, children: isLoading ? '⏳ Looking up...' : '🚀 Join Event' })] }) }));
}
