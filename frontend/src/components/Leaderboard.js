import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { leaderboardItemVariants } from '../constants/animations';
export default function Leaderboard({ participants, showTime = false, title = 'Leaderboard', subtitle, }) {
    if (participants.length === 0) {
        return (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: title }), _jsx("p", { className: "text-white/70 text-center py-4", children: "No participants yet \uD83C\uDFAF" })] }));
    }
    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return 'bg-answer-yellow/30 text-white border-answer-yellow shadow-lg shadow-answer-yellow/30';
            case 2:
                return 'bg-white/20 text-white border-white/50 shadow-lg';
            case 3:
                return 'bg-answer-red/30 text-white border-answer-red shadow-lg shadow-answer-red/30';
            default:
                return 'bg-white/10 text-white border-white/20';
        }
    };
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '';
        }
    };
    return (_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("h2", { className: "text-2xl sm:text-3xl font-bold text-white flex items-center gap-2", children: ["\uD83C\uDFC6 ", title] }), subtitle && (_jsx("p", { className: "text-sm sm:text-base text-white/80 mt-2", children: subtitle }))] }), _jsx("div", { className: "space-y-3", children: _jsx(AnimatePresence, { mode: "popLayout", children: participants.map((participant, index) => (_jsxs(motion.div, { custom: index, variants: leaderboardItemVariants, initial: "hidden", animate: "visible", exit: { opacity: 0, x: -20 }, layout: true, transition: {
                            layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        }, className: `flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all backdrop-blur-sm ${getRankColor(participant.rank)} ${participant.rank <= 3 ? 'playful-hover' : ''}`, children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [_jsx("div", { className: "flex-shrink-0 w-10 sm:w-12 text-center", children: _jsx("span", { className: "text-2xl sm:text-3xl font-bold", children: getRankIcon(participant.rank) || `#${participant.rank}` }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-bold text-white truncate text-base sm:text-lg", children: participant.name }), showTime && (_jsxs("p", { className: "text-xs sm:text-sm text-white/70 mt-1", children: ["\u23F1\uFE0F Time: ", (participant.totalAnswerTime / 1000).toFixed(2), "s"] }))] })] }), _jsxs("div", { className: "flex-shrink-0 ml-2", children: [_jsx("span", { className: "text-xl sm:text-2xl font-bold text-white", children: participant.score }), _jsx("span", { className: "text-sm sm:text-base text-white/70 ml-1", children: "pts" })] })] }, `${participant.name}-${participant.rank}`))) }) })] }));
}
