import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuizActivity, Question } from '../types/models';
import { UpdateActivityRequest } from '../types/api';
import { useTheme } from '../contexts/ThemeContext';

interface QuizActivityConfigProps {
  activity: QuizActivity;
  onUpdate: () => void;
  onCancel?: () => void;
}

export default function QuizActivityConfig({
  activity,
  onUpdate,
  onCancel,
}: QuizActivityConfigProps) {
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
  const [questions, setQuestions] = useState<Question[]>(activity.questions || []);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    const handleEscape = (e: KeyboardEvent) => {
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
      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          headers: {
            'x-organizer-id': organizerId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      console.log('Fetched activity data:', data);
      if (data.activity && data.activity.type === 'quiz') {
        console.log('Setting questions:', data.activity.questions);
        setQuestions(data.activity.questions || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleSaveSettings = async () => {
    console.log('Save Settings button clicked');
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: UpdateActivityRequest = {
        scoringEnabled,
        speedBonusEnabled,
        streakTrackingEnabled,
      };

      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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

  const handleEditQuestion = (question: Question) => {
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}/questions/${questionId}`,
        {
          method: 'DELETE',
          headers: {
            'x-organizer-id': organizerId,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
      }

      fetchQuestions();
      onUpdate();
    } catch (err) {
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
      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify({ status: 'ready' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as ready');
      }

      setSuccessMessage('Activity marked as ready!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              Configure Quiz Activity
            </h2>
            <p className="mt-1" style={{ color: colors.textSecondary }}>
              {activity.name}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 border rounded-md backdrop-blur-sm" style={{ 
            backgroundColor: '#ef444420', 
            borderColor: '#ef4444' 
          }}>
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 border rounded-md backdrop-blur-sm" style={{ 
            backgroundColor: '#10b98120', 
            borderColor: '#10b981' 
          }}>
            <p className="text-sm" style={{ color: '#10b981' }}>{successMessage}</p>
          </div>
        )}

        {/* Quiz Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Quiz Settings
          </h3>
          
          <div className="space-y-3">
            {/* Scoring Enabled */}
            <label 
              className="flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.cardBorder
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <input
                type="checkbox"
                checked={scoringEnabled}
                onChange={(e) => setScoringEnabled(e.target.checked)}
                className="w-5 h-5 rounded focus:ring-2"
                style={{ 
                  accentColor: colors.accent,
                  '--tw-ring-color': colors.accent + '80'
                } as any}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  Enable Scoring
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Track participant scores and display leaderboard
                </div>
              </div>
            </label>

            {/* Speed Bonus */}
            <label 
              className="flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.cardBorder,
                opacity: !scoringEnabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (scoringEnabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <input
                type="checkbox"
                checked={speedBonusEnabled}
                onChange={(e) => setSpeedBonusEnabled(e.target.checked)}
                disabled={!scoringEnabled}
                className="w-5 h-5 rounded focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  accentColor: colors.accent,
                  '--tw-ring-color': colors.accent + '80'
                } as any}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  Speed Bonus
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Award bonus points for faster correct answers
                </div>
              </div>
            </label>

            {/* Streak Tracking */}
            <label 
              className="flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.cardBorder,
                opacity: !scoringEnabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (scoringEnabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <input
                type="checkbox"
                checked={streakTrackingEnabled}
                onChange={(e) => setStreakTrackingEnabled(e.target.checked)}
                disabled={!scoringEnabled}
                className="w-5 h-5 rounded focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  accentColor: colors.accent,
                  '--tw-ring-color': colors.accent + '80'
                } as any}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  Streak Tracking
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Track consecutive correct answers and award streak bonuses
                </div>
              </div>
            </label>
          </div>

          {/* Save Settings Button */}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed"
            style={{
              backgroundColor: isSaving ? 'rgba(128, 128, 128, 0.5)' : colors.accent,
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = colors.accent + 'CC';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = colors.accent;
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Questions Section */}
      <div 
        className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Questions ({questions.length})
          </h3>
          {!isAddingQuestion && !editingQuestion && (
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 rounded-md transition-colors font-medium"
              style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent + 'CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
            >
              + Add Question
            </button>
          )}
        </div>

        {/* Question Form Modal */}
        {(isAddingQuestion || editingQuestion) && createPortal(
          <div 
            style={{ 
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
            }}
            onClick={handleCancelQuestionForm}
          >
            <div 
              style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '896px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 10001
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <QuestionFormWrapper
                activityId={activity.activityId}
                question={editingQuestion || undefined}
                onSuccess={handleQuestionSuccess}
                onCancel={handleCancelQuestionForm}
              />
            </div>
          </div>,
          document.body
        )}

        {/* Question List */}
        {!isAddingQuestion && !editingQuestion && (
          <>
            {questions.length === 0 ? (
              <div className="text-center py-8" style={{ color: colors.textSecondary }}>
                <p>No questions added yet. Add your first question!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border rounded-lg p-4 transition-colors backdrop-blur-sm"
                    style={{ 
                      borderColor: colors.cardBorder,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.accent + '80';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.cardBorder;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: colors.accent + '20', 
                          color: colors.accent 
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium break-words" style={{ color: colors.textPrimary }}>
                          {question.text}
                        </p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option) => (
                            <div key={option.id} className="flex items-center gap-2 text-sm">
                              <span
                                className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                                style={{
                                  backgroundColor: option.id === question.correctOptionId ? '#10b981' : 'transparent',
                                  borderColor: option.id === question.correctOptionId ? '#10b981' : colors.cardBorder,
                                }}
                              />
                              <span
                                style={{
                                  color: option.id === question.correctOptionId ? '#10b981' : colors.textSecondary,
                                  fontWeight: option.id === question.correctOptionId ? '500' : 'normal',
                                }}
                              >
                                {option.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        {question.timerSeconds && (
                          <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                            ⏱️ Timer: {question.timerSeconds} seconds
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(question)}
                          className="px-3 py-2 rounded-md transition-colors font-medium"
                          style={{ color: colors.accent }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.accent + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="px-3 py-2 rounded-md transition-colors font-medium"
                          style={{ color: '#ef4444' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef444420';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mark as Ready */}
      {activity.status === 'draft' && (
        <div 
          className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
          style={{ 
            backgroundColor: colors.cardBg, 
            borderColor: colors.cardBorder 
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Ready to Go?
          </h3>
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            Once you've configured your quiz settings and added questions, mark this activity as
            ready to make it available for activation.
          </p>
          <button
            type="button"
            onClick={handleMarkReady}
            disabled={!canMarkReady}
            className="w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed"
            style={{
              backgroundColor: !canMarkReady 
                ? 'rgba(128, 128, 128, 0.5)' 
                : '#10b981',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (canMarkReady) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (canMarkReady) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            {canMarkReady ? '✓ Mark as Ready' : '⚠️ Add Questions First'}
          </button>
          {!canMarkReady && (
            <p className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
              Add at least one question to mark as ready
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Wrapper component for QuestionForm that adapts it to work with activityId
interface QuestionFormWrapperProps {
  activityId: string;
  question?: Question;
  onSuccess: () => void;
  onCancel?: () => void;
}

function QuestionFormWrapper({
  activityId,
  question,
  onSuccess,
  onCancel,
}: QuestionFormWrapperProps) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const isEditing = !!question;
  const organizerId = 'demo-organizer-123';

  const [questionText, setQuestionText] = useState(question?.text || '');
  const [options, setOptions] = useState(
    question?.options || [
      { id: crypto.randomUUID(), text: '', color: 'red' as const, shape: 'triangle' as const },
      { id: crypto.randomUUID(), text: '', color: 'blue' as const, shape: 'diamond' as const },
    ]
  );
  const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId || '');
  const [timerSeconds, setTimerSeconds] = useState<string>(
    question?.timerSeconds?.toString() || ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(question?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 5) {
      const colorShapeMap = [
        { color: 'red' as const, shape: 'triangle' as const },
        { color: 'blue' as const, shape: 'diamond' as const },
        { color: 'yellow' as const, shape: 'circle' as const },
        { color: 'green' as const, shape: 'square' as const },
        { color: 'purple' as const, shape: 'pentagon' as const },
      ];
      const style = colorShapeMap[options.length];
      setOptions([...options, { id: crypto.randomUUID(), text: '', ...style }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
      if (correctOptionId === id) {
        setCorrectOptionId('');
      }
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (timerSeconds && (isNaN(timerValue!) || timerValue! <= 0)) {
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

        const imageResponse = await fetch(
          `${apiBaseUrl}/activities/${activityId}/questions/${questionId}/image`,
          {
            method: 'POST',
            headers: {
              'x-organizer-id': organizerId,
            },
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }
      }

      console.log('Question saved successfully, calling onSuccess');
      onSuccess();
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Question' : 'Add New Question'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        )}
      </div>

      {/* Question Text */}
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium mb-2 text-gray-700">
          Question Text
        </label>
        <textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          rows={3}
          placeholder="Enter your question"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition-all text-gray-900"
          disabled={isLoading}
        />
      </div>

      {/* Question Image */}
      <div>
        <label htmlFor="questionImage" className="block text-sm font-medium mb-2 text-gray-700">
          Question Image - Optional
        </label>
        <div className="space-y-3">
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Question preview"
                className="max-w-full h-auto max-h-64 rounded-md border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="file"
              id="questionImage"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isLoading}
            />
          )}
          <p className="text-sm text-gray-500">
            Supported formats: JPEG, PNG, GIF. Max size: 5MB
          </p>
        </div>
      </div>

      {/* Answer Options */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Answer Options (2-5 options)
        </label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <input
                type="radio"
                id={`correct-${option.id}`}
                name="correctAnswer"
                checked={correctOptionId === option.id}
                onChange={() => setCorrectOptionId(option.id)}
                className="w-5 h-5 flex-shrink-0 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all text-gray-900"
                disabled={isLoading}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="px-3 py-2 rounded-md transition-colors text-red-600 hover:bg-red-50"
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 px-4 py-2 rounded-md transition-colors font-medium text-blue-600 hover:bg-blue-50"
            disabled={isLoading}
          >
            + Add Option
          </button>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Select the radio button next to the correct answer
        </p>
      </div>

      {/* Timer */}
      <div>
        <label htmlFor="timerSeconds" className="block text-sm font-medium mb-2 text-gray-700">
          Timer (seconds) - Optional
        </label>
        <input
          type="number"
          id="timerSeconds"
          value={timerSeconds}
          onChange={(e) => setTimerSeconds(e.target.value)}
          min="1"
          placeholder="Leave empty for no timer"
          className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all text-gray-900"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 border border-red-300 rounded-md bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
