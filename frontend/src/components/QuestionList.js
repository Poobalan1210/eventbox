import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function QuestionList({ questions, eventId, onEdit, onDelete }) {
    const [deletingId, setDeletingId] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const handleDelete = async (questionId) => {
        if (!confirm('Are you sure you want to delete this question?')) {
            return;
        }
        setDeletingId(questionId);
        try {
            const response = await fetch(`${apiBaseUrl}/events/${eventId}/questions/${questionId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete question');
            }
            onDelete(questionId);
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete question');
        }
        finally {
            setDeletingId(null);
        }
    };
    if (questions.length === 0) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6 text-center", children: _jsx("p", { className: "text-gray-500", children: "No questions added yet. Add your first question above!" }) }));
    }
    return (_jsxs("div", { className: "bg-white shadow rounded-lg p-4 sm:p-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: ["Questions (", questions.length, ")"] }), _jsx("div", { className: "space-y-4", children: questions.map((question, index) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3", children: [_jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "flex-shrink-0 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-medium", children: index + 1 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-base font-medium text-gray-900 break-words", children: question.text }), _jsx("div", { className: "mt-2 space-y-1", children: question.options.map((option) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: `w-4 h-4 rounded-full border-2 flex-shrink-0 ${option.id === question.correctOptionId
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-gray-300'}` }), _jsx("span", { className: option.id === question.correctOptionId
                                                                    ? 'text-green-700 font-medium'
                                                                    : 'text-gray-600', children: option.text })] }, option.id))) }), question.timerSeconds && (_jsxs("p", { className: "mt-2 text-sm text-gray-500", children: ["\u23F1\uFE0F Timer: ", question.timerSeconds, " seconds"] }))] })] }) }), _jsxs("div", { className: "flex sm:flex-col gap-2 flex-shrink-0", children: [_jsx("button", { onClick: () => onEdit(question), className: "flex-1 sm:flex-none px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[44px] font-medium border border-blue-600", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(question.id), disabled: deletingId === question.id, className: "flex-1 sm:flex-none px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] font-medium border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed", children: deletingId === question.id ? 'Deleting...' : 'Delete' })] })] }) }, question.id))) })] }));
}
