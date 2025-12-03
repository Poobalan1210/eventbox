import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AnswerStatisticsChart Component
 *
 * Displays a bar chart visualization of answer distribution after a question ends.
 * Shows the count and percentage of participants who selected each option,
 * with the correct answer highlighted.
 *
 * Requirements: 14.3, 14.4, 20.2
 */
import { motion } from 'framer-motion';
export default function AnswerStatisticsChart({ statistics, question, }) {
    // Find the maximum count to scale bars appropriately
    const maxCount = Math.max(...Object.values(statistics.optionCounts).map(opt => opt.count), 1 // Ensure at least 1 to avoid division by zero
    );
    return (_jsxs("div", { className: "w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800 mb-4 text-center", children: "Answer Distribution" }), _jsx("div", { className: "space-y-3", children: question.options.map(option => {
                    const optionStats = statistics.optionCounts[option.id] || {
                        count: 0,
                        percentage: 0,
                    };
                    const isCorrect = option.id === statistics.correctOptionId;
                    const barWidth = maxCount > 0 ? (optionStats.count / maxCount) * 100 : 0;
                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `font-medium ${isCorrect ? 'text-green-700' : 'text-gray-700'}`, children: option.text }), isCorrect && (_jsx("span", { className: "text-green-600 font-bold text-xs bg-green-100 px-2 py-0.5 rounded", children: "\u2713 Correct" }))] }), _jsxs("span", { className: "text-gray-600 font-medium", children: [optionStats.count, " (", optionStats.percentage.toFixed(1), "%)"] })] }), _jsx("div", { className: "relative h-8 bg-gray-200 rounded-full overflow-hidden", children: _jsx(motion.div, { className: `h-full rounded-full ${isCorrect
                                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                                        : 'bg-gradient-to-r from-blue-400 to-blue-600'}`, initial: { width: 0 }, animate: { width: `${barWidth}%` }, transition: {
                                        duration: 0.8,
                                        ease: 'easeOut',
                                    } }) })] }, option.id));
                }) }), _jsxs("div", { className: "mt-4 text-center text-sm text-gray-600", children: ["Total Responses: ", statistics.totalResponses] })] }));
}
