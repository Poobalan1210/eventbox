import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useWebSocketEvent } from '../hooks/useWebSocketEvent';
import { useModeTransition } from '../hooks/useModeTransition';
import Leaderboard from './Leaderboard';
import AnswerStatisticsChart from './AnswerStatisticsChart';
import PodiumDisplay from './PodiumDisplay';
import GamePINDisplay from './GamePINDisplay';
import ModeIndicator from './ModeIndicator';
import ModeTransitionError from './ModeTransitionError';
export default function LiveMode({ eventId, eventName, currentStatus, gamePin, onEndQuiz, onStatusChange, }) {
    const { emit } = useWebSocket();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questions, setQuestions] = useState([]);
    // Participant state
    const [participants, setParticipants] = useState([]);
    const [answeredCount, setAnsweredCount] = useState(0);
    // Display state
    const [showStatistics, setShowStatistics] = useState(false);
    const [answerStatistics, setAnswerStatistics] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showPodium, setShowPodium] = useState(false);
    const [topThree, setTopThree] = useState([]);
    const [quizEnded, setQuizEnded] = useState(false);
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Mode transition hook
    const { isTransitioning, transitionError, transitionTo, clearError, } = useModeTransition({
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
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
    const handleParticipantsUpdated = useCallback((payload) => {
        setParticipants(payload.participants);
        // Count how many participants have answered the current question
        if (currentQuestion) {
            const answered = payload.participants.filter(p => p.answers.some(a => a.questionId === currentQuestion.id)).length;
            setAnsweredCount(answered);
        }
    }, [currentQuestion]);
    const handleQuestionDisplayed = useCallback((payload) => {
        setCurrentQuestion(payload.question);
        setCurrentQuestionIndex(payload.questionNumber - 1);
        setTotalQuestions(payload.totalQuestions);
        setShowStatistics(false);
        setShowLeaderboard(false);
        setAnswerStatistics(null);
        setAnsweredCount(0);
    }, []);
    const handleAnswerStatistics = useCallback((payload) => {
        setAnswerStatistics(payload.statistics);
        setShowStatistics(true);
    }, []);
    const handleLeaderboardUpdated = useCallback((payload) => {
        setLeaderboard(payload.leaderboard);
        setShowLeaderboard(true);
    }, []);
    const handleQuizEnded = useCallback((payload) => {
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
        }
        else {
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
    const canNextQuestion = !quizEnded && (currentQuestion === null
        ? questions.length > 0
        : currentQuestionIndex < totalQuestions - 1);
    if (isLoading) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-white", children: "Loading live mode..." }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-lg p-6", children: _jsx("p", { className: "text-white", children: error }) }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 pb-8", children: [_jsx("div", { className: "mb-6", children: _jsx("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: _jsxs("div", { children: [_jsx(Link, { to: "/dashboard", className: "inline-flex items-center text-white/80 hover:text-white mb-2 text-sm font-medium", children: "\u2190 Back to Dashboard" }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-white", children: "Live Mode" }), _jsxs("p", { className: "text-white/80 mt-2", children: ["Event: ", _jsx("span", { className: "font-semibold", children: eventName })] })] }) }) }), _jsx(ModeIndicator, { status: currentStatus, className: "mb-6" }), transitionError && (_jsx(ModeTransitionError, { error: transitionError, onRetry: handleEndQuizClick, onDismiss: clearError })), gamePin && (_jsx("div", { className: "mb-6", children: _jsx(GamePINDisplay, { eventId: eventId }) })), _jsxs("div", { className: "mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-white", children: ["Question ", currentQuestionIndex + 1, " of ", totalQuestions] }), _jsxs("p", { className: "text-white/80 text-sm mt-1", children: [participants.length, " participant", participants.length !== 1 ? 's' : '', " joined"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-white/80 text-sm", children: "Progress" }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [quizProgress, "%"] })] })] }), _jsx("div", { className: "w-full bg-white/20 rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "bg-answer-green h-full transition-all duration-500 ease-out", style: { width: `${quizProgress}%` } }) })] }), currentQuestion && (_jsxs("div", { className: "mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Current Question" }), _jsxs("div", { className: "bg-kahoot-purple-dark rounded-lg p-6 mb-4", children: [_jsx("p", { className: "text-2xl font-bold text-white mb-4", children: currentQuestion.text }), currentQuestion.imageUrl && (_jsx("div", { className: "mb-4 rounded-lg overflow-hidden", children: _jsx("img", { src: currentQuestion.imageUrl, alt: "Question illustration", className: "w-full h-auto max-h-64 object-contain bg-white/10" }) })), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: currentQuestion.options.map((option) => (_jsxs("div", { className: `py-3 px-4 rounded-lg font-medium text-white bg-answer-${option.color} border-2 border-answer-${option.color}`, children: [option.text, option.id === currentQuestion.correctOptionId && (_jsx("span", { className: "ml-2", children: "\u2713" }))] }, option.id))) })] }), _jsxs("div", { className: "bg-white/10 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-white font-medium", children: "Answer Submissions" }), _jsxs("p", { className: "text-white font-bold", children: [answeredCount, " / ", participants.length] })] }), _jsx("div", { className: "w-full bg-white/20 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-300 ${allAnswered ? 'bg-answer-green' : 'bg-answer-yellow'}`, style: {
                                        width: participants.length > 0
                                            ? `${(answeredCount / participants.length) * 100}%`
                                            : '0%'
                                    } }) }), allAnswered && (_jsx("p", { className: "text-answer-green text-sm font-medium mt-2 animate-pulse", children: "\u2713 All participants have answered!" }))] })] })), _jsxs("div", { className: "mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Quiz Controls" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("button", { onClick: handleNextQuestion, disabled: !canNextQuestion, className: `flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all min-h-[56px] ${allAnswered && canNextQuestion
                                    ? 'bg-answer-green text-white hover:bg-answer-green/80 animate-pulse shadow-lg'
                                    : 'bg-answer-blue text-white hover:bg-answer-blue/80 disabled:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50'}`, children: allAnswered && canNextQuestion ? '✨ Next Question (All Answered!)' : 'Next Question →' }), _jsx("button", { onClick: handleShowResults, className: "flex-1 px-6 py-4 bg-answer-yellow text-white rounded-lg hover:bg-answer-yellow/80 transition-all min-h-[56px] font-bold text-lg", children: "Show Results" }), _jsx("button", { onClick: handleEndQuizClick, disabled: quizEnded || isTransitioning, className: "flex-1 px-6 py-4 bg-answer-red text-white rounded-lg hover:bg-answer-red/80 disabled:bg-white/20 disabled:cursor-not-allowed transition-all min-h-[56px] font-bold text-lg", children: isTransitioning ? 'Ending...' : 'End Quiz' })] })] }), showStatistics && answerStatistics && currentQuestion && (_jsx("div", { className: "mb-6", children: _jsx(AnswerStatisticsChart, { statistics: answerStatistics, question: currentQuestion }) })), quizEnded && showPodium && topThree.length > 0 && (_jsx("div", { className: "mb-8", children: _jsx(PodiumDisplay, { topThree: topThree }) })), showLeaderboard && leaderboard.length > 0 && (_jsx("div", { className: "mb-6", children: _jsx(Leaderboard, { participants: leaderboard, showTime: quizEnded, title: quizEnded ? 'Final Results' : 'Current Standings' }) })), _jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4", children: ["Participants (", participants.length, ")"] }), participants.length === 0 ? (_jsx("p", { className: "text-white/60 text-center py-8", children: "Waiting for participants to join..." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: participants.map((participant) => {
                            const hasAnswered = currentQuestion
                                ? participant.answers.some(a => a.questionId === currentQuestion.id)
                                : false;
                            return (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${hasAnswered
                                    ? 'bg-answer-green/20 border-answer-green'
                                    : 'bg-white/10 border-white/20'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasAnswered ? 'bg-answer-green' : 'bg-white/20'}`, children: _jsx("span", { className: "text-white font-bold", children: hasAnswered ? '✓' : participant.name.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium text-white truncate", children: participant.name }), _jsxs("p", { className: "text-sm text-white/80", children: ["Score: ", participant.score] })] })] }, participant.id));
                        }) }))] })] }));
}
