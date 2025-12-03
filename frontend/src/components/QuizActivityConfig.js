import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
export default function QuizActivityConfig({ activity, onUpdate, onCancel, }) {
    const { colors } = useTheme();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // For demo purposes, using a hardcoded organizerId
    // In production, this would come from authentication context
    const organizerId = 'demo-organizer-123';
    // Quiz settings state
    const [scoringEnabled, setScoringEnabled] = useState(activity.scoringEnabled);
    const [speedBonusEnabled, setSpeedBonusEnabled] = useState(activity.speedBonusEnabled);
    const [streakTrackingEnabled, setStreakTrackingEnabled] = useState(activity.streakTrackingEnabled);
    // Questions state
    const [questions, setQuestions] = useState(activity.questions || []);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // Fetch questions when component mounts or activity changes
    useEffect(() => {
        fetchQuestions();
    }, [activity.activityId]);
    // Cleanup: restore body scroll when component unmounts
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && (isAddingQuestion || editingQuestion)) {
                handleCancelQuestionForm();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isAddingQuestion, editingQuestion]);
    const fetchQuestions = async () => {
        try {
            console.log('Fetching questions for activity:', activity.activityId);
            const response = await fetch(`${apiBaseUrl}/activities/${activity.activityId}`, {
                headers: {
                    'x-organizer-id': organizerId,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            const data = await response.json();
            console.log('Fetched activity data:', data);
            if (data.activity && data.activity.type === 'quiz') {
                console.log('Setting questions:', data.activity.questions);
                setQuestions(data.activity.questions || []);
            }
        }
        catch (err) {
            console.error('Error fetching questions:', err);
        }
    };
    const handleSaveSettings = async () => {
        console.log('Save Settings button clicked');
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const updateData = {
                scoringEnabled,
                speedBonusEnabled,
                streakTrackingEnabled,
            };
            const response = await fetch(`${apiBaseUrl}/activities/${activity.activityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-organizer-id': organizerId,
                },
                body: JSON.stringify(updateData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update settings');
            }
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            onUpdate();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleAddQuestion = () => {
        console.log('Add Question button clicked');
        setIsAddingQuestion(true);
        setEditingQuestion(null);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };
    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        setIsAddingQuestion(false);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };
    const handleCancelQuestionForm = () => {
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        // Restore body scroll when modal is closed
        document.body.style.overflow = 'unset';
    };
    const handleQuestionSuccess = () => {
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        // Restore body scroll when modal is closed
        document.body.style.overflow = 'unset';
        fetchQuestions();
        onUpdate();
    };
    const handleDeleteQuestion = async (questionId) => {
        if (!confirm('Are you sure you want to delete this question?')) {
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${activity.activityId}/questions/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'x-organizer-id': organizerId,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete question');
            }
            fetchQuestions();
            onUpdate();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete question');
        }
    };
    const canMarkReady = questions.length > 0;
    const handleMarkReady = async () => {
        console.log('Mark Ready button clicked');
        if (!canMarkReady) {
            alert('Please add at least one question before marking as ready');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${activity.activityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-organizer-id': organizerId,
                },
                body: JSON.stringify({ status: 'ready' }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark as ready');
            }
            setSuccessMessage('Activity marked as ready!');
            setTimeout(() => setSuccessMessage(null), 3000);
            onUpdate();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-lg shadow-md p-6 backdrop-blur-sm border", style: {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder
                }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", style: { color: colors.textPrimary }, children: "Configure Quiz Activity" }), _jsx("p", { className: "mt-1", style: { color: colors.textSecondary }, children: activity.name })] }), onCancel && (_jsx("button", { onClick: onCancel, className: "px-4 py-2 rounded-md transition-colors", style: { color: colors.textSecondary }, onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.color = colors.textPrimary;
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = colors.textSecondary;
                                }, children: "\u2190 Back" }))] }), error && (_jsx("div", { className: "mb-4 p-3 border rounded-md backdrop-blur-sm", style: {
                            backgroundColor: '#ef444420',
                            borderColor: '#ef4444'
                        }, children: _jsx("p", { className: "text-sm", style: { color: '#ef4444' }, children: error }) })), successMessage && (_jsx("div", { className: "mb-4 p-3 border rounded-md backdrop-blur-sm", style: {
                            backgroundColor: '#10b98120',
                            borderColor: '#10b981'
                        }, children: _jsx("p", { className: "text-sm", style: { color: '#10b981' }, children: successMessage }) })), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", style: { color: colors.textPrimary }, children: "Quiz Settings" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border", style: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderColor: colors.cardBorder
                                        }, onMouseEnter: (e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }, children: [_jsx("input", { type: "checkbox", checked: scoringEnabled, onChange: (e) => setScoringEnabled(e.target.checked), className: "w-5 h-5 rounded focus:ring-2", style: {
                                                    accentColor: colors.accent,
                                                    '--tw-ring-color': colors.accent + '80'
                                                } }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", style: { color: colors.textPrimary }, children: "Enable Scoring" }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Track participant scores and display leaderboard" })] })] }), _jsxs("label", { className: "flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border", style: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderColor: colors.cardBorder,
                                            opacity: !scoringEnabled ? 0.5 : 1
                                        }, onMouseEnter: (e) => {
                                            if (scoringEnabled) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                            }
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }, children: [_jsx("input", { type: "checkbox", checked: speedBonusEnabled, onChange: (e) => setSpeedBonusEnabled(e.target.checked), disabled: !scoringEnabled, className: "w-5 h-5 rounded focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed", style: {
                                                    accentColor: colors.accent,
                                                    '--tw-ring-color': colors.accent + '80'
                                                } }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", style: { color: colors.textPrimary }, children: "Speed Bonus" }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Award bonus points for faster correct answers" })] })] }), _jsxs("label", { className: "flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border", style: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderColor: colors.cardBorder,
                                            opacity: !scoringEnabled ? 0.5 : 1
                                        }, onMouseEnter: (e) => {
                                            if (scoringEnabled) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                            }
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }, children: [_jsx("input", { type: "checkbox", checked: streakTrackingEnabled, onChange: (e) => setStreakTrackingEnabled(e.target.checked), disabled: !scoringEnabled, className: "w-5 h-5 rounded focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed", style: {
                                                    accentColor: colors.accent,
                                                    '--tw-ring-color': colors.accent + '80'
                                                } }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", style: { color: colors.textPrimary }, children: "Streak Tracking" }), _jsx("div", { className: "text-sm", style: { color: colors.textSecondary }, children: "Track consecutive correct answers and award streak bonuses" })] })] })] }), _jsx("button", { type: "button", onClick: handleSaveSettings, disabled: isSaving, className: "w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed", style: {
                                    backgroundColor: isSaving ? 'rgba(128, 128, 128, 0.5)' : colors.accent,
                                    color: '#FFFFFF',
                                }, onMouseEnter: (e) => {
                                    if (!isSaving) {
                                        e.currentTarget.style.backgroundColor = colors.accent + 'CC';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!isSaving) {
                                        e.currentTarget.style.backgroundColor = colors.accent;
                                    }
                                }, children: isSaving ? 'Saving...' : 'Save Settings' })] })] }), _jsxs("div", { className: "rounded-lg shadow-md p-6 backdrop-blur-sm border", style: {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder
                }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold", style: { color: colors.textPrimary }, children: ["Questions (", questions.length, ")"] }), !isAddingQuestion && !editingQuestion && (_jsx("button", { type: "button", onClick: handleAddQuestion, className: "px-4 py-2 rounded-md transition-colors font-medium", style: { backgroundColor: colors.accent, color: '#FFFFFF' }, onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = colors.accent + 'CC';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = colors.accent;
                                }, children: "+ Add Question" }))] }), (isAddingQuestion || editingQuestion) && createPortal(_jsx("div", { style: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 10000,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px'
                        }, onClick: handleCancelQuestionForm, children: _jsx("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                width: '100%',
                                maxWidth: '896px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                position: 'relative',
                                zIndex: 10001
                            }, onClick: (e) => e.stopPropagation(), children: _jsx(QuestionFormWrapper, { activityId: activity.activityId, question: editingQuestion || undefined, onSuccess: handleQuestionSuccess, onCancel: handleCancelQuestionForm }) }) }), document.body), !isAddingQuestion && !editingQuestion && (_jsx(_Fragment, { children: questions.length === 0 ? (_jsx("div", { className: "text-center py-8", style: { color: colors.textSecondary }, children: _jsx("p", { children: "No questions added yet. Add your first question!" }) })) : (_jsx("div", { className: "space-y-3", children: questions.map((question, index) => (_jsx("div", { className: "border rounded-lg p-4 transition-colors backdrop-blur-sm", style: {
                                    borderColor: colors.cardBorder,
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.borderColor = colors.accent + '80';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.borderColor = colors.cardBorder;
                                }, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", style: {
                                                backgroundColor: colors.accent + '20',
                                                color: colors.accent
                                            }, children: index + 1 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-base font-medium break-words", style: { color: colors.textPrimary }, children: question.text }), _jsx("div", { className: "mt-2 space-y-1", children: question.options.map((option) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "w-4 h-4 rounded-full border-2 flex-shrink-0", style: {
                                                                    backgroundColor: option.id === question.correctOptionId ? '#10b981' : 'transparent',
                                                                    borderColor: option.id === question.correctOptionId ? '#10b981' : colors.cardBorder,
                                                                } }), _jsx("span", { style: {
                                                                    color: option.id === question.correctOptionId ? '#10b981' : colors.textSecondary,
                                                                    fontWeight: option.id === question.correctOptionId ? '500' : 'normal',
                                                                }, children: option.text })] }, option.id))) }), question.timerSeconds && (_jsxs("p", { className: "mt-2 text-sm", style: { color: colors.textSecondary }, children: ["\u23F1\uFE0F Timer: ", question.timerSeconds, " seconds"] }))] }), _jsxs("div", { className: "flex gap-2 flex-shrink-0", children: [_jsx("button", { type: "button", onClick: () => handleEditQuestion(question), className: "px-3 py-2 rounded-md transition-colors font-medium", style: { color: colors.accent }, onMouseEnter: (e) => {
                                                        e.currentTarget.style.backgroundColor = colors.accent + '20';
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }, children: "Edit" }), _jsx("button", { type: "button", onClick: () => handleDeleteQuestion(question.id), className: "px-3 py-2 rounded-md transition-colors font-medium", style: { color: '#ef4444' }, onMouseEnter: (e) => {
                                                        e.currentTarget.style.backgroundColor = '#ef444420';
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }, children: "Delete" })] })] }) }, question.id))) })) }))] }), activity.status === 'draft' && (_jsxs("div", { className: "rounded-lg shadow-md p-6 backdrop-blur-sm border", style: {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder
                }, children: [_jsx("h3", { className: "text-lg font-semibold mb-4", style: { color: colors.textPrimary }, children: "Ready to Go?" }), _jsx("p", { className: "mb-4", style: { color: colors.textSecondary }, children: "Once you've configured your quiz settings and added questions, mark this activity as ready to make it available for activation." }), _jsx("button", { type: "button", onClick: handleMarkReady, disabled: !canMarkReady, className: "w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed", style: {
                            backgroundColor: !canMarkReady
                                ? 'rgba(128, 128, 128, 0.5)'
                                : '#10b981',
                            color: '#FFFFFF',
                        }, onMouseEnter: (e) => {
                            if (canMarkReady) {
                                e.currentTarget.style.backgroundColor = '#059669';
                            }
                        }, onMouseLeave: (e) => {
                            if (canMarkReady) {
                                e.currentTarget.style.backgroundColor = '#10b981';
                            }
                        }, children: canMarkReady ? '✓ Mark as Ready' : '⚠️ Add Questions First' }), !canMarkReady && (_jsx("p", { className: "text-sm text-center mt-2", style: { color: colors.textSecondary }, children: "Add at least one question to mark as ready" }))] }))] }));
}
function QuestionFormWrapper({ activityId, question, onSuccess, onCancel, }) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const isEditing = !!question;
    const organizerId = 'demo-organizer-123';
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
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid image format. Only JPEG, PNG, and GIF are supported');
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image file size exceeds 5MB limit');
            return;
        }
        setImageFile(file);
        setError(null);
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
        console.log('Form submitted with data:', {
            questionText,
            options,
            correctOptionId,
            timerSeconds,
            activityId
        });
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
                ? `${apiBaseUrl}/activities/${activityId}/questions/${question.id}`
                : `${apiBaseUrl}/activities/${activityId}/questions`;
            const method = isEditing ? 'PUT' : 'POST';
            console.log('Making API request:', { url, method, activityId });
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
            console.log('API response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.message || 'Failed to save question');
            }
            const responseData = await response.json();
            console.log('API success response:', responseData);
            const questionId = isEditing ? question.id : responseData.questionId;
            // Upload image if one was selected
            if (imageFile && questionId) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const imageResponse = await fetch(`${apiBaseUrl}/activities/${activityId}/questions/${questionId}/image`, {
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
            console.log('Question saved successfully, calling onSuccess');
            onSuccess();
        }
        catch (err) {
            console.error('Error saving question:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: isEditing ? 'Edit Question' : 'Add New Question' }), onCancel && (_jsx("button", { type: "button", onClick: onCancel, className: "text-gray-400 hover:text-gray-600 text-2xl leading-none", "aria-label": "Close modal", children: "\u00D7" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "questionText", className: "block text-sm font-medium mb-2 text-gray-700", children: "Question Text" }), _jsx("textarea", { id: "questionText", value: questionText, onChange: (e) => setQuestionText(e.target.value), required: true, rows: 3, placeholder: "Enter your question", className: "w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition-all text-gray-900", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "questionImage", className: "block text-sm font-medium mb-2 text-gray-700", children: "Question Image - Optional" }), _jsxs("div", { className: "space-y-3", children: [imagePreview ? (_jsxs("div", { className: "relative inline-block", children: [_jsx("img", { src: imagePreview, alt: "Question preview", className: "max-w-full h-auto max-h-64 rounded-md border border-gray-300" }), _jsx("button", { type: "button", onClick: handleRemoveImage, className: "absolute top-2 right-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors", disabled: isLoading, children: "\u2715" })] })) : (_jsx("input", { type: "file", id: "questionImage", accept: "image/jpeg,image/png,image/gif", onChange: handleImageChange, className: "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100", disabled: isLoading })), _jsx("p", { className: "text-sm text-gray-500", children: "Supported formats: JPEG, PNG, GIF. Max size: 5MB" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 text-gray-700", children: "Answer Options (2-5 options)" }), _jsx("div", { className: "space-y-3", children: options.map((option, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", id: `correct-${option.id}`, name: "correctAnswer", checked: correctOptionId === option.id, onChange: () => setCorrectOptionId(option.id), className: "w-5 h-5 flex-shrink-0 text-blue-600 focus:ring-blue-500", disabled: isLoading }), _jsx("input", { type: "text", value: option.text, onChange: (e) => handleOptionTextChange(option.id, e.target.value), placeholder: `Option ${index + 1}`, className: "flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all text-gray-900", disabled: isLoading }), options.length > 2 && (_jsx("button", { type: "button", onClick: () => handleRemoveOption(option.id), className: "px-3 py-2 rounded-md transition-colors text-red-600 hover:bg-red-50", disabled: isLoading, children: "\u2715" }))] }, option.id))) }), options.length < 5 && (_jsx("button", { type: "button", onClick: handleAddOption, className: "mt-3 px-4 py-2 rounded-md transition-colors font-medium text-blue-600 hover:bg-blue-50", disabled: isLoading, children: "+ Add Option" })), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Select the radio button next to the correct answer" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "timerSeconds", className: "block text-sm font-medium mb-2 text-gray-700", children: "Timer (seconds) - Optional" }), _jsx("input", { type: "number", id: "timerSeconds", value: timerSeconds, onChange: (e) => setTimerSeconds(e.target.value), min: "1", placeholder: "Leave empty for no timer", className: "w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all text-gray-900", disabled: isLoading })] }), error && (_jsx("div", { className: "p-3 border border-red-300 rounded-md bg-red-50", children: _jsx("p", { className: "text-sm text-red-600", children: error }) })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "submit", disabled: isLoading, className: "flex-1 px-6 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white", children: isLoading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question' }), onCancel && (_jsx("button", { type: "button", onClick: onCancel, disabled: isLoading, className: "px-6 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700", children: "Cancel" }))] })] }));
}
