import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { podiumVariants } from '../constants/animations';
export default function PodiumDisplay({ topThree }) {
    if (topThree.length === 0) {
        return null;
    }
    // Podium heights (in rem units)
    const podiumHeights = {
        1: 16, // 1st place - tallest (center)
        2: 12, // 2nd place - medium (left)
        3: 8, // 3rd place - shortest (right)
    };
    // Podium colors
    const podiumColors = {
        1: 'bg-gradient-to-t from-yellow-400 to-yellow-300',
        2: 'bg-gradient-to-t from-gray-400 to-gray-300',
        3: 'bg-gradient-to-t from-orange-400 to-orange-300',
    };
    // Medal emojis
    const medals = {
        1: '🥇',
        2: '🥈',
        3: '🥉',
    };
    // Use centralized animation variants for consistency and performance
    // Confetti animation for 1st place
    const confettiVariants = {
        hidden: { opacity: 0, scale: 0 },
        visible: {
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
            y: [-20, -40, -60, -80],
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
            },
        },
    };
    // Arrange participants in podium order: 2nd (left), 1st (center), 3rd (right)
    const podiumOrder = [
        topThree.find(p => p.rank === 2), // Left
        topThree.find(p => p.rank === 1), // Center
        topThree.find(p => p.rank === 3), // Right
    ].filter(Boolean);
    // Animation delays: 2nd, 3rd, then 1st (for dramatic effect)
    const getAnimationDelay = (rank) => {
        if (rank === 1)
            return 2; // Last to appear
        if (rank === 2)
            return 0; // First to appear
        if (rank === 3)
            return 1; // Second to appear
        return 0;
    };
    return (_jsxs("div", { className: "w-full max-w-4xl mx-auto px-4 py-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "text-center mb-8", children: [_jsx("h2", { className: "text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg", children: "\uD83C\uDF89 Top Performers \uD83C\uDF89" }), _jsx("p", { className: "text-base sm:text-lg text-white/90 drop-shadow", children: "Congratulations to our winners!" })] }), _jsx("div", { className: "flex items-end justify-center gap-2 sm:gap-4 md:gap-6 mb-8", children: podiumOrder.map((participant) => {
                    const rank = participant.rank;
                    const height = podiumHeights[rank];
                    const color = podiumColors[rank];
                    const medal = medals[rank];
                    const animationDelay = getAnimationDelay(rank);
                    return (_jsxs(motion.div, { custom: animationDelay, variants: podiumVariants, initial: "hidden", animate: "visible", className: "flex flex-col items-center", style: { flex: '1', maxWidth: '200px' }, children: [_jsxs("div", { className: "mb-4 text-center", children: [_jsx(motion.div, { initial: { scale: 0, rotate: -180 }, animate: { scale: 1, rotate: 0 }, transition: {
                                            delay: animationDelay * 0.3 + 0.4,
                                            duration: 0.5,
                                            type: 'spring',
                                            stiffness: 200,
                                        }, className: "text-4xl sm:text-5xl md:text-6xl mb-2", children: medal }), _jsx("p", { className: "font-bold text-sm sm:text-base md:text-lg text-white mb-1 truncate px-2 drop-shadow-lg", children: participant.name }), _jsxs("p", { className: "text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg", children: [participant.score, _jsx("span", { className: "text-xs sm:text-sm text-white/80 ml-1", children: "pts" })] }), rank === 1 && (_jsx("div", { className: "relative", children: [...Array(5)].map((_, i) => (_jsx(motion.div, { variants: confettiVariants, initial: "hidden", animate: "visible", className: "absolute text-2xl", style: {
                                                left: `${(i - 2) * 20}px`,
                                                top: '-10px',
                                            }, children: ['🎊', '🎉', '⭐', '✨', '🌟'][i] }, i))) }))] }), _jsxs("div", { className: `w-full ${color} rounded-t-lg border-2 border-gray-400 shadow-lg flex items-center justify-center relative overflow-hidden`, style: { height: `${height}rem` }, children: [_jsx("div", { className: "text-4xl sm:text-5xl md:text-6xl font-bold text-white opacity-30", children: rank }), _jsx(motion.div, { initial: { x: '-100%' }, animate: { x: '200%' }, transition: {
                                            delay: animationDelay * 0.3 + 0.6,
                                            duration: 1,
                                            ease: 'easeInOut',
                                        }, className: "absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30", style: { width: '50%' } })] })] }, participant.name));
                }) }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 2.5, duration: 0.5 }, className: "text-center", children: _jsx("p", { className: "text-base sm:text-lg text-white font-medium drop-shadow", children: "Amazing performance! \uD83C\uDF8A" }) })] }));
}
