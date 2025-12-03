import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WaitingForActivity Component
 *
 * Displays an engaging waiting state when no activity is currently active.
 * Shows event name, participant count, and a friendly message to participants.
 *
 * Requirements: 4.3, 6.1
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
export default function WaitingForActivity({ eventName, participantCount, participantName, message = 'Waiting for organizer to start an activity', }) {
    const [dots, setDots] = useState('');
    // Animated dots effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);
    return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3 }, className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-8 md:p-12 text-center border border-white/20", children: [_jsx(motion.div, { animate: {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }, transition: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }, className: "inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-blue-500/20 rounded-full mb-6", children: _jsx("svg", { className: "w-10 h-10 md:w-12 md:h-12 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), participantName && (_jsxs("h2", { className: "text-2xl md:text-3xl font-bold text-white mb-4", children: ["Welcome, ", participantName, "! \uD83D\uDC4B"] })), eventName && (_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm md:text-base text-white/70 mb-1", children: "Event" }), _jsx("p", { className: "text-xl md:text-2xl font-bold text-white", children: eventName })] })), participantCount !== undefined && participantCount > 0 && (_jsxs(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring', stiffness: 200 }, className: "inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6", children: [_jsx("svg", { className: "w-5 h-5 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" }) }), _jsxs("span", { className: "text-white font-semibold", children: [participantCount, " ", participantCount === 1 ? 'participant' : 'participants', " waiting"] })] })), _jsxs("p", { className: "text-lg md:text-xl text-white/90 mb-6", children: [message, _jsx("span", { className: "inline-block w-8 text-left", children: dots })] }), _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(motion.div, { animate: {
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }, transition: {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }, className: "w-3 h-3 bg-white/60 rounded-full" }), _jsx(motion.div, { animate: {
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }, transition: {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.2,
                                }, className: "w-3 h-3 bg-white/60 rounded-full" }), _jsx(motion.div, { animate: {
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }, transition: {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.4,
                                }, className: "w-3 h-3 bg-white/60 rounded-full" })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 }, className: "mt-8 pt-6 border-t border-white/20", children: _jsx("p", { className: "text-sm md:text-base text-white/70", children: "\uD83D\uDCA1 The organizer will start an activity soon. Stay tuned!" }) })] }) }));
}
