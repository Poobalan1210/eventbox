import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function QuestionForm({ eventId, question, onSuccess, onCancel }) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const isEditing = !!question;
    const [questionText, setQuestionText] = useState(question?.text || '');
    const [options, setOptions] = useState(question?.options || [
        { id: crypto.randomUUID(), text: '', color: 'red', shape: 'triangle' },
        { id: crypto.randomUUID(), text: '', color: 'blue', shape: 'diamond' },
    ]);
    const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId || '');
    const [timerSeconds, setTimerSeconds] = useState(question?.timerSeconds?.toString() || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(question?.imageUrl || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleAddOption = () => {
        if (options.length < 5) {
            // Assign placeholder color and shape (backend will assign proper ones)
            const colorShapeMap = [
                { color: 'red', shape: 'triangle' },
                { color: 'blue', shape: 'diamond' },
                { color: 'yellow', shape: 'circle' },
                { color: 'green', shape: 'square' },
                { color: 'purple', shape: 'pentagon' },
            ];
            const style = colorShapeMap[options.length];
            setOptions([...options, { id: crypto.randomUUID(), text: '', ...style }]);
        }
    };
    const handleRemoveOption = (id) => {
        if (options.length > 2) {
            setOptions(options.filter((opt) => opt.id !== id));
            if (correctOptionId === id) {
                setCorrectOptionId('');
            }
        }
    };
    const handleOptionTextChange = (id, text) => {
        setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
    };
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid image format. Only JPEG, PNG, and GIF are supported');
            return;
        }
        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image file size exceeds 5MB limit');
            return;
        }
        setImageFile(file);
        setError(null);
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        // Validation
        if (!questionText.trim()) {
            setError('Question text is required');
            return;
        }
        if (options.length < 2 || options.length > 5) {
            setError('Must have between 2 and 5 answer options');
            return;
        }
        if (options.some((opt) => !opt.text.trim())) {
            setError('All answer options must have text');
            return;
        }
        if (!correctOptionId) {
            setError('Please select the correct answer');
            return;
        }
        const timerValue = timerSeconds ? parseInt(timerSeconds, 10) : undefined;
        if (timerSeconds && (isNaN(timerValue) || timerValue <= 0)) {
            setError('Timer must be a positive number');
            return;
        }
        setIsLoading(true);
        try {
            const url = isEditing
                ? `${apiBaseUrl}/events/${eventId}/questions/${question.id}`
                : `${apiBaseUrl}/events/${eventId}/questions`;
            const method = isEditing ? 'PUT' : 'POST';
            // For demo purposes, using a hardcoded organizerId
            // In production, this would come from authentication context
            const organizerId = 'demo-organizer-123';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-organizer-id': organizerId,
                },
                body: JSON.stringify({
                    text: questionText,
                    options,
                    correctOptionId,
                    timerSeconds: timerValue,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save question');
            }
            const responseData = await response.json();
            const questionId = isEditing ? question.id : responseData.questionId;
            // Upload image if one was selected
            if (imageFile && questionId) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const imageResponse = await fetch(`${apiBaseUrl}/events/${eventId}/questions/${questionId}/image`, {
                    method: 'POST',
                    headers: {
                        'x-organizer-id': organizerId,
                    },
                    body: formData,
                });
                if (!imageResponse.ok) {
                    const errorData = await imageResponse.json();
                    throw new Error(errorData.message || 'Failed to upload image');
                }
            }
            // Reset form if creating new question
            if (!isEditing) {
                setQuestionText('');
                setOptions([
                    { id: crypto.randomUUID(), text: '', color: 'red', shape: 'triangle' },
                    { id: crypto.randomUUID(), text: '', color: 'blue', shape: 'diamond' },
                ]);
                setCorrectOptionId('');
                setTimerSeconds('');
                setImageFile(null);
                setImagePreview(null);
            }
            onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "bg-white shadow rounded-lg p-4 sm:p-6 space-y-6 text-gray-900", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: isEditing ? 'Edit Question' : 'Add New Question' }), _jsxs("div", { children: [_jsx("label", { htmlFor: "questionText", className: "block text-sm font-medium text-gray-700 mb-2", children: "Question Text" }), _jsx("textarea", { id: "questionText", value: questionText, onChange: (e) => setQuestionText(e.target.value), required: true, rows: 3, placeholder: "Enter your question", className: "w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "questionImage", className: "block text-sm font-medium text-gray-700 mb-2", children: "Question Image - Optional" }), _jsxs("div", { className: "space-y-3", children: [imagePreview ? (_jsxs("div", { className: "relative inline-block", children: [_jsx("img", { src: imagePreview, alt: "Question preview", className: "max-w-full h-auto max-h-64 rounded-md border border-gray-300" }), _jsx("button", { type: "button", onClick: handleRemoveImage, className: "absolute top-2 right-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", disabled: isLoading, "aria-label": "Remove image", children: "\u2715" })] })) : (_jsx("input", { type: "file", id: "questionImage", accept: "image/jpeg,image/png,image/gif", onChange: handleImageChange, className: "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:min-h-[44px]", disabled: isLoading })), _jsx("p", { className: "text-sm text-gray-500", children: "Supported formats: JPEG, PNG, GIF. Max size: 5MB" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Answer Options (2-5 options)" }), _jsx("div", { className: "space-y-3", children: options.map((option, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", id: `correct-${option.id}`, name: "correctAnswer", checked: correctOptionId === option.id, onChange: () => setCorrectOptionId(option.id), className: "w-5 h-5 text-blue-600 focus:ring-blue-500 flex-shrink-0", disabled: isLoading }), _jsx("input", { type: "text", value: option.text, onChange: (e) => handleOptionTextChange(option.id, e.target.value), placeholder: `Option ${index + 1}`, className: "flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base", disabled: isLoading }), options.length > 2 && (_jsx("button", { type: "button", onClick: () => handleRemoveOption(option.id), className: "px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", disabled: isLoading, "aria-label": "Remove option", children: "\u2715" }))] }, option.id))) }), options.length < 5 && (_jsx("button", { type: "button", onClick: handleAddOption, className: "mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[44px] font-medium", disabled: isLoading, children: "+ Add Option" })), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Select the radio button next to the correct answer" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "timerSeconds", className: "block text-sm font-medium text-gray-700 mb-2", children: "Timer (seconds) - Optional" }), _jsx("input", { type: "number", id: "timerSeconds", value: timerSeconds, onChange: (e) => setTimerSeconds(e.target.value), min: "1", placeholder: "Leave empty for no timer", className: "w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base", disabled: isLoading })] }), error && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-md", children: _jsx("p", { className: "text-sm text-red-600", children: error }) })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("button", { type: "submit", disabled: isLoading, className: "px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium", children: isLoading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question' }), isEditing && onCancel && (_jsx("button", { type: "button", onClick: onCancel, disabled: isLoading, className: "px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium", children: "Cancel" }))] })] }));
}
