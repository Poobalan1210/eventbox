import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useWebSocketEvent } from '../hooks/useWebSocketEvent';
import { useModeTransition } from '../hooks/useModeTransition';
import type { Question, Participant, ParticipantScore, AnswerStatistics, EventStatus } from '../types/models';
import type {
  ParticipantsUpdatedPayload,
  QuestionDisplayedPayload,
  AnswerStatisticsPayload,
  LeaderboardUpdatedPayload,
  QuizEndedPayload,
} from '../types/websocket';
import Leaderboard from './Leaderboard';
import AnswerStatisticsChart from './AnswerStatisticsChart';
import PodiumDisplay from './PodiumDisplay';
import GamePINDisplay from './GamePINDisplay';
import ModeIndicator from './ModeIndicator';
import ModeTransitionError from './ModeTransitionError';

interface LiveModeProps {
  eventId: string;
  eventName: string;
  currentStatus: EventStatus;
  gamePin?: string;
  onEndQuiz: () => void;
  onStatusChange: (newStatus: EventStatus) => void;
}

export default function LiveMode({
  eventId,
  eventName,
  currentStatus,
  gamePin,
  onEndQuiz,
  onStatusChange,
}: LiveModeProps) {
  const { emit } = useWebSocket();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Participant state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  
  // Display state
  const [showStatistics, setShowStatistics] = useState(false);
  const [answerStatistics, setAnswerStatistics] = useState<AnswerStatistics | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ParticipantScore[]>([]);
  const [showPodium, setShowPodium] = useState(false);
  const [topThree, setTopThree] = useState<ParticipantScore[]>([]);
  const [quizEnded, setQuizEnded] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch event details to get questions
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to load event details');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
      setTotalQuestions(data.questions?.length || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // Join the event room as organizer to receive live updates
  useEffect(() => {
    emit('join-event-as-organizer', { eventId });
    console.log('Organizer joined event room:', eventId);
  }, [eventId, emit]);

  // WebSocket event handlers
  const handleParticipantsUpdated = useCallback((payload: ParticipantsUpdatedPayload) => {
    setParticipants(payload.participants);
    
    // Count how many participants have answered the current question
    if (currentQuestion) {
      const answered = payload.participants.filter(p => 
        p.answers.some(a => a.questionId === currentQuestion.id)
      ).length;
      setAnsweredCount(answered);
    }
  }, [currentQuestion]);

  const handleQuestionDisplayed = useCallback((payload: QuestionDisplayedPayload) => {
    setCurrentQuestion(payload.question);
    setCurrentQuestionIndex(payload.questionNumber - 1);
    setTotalQuestions(payload.totalQuestions);
    setShowStatistics(false);
    setShowLeaderboard(false);
    setAnswerStatistics(null);
    setAnsweredCount(0);
  }, []);

  const handleAnswerStatistics = useCallback((payload: AnswerStatisticsPayload) => {
    setAnswerStatistics(payload.statistics);
    setShowStatistics(true);
  }, []);

  const handleLeaderboardUpdated = useCallback((payload: LeaderboardUpdatedPayload) => {
    setLeaderboard(payload.leaderboard);
    setShowLeaderboard(true);
  }, []);

  const handleQuizEnded = useCallback((payload: QuizEndedPayload) => {
    setLeaderboard(payload.finalLeaderboard);
    setTopThree(payload.topThree);
    setQuizEnded(true);
    
    // Show podium first, then leaderboard after a delay
    setShowPodium(true);
    setShowLeaderboard(false);
    
    // Show leaderboard after podium animation completes (3 seconds)
    setTimeout(() => {
      setShowLeaderboard(true);
    }, 3000);
  }, []);

  // Subscribe to WebSocket events
  useWebSocketEvent('participants-updated', handleParticipantsUpdated);
  useWebSocketEvent('question-displayed', handleQuestionDisplayed);
  useWebSocketEvent('answer-statistics', handleAnswerStatistics);
  useWebSocketEvent('leaderboard-updated', handleLeaderboardUpdated);
  useWebSocketEvent('quiz-ended', handleQuizEnded);

  // Quiz control functions
  const handleNextQuestion = () => {
    console.log('handleNextQuestion called', {
      currentQuestion,
      currentQuestionIndex,
      questionsLength: questions.length,
      questions,
    });
    
    // If no question is currently displayed, show the first question
    // Otherwise, show the next question
    const nextIndex = currentQuestion === null ? 0 : currentQuestionIndex + 1;
    console.log('Next index:', nextIndex);
    
    if (nextIndex < questions.length) {
      const nextQuestion = questions[nextIndex];
      console.log('Emitting next-question:', { eventId, questionId: nextQuestion.id });
      emit('next-question', { eventId, questionId: nextQuestion.id });
    } else {
      console.log('Cannot show next question - out of bounds');
    }
  };

  const handleShowResults = () => {
    // Results are automatically shown via WebSocket events
    // This button is mainly for UI feedback
    setShowStatistics(true);
  };

  const handleEndQuizClick = async () => {
    if (!confirm('Are you sure you want to end the quiz? This cannot be undone.')) {
      return;
    }

    // Transition to completed mode
    const result = await transitionTo('completed');
    
    if (result.success) {
      emit('end-quiz', { eventId });
      onEndQuiz();
    }
    // Error is handled by the hook and displayed via ModeTransitionError
  };

  // Calculate progress
  const quizProgress = totalQuestions > 0 
    ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) 
    : 0;

  // Check if all participants have answered
  const allAnswered = participants.length > 0 && answeredCount === participants.length;

  // Check if we can go to next question
  // If no question is displayed yet, we can show the first question
  // Otherwise, check if there are more questions to show
  const canNextQuestion = !quizEnded && (
    currentQuestion === null 
      ? questions.length > 0 
      : currentQuestionIndex < totalQuestions - 1
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12">
          <p className="text-white">Loading live mode...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-6">
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Mode</h1>
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
          onRetry={handleEndQuizClick}
          onDismiss={clearError}
        />
      )}

      {/* Game PIN Display */}
      {gamePin && (
        <div className="mb-6">
          <GamePINDisplay eventId={eventId} />
        </div>
      )}

      {/* Quiz Progress and Info */}
      <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} joined
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Progress</p>
            <p className="text-2xl font-bold text-white">{quizProgress}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-answer-green h-full transition-all duration-500 ease-out"
            style={{ width: `${quizProgress}%` }}
          />
        </div>
      </div>

      {/* Current Question Display */}
      {currentQuestion && (
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4">Current Question</h3>
          
          <div className="bg-kahoot-purple-dark rounded-lg p-6 mb-4">
            <p className="text-2xl font-bold text-white mb-4">
              {currentQuestion.text}
            </p>
            
            {currentQuestion.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="w-full h-auto max-h-64 object-contain bg-white/10"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`py-3 px-4 rounded-lg font-medium text-white bg-answer-${option.color} border-2 border-answer-${option.color}`}
                >
                  {option.text}
                  {option.id === currentQuestion.correctOptionId && (
                    <span className="ml-2">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Answer Submission Status */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium">Answer Submissions</p>
              <p className="text-white font-bold">
                {answeredCount} / {participants.length}
              </p>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allAnswered ? 'bg-answer-green' : 'bg-answer-yellow'
                }`}
                style={{
                  width: participants.length > 0 
                    ? `${(answeredCount / participants.length) * 100}%` 
                    : '0%'
                }}
              />
            </div>
            {allAnswered && (
              <p className="text-answer-green text-sm font-medium mt-2 animate-pulse">
                ✓ All participants have answered!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quiz Control Buttons */}
      <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">Quiz Controls</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNextQuestion}
            disabled={!canNextQuestion}
            className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all min-h-[56px] ${
              allAnswered && canNextQuestion
                ? 'bg-answer-green text-white hover:bg-answer-green/80 animate-pulse shadow-lg'
                : 'bg-answer-blue text-white hover:bg-answer-blue/80 disabled:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50'
            }`}
          >
            {allAnswered && canNextQuestion ? '✨ Next Question (All Answered!)' : 'Next Question →'}
          </button>
          <button
            onClick={handleShowResults}
            className="flex-1 px-6 py-4 bg-answer-yellow text-white rounded-lg hover:bg-answer-yellow/80 transition-all min-h-[56px] font-bold text-lg"
          >
            Show Results
          </button>
          <button
            onClick={handleEndQuizClick}
            disabled={quizEnded || isTransitioning}
            className="flex-1 px-6 py-4 bg-answer-red text-white rounded-lg hover:bg-answer-red/80 disabled:bg-white/20 disabled:cursor-not-allowed transition-all min-h-[56px] font-bold text-lg"
          >
            {isTransitioning ? 'Ending...' : 'End Quiz'}
          </button>
        </div>
      </div>

      {/* Answer Statistics */}
      {showStatistics && answerStatistics && currentQuestion && (
        <div className="mb-6">
          <AnswerStatisticsChart
            statistics={answerStatistics}
            question={currentQuestion}
          />
        </div>
      )}

      {/* Podium Display - Show when quiz is completed */}
      {quizEnded && showPodium && topThree.length > 0 && (
        <div className="mb-8">
          <PodiumDisplay topThree={topThree} />
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="mb-6">
          <Leaderboard
            participants={leaderboard}
            showTime={quizEnded}
            title={quizEnded ? 'Final Results' : 'Current Standings'}
          />
        </div>
      )}

      {/* Participants List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">
          Participants ({participants.length})
        </h3>
        {participants.length === 0 ? (
          <p className="text-white/60 text-center py-8">
            Waiting for participants to join...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((participant) => {
              const hasAnswered = currentQuestion 
                ? participant.answers.some(a => a.questionId === currentQuestion.id)
                : false;
              
              return (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    hasAnswered
                      ? 'bg-answer-green/20 border-answer-green'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    hasAnswered ? 'bg-answer-green' : 'bg-white/20'
                  }`}>
                    <span className="text-white font-bold">
                      {hasAnswered ? '✓' : participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">
                      {participant.name}
                    </p>
                    <p className="text-sm text-white/80">
                      Score: {participant.score}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
