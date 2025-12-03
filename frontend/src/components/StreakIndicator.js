import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export default function StreakIndicator({ currentStreak }) {
    const hasStreak = currentStreak > 0;
    const isHighStreak = currentStreak >= 3;
    return (_jsx(AnimatePresence, { mode: "wait", children: hasStreak && (_jsxs(motion.div, { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0, opacity: 0 }, transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
            }, className: "flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg", children: [isHighStreak && (_jsx(motion.span, { className: "text-2xl", animate: {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                    }, transition: {
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                    }, children: "\uD83D\uDD25" })), _jsxs("div", { className: "flex flex-col items-center", children: [_jsx(motion.span, { initial: { y: -10, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "text-2xl font-bold", children: currentStreak }, currentStreak), _jsx("span", { className: "text-xs font-medium uppercase tracking-wide", children: "Streak" })] }), isHighStreak && (_jsx(motion.span, { className: "text-2xl", animate: {
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 10, 0],
                    }, transition: {
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                    }, children: "\uD83D\uDD25" }))] }, `streak-${currentStreak}`)) }));
}
