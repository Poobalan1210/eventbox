import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QuestionForm from './QuestionForm';
import StartQuizConfirmation from './StartQuizConfirmation';
import ModeIndicator from './ModeIndicator';
import ModeTransitionError from './ModeTransitionError';
import { useModeTransition } from '../hooks/useModeTransition';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Question, EventStatus } from '../types/models';

interface SetupModeProps {
  eventId: string;
  eventName: string;
  currentStatus: EventStatus;
  onStartQuiz: () => void;
  onStatusChange: (newStatus: EventStatus) => void;
}

export default function SetupMode({
  eventId,
  eventName,
  currentStatus,
  onStartQuiz,
  onStatusChange,
}: SetupModeProps) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const { emit } = useWebSocket();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);

  // Mode transition hook
  const {
    isTransitioning,
    transitionError,
    transitionTo,
    clearError,
  } = useModeTransition({
    eventId,
    currentStatus,
    onStatusChange,
  });

  // Fetch questions and event details
  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [eventId]);

  const handleQuestionSuccess = () => {
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      // For demo purposes, using a hardcoded organizerId
      // In production, this would come from authentication context
      const organizerId = 'demo-organizer-123';

      const response = await fetch(
        `${apiBaseUrl}/events/${eventId}/questions/${questionId}`,
        {
          method: 'DELETE',
          headers: {
            'x-organizer-id': organizerId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      fetchQuestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    
    // Remove from old position
    newQuestions.splice(draggedIndex, 1);
    // Insert at new position
    newQuestions.splice(index, 0, draggedQuestion);
    
    setQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Update order on backend
    try {
      const updatedQuestions = questions.map((q, index) => ({
        ...q,
        order: index,
      }));

      // Update each question's order
      await Promise.all(
        updatedQuestions.map((q) =>
          fetch(`${apiBaseUrl}/events/${eventId}/questions/${q.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q),
          })
        )
      );

      setQuestions(updatedQuestions);
    } catch (err) {
      console.error('Failed to update question order:', err);
      // Refresh to get correct order from server
      fetchQuestions();
    }

    setDraggedIndex(null);
  };

  const handleReadyToStart = () => {
    if (questions.length === 0) {
      alert('Please add at least one question before starting the quiz');
      return;
    }
    setShowStartConfirmation(true);
  };

  const handleConfirmStart = async () => {
    // Transition to live mode
    const result = await transitionTo('live');
    
    if (result.success) {
      setShowStartConfirmation(false);
      
      // Emit start-quiz event to notify all participants
      emit('start-quiz', { eventId });
      
      onStartQuiz();
    }
    // Error is handled by the hook and displayed via ModeTransitionError
  };

  const handleCancelStart = () => {
    setShowStartConfirmation(false);
  };

  const togglePreview = () => {
    if (!previewMode && questions.length === 0) {
      alert('Add questions to preview');
      return;
    }
    setPreviewMode(!previewMode);
    setPreviewQuestionIndex(0);
  };

  const handlePreviewNext = () => {
    if (previewQuestionIndex < questions.length - 1) {
      setPreviewQuestionIndex(previewQuestionIndex + 1);
    }
  };

  const handlePreviewPrevious = () => {
    if (previewQuestionIndex > 0) {
      setPreviewQuestionIndex(previewQuestionIndex - 1);
    }
  };

  const canStartQuiz = questions.length > 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12">
          <p className="text-white">Loading setup mode...</p>
        </div>
      </div>
    );
  }

  // Preview Mode View
  if (previewMode) {
    const currentQuestion = questions[previewQuestionIndex];
    
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        {/* Preview Header */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Preview Mode</h2>
              <p className="text-white/80 text-sm mt-1">
                Question {previewQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <button
              onClick={togglePreview}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors min-h-[44px] font-medium"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Question Preview - Simplified participant view */}
        <div className="mb-6">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-kahoot-purple-dark text-white px-6 md:px-8 py-6 md:py-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base md:text-lg font-bold text-white/90">
                  Question {previewQuestionIndex + 1} of {questions.length}
                </span>
                {currentQuestion.timerSeconds && (
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      {currentQuestion.timerSeconds}s
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Question Image */}
            {currentQuestion.imageUrl && (
              <div className="bg-gray-100">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}

            {/* Answer Options */}
            <div className="p-6 md:p-8 space-y-4 md:space-y-5">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`w-full py-5 md:py-6 px-6 rounded-xl font-bold text-lg md:text-xl shadow-lg border-3 transition-all bg-answer-${option.color} text-white border-answer-${option.color} opacity-80`}
                  style={{ minHeight: '56px' }}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    {option.id === currentQuestion.correctOptionId && (
                      <span className="text-2xl">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Note */}
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <div className="bg-white/20 border-2 border-white/30 rounded-xl p-4 text-center">
                <p className="text-white font-medium">
                  👁️ Preview Mode - This is how participants will see the question
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Navigation */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePreviewPrevious}
            disabled={previewQuestionIndex === 0}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
          >
            ← Previous
          </button>
          <button
            onClick={handlePreviewNext}
            disabled={previewQuestionIndex === questions.length - 1}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Setup Mode View
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-white/80 hover:text-white mb-2 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Setup Mode</h1>
            <p className="text-white/80 mt-2">
              Event: <span className="font-semibold">{eventName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mode Indicator */}
      <ModeIndicator status={currentStatus} className="mb-6" />

      {/* Mode Transition Error */}
      {transitionError && (
        <ModeTransitionError
          error={transitionError}
          onRetry={() => setShowStartConfirmation(true)}
          onDismiss={clearError}
        />
      )}

      {error && (
        <div className="mb-6 bg-answer-red/20 border-2 border-answer-red rounded-lg p-4">
          <p className="text-white">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Question List */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Questions ({questions.length})
              </h2>
              {questions.length > 0 && (
                <button
                  onClick={togglePreview}
                  className="text-sm px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                >
                  👁️ Preview
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <p className="text-white/60 text-center py-8 text-sm">
                No questions yet. Add your first question!
              </p>
            ) : (
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white/10 rounded-lg p-3 cursor-move hover:bg-white/20 transition-colors border border-white/10 ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {question.text}
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                          {question.options.length} options
                          {question.timerSeconds && ` • ${question.timerSeconds}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="flex-1 text-xs px-2 py-1 bg-answer-blue/30 text-white rounded hover:bg-answer-blue/50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="flex-1 text-xs px-2 py-1 bg-answer-red/30 text-white rounded hover:bg-answer-red/50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ready to Start Button */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <button
                onClick={handleReadyToStart}
                disabled={!canStartQuiz}
                className="w-full px-4 py-3 bg-answer-green text-white rounded-lg hover:bg-answer-green/80 disabled:bg-white/20 disabled:cursor-not-allowed transition-colors min-h-[44px] font-bold"
              >
                {canStartQuiz ? '🚀 Ready to Start' : '⚠️ Add Questions First'}
              </button>
              {!canStartQuiz && (
                <p className="text-white/60 text-xs text-center mt-2">
                  Add at least one question to start the quiz
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Question Form */}
        <div className="lg:col-span-2">
          <QuestionForm
            eventId={eventId}
            question={editingQuestion || undefined}
            onSuccess={handleQuestionSuccess}
            onCancel={editingQuestion ? handleCancelEdit : undefined}
          />
        </div>
      </div>

      {/* Start Confirmation Modal */}
      <StartQuizConfirmation
        isOpen={showStartConfirmation}
        eventId={eventId}
        eventName={eventName}
        questionCount={questions.length}
        onConfirm={handleConfirmStart}
        onCancel={handleCancelStart}
        isLoading={isTransitioning}
      />

    </div>
  );
}
