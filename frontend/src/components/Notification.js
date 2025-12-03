import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
export default function Notification({ type, message, onClose, duration = 5000, }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);
    const bgColor = {
        success: 'bg-answer-green',
        error: 'bg-answer-red',
        info: 'bg-answer-blue',
    }[type];
    const icon = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    }[type];
    return (_jsx("div", { className: `fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-white/30 backdrop-blur-sm animate-slide-in-right max-w-md`, role: "alert", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 rounded-full font-bold", children: icon }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: "text-sm font-medium", children: message }) }), _jsx("button", { onClick: onClose, className: "flex-shrink-0 text-white/80 hover:text-white transition-colors", "aria-label": "Close notification", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }) }));
}
