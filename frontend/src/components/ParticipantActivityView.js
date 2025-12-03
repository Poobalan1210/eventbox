import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ParticipantActivityView - Unified view for all activity types
 *
 * This component dynamically renders the appropriate interface based on the
 * currently active activity type (quiz, poll, or raffle). It handles activity
 * transitions without page refresh and displays a waiting state when no
 * activity is active.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
// Import activity-specific components
import QuestionDisplay from './QuestionDisplay';
import Leaderboard from './Leaderboard';
import PodiumDisplay from './PodiumDisplay';
import WaitingForActivity from './WaitingForActivity';
export default function ParticipantActivityView({ eventId, participantName, }) {
    const { on } = useWebSocket();
    // Activity state
    const [activityState, setActivityState] = useState('waiting');
    const [currentActivity, setCurrentActivity] = useState(null);
    const [waitingMessage, setWaitingMessage] = useState('Waiting for organizer to start an activity...');
    // Quiz state
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [isAnswerDisabled, setIsAnswerDisabled] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [answerStatistics, setAnswerStatistics] = useState(null);
    const [showStatistics, setShowStatistics] = useState(false);
    const [answerResult, setAnswerResult] = useState(null);
    const [showAnswerResult, setShowAnswerResult] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [topThree, setTopThree] = useState([]);
    const [showPodium, setShowPodium] = useState(false);
    // Poll state
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState([]);
    const [selectedPollOptions, setSelectedPollOptions] = useState([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [pollResults, setPollResults] = useState(null);
    const [showPollResults, setShowPollResults] = useState(false);
    // Raffle state
    const [rafflePrize, setRafflePrize] = useState('');
    const [hasEntered, setHasEntered] = useState(false);
    const [raffleWinners, setRaffleWinners] = useState([]);
    const [showRaffleWinners, setShowRaffleWinners] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    // Handle raffle entry
    const handleRaffleEntry = async () => {
        if (hasEntered || !currentActivity)
            return;
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${currentActivity.activityId}/enter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: participantName,
                    participantName,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to enter raffle');
            }
            console.log('🎫 Successfully entered raffle');
        }
        catch (error) {
            console.error('Error entering raffle:', error);
        }
    };
    // Fetch current activity state when component mounts
    useEffect(() => {
        const fetchCurrentActivity = async () => {
            try {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                console.log('Fetching current activities for event:', eventId);
                const response = await fetch(`${apiBaseUrl}/events/${eventId}/activities`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Activities data:', data);
                    // Find active activity
                    const activeActivity = data.activities?.find((a) => a.status === 'active');
                    if (activeActivity) {
                        console.log('Found active activity:', activeActivity);
                        setCurrentActivity(activeActivity);
                        // Set activity state and load activity-specific data
                        if (activeActivity.type === 'quiz') {
                            setActivityState('quiz');
                        }
                        else if (activeActivity.type === 'poll') {
                            setActivityState('poll');
                            // Load poll data
                            const question = activeActivity.question || '';
                            const options = activeActivity.options || [];
                            setPollQuestion(question);
                            setPollOptions(options);
                            console.log('Set poll data:', { question, options });
                        }
                        else if (activeActivity.type === 'raffle') {
                            setActivityState('raffle');
                            // Load raffle data
                            setRafflePrize(activeActivity.prizeDescription || '');
                            // Auto-enter if automatic entry mode and not already entered
                            if (activeActivity.entryMethod === 'automatic' && !hasEntered) {
                                console.log('🎫 Auto-entering participant in already active automatic raffle');
                                setTimeout(() => handleRaffleEntry(), 1000); // Small delay to ensure component is ready
                            }
                        }
                    }
                    else {
                        console.log('No active activity found');
                        setActivityState('waiting');
                    }
                }
            }
            catch (error) {
                console.error('Error fetching current activity:', error);
                setActivityState('waiting');
            }
        };
        fetchCurrentActivity();
    }, [eventId]);
    // Listen for activity-activated event
    useEffect(() => {
        const cleanup = on('activity-activated', (payload) => {
            console.log('🎯 Activity activated event received:', payload);
            setCurrentActivity(payload.activity);
            // Reset state for new activity
            resetActivityState();
            // Set activity state based on type and load activity data
            if (payload.activity.type === 'quiz') {
                setActivityState('quiz');
            }
            else if (payload.activity.type === 'poll') {
                setActivityState('poll');
                // Load poll data for the newly activated poll
                const question = payload.activity.question || '';
                const options = payload.activity.options || [];
                setPollQuestion(question);
                setPollOptions(options);
                console.log('Loaded poll data from activation event:', { question, options });
            }
            else if (payload.activity.type === 'raffle') {
                setActivityState('raffle');
                // Load raffle data
                setRafflePrize(payload.activity.prizeDescription || '');
            }
        });
        return cleanup;
    }, [on]);
    // Listen for activity-deactivated event
    useEffect(() => {
        const cleanup = on('activity-deactivated', (payload) => {
            console.log('Activity deactivated:', payload);
            setActivityState('waiting');
            setCurrentActivity(null);
            resetActivityState();
        });
        return cleanup;
    }, [on]);
    // Listen for waiting-for-activity event
    useEffect(() => {
        const cleanup = on('waiting-for-activity', (payload) => {
            console.log('Waiting for activity:', payload);
            setWaitingMessage(payload.message);
            setActivityState('waiting');
        });
        return cleanup;
    }, [on]);
    // Quiz event listeners
    useEffect(() => {
        const cleanups = [];
        // Question displayed
        cleanups.push(on('question-displayed', (payload) => {
            console.log('Question displayed:', payload);
            setCurrentQuestion(payload.question);
            setQuestionNumber(payload.questionNumber);
            setTotalQuestions(payload.totalQuestions);
            setQuestionStartTime(payload.startTime);
            setIsAnswerDisabled(false);
            setShowLeaderboard(false);
            setShowStatistics(false);
            setAnswerStatistics(null);
            setAnswerResult(null);
            setShowAnswerResult(false);
            if (payload.question.timerSeconds) {
                setRemainingSeconds(payload.question.timerSeconds);
            }
            else {
                setRemainingSeconds(null);
            }
        }));
        // Timer tick
        cleanups.push(on('timer-tick', (payload) => {
            setRemainingSeconds(payload.remainingSeconds);
        }));
        // Question ended
        cleanups.push(on('question-ended', (payload) => {
            console.log('Question ended:', payload);
            setIsAnswerDisabled(true);
            setRemainingSeconds(0);
            setShowAnswerResult(true);
        }));
        // Answer result
        cleanups.push(on('answer-result', (payload) => {
            console.log('Answer result:', payload);
            setAnswerResult(payload);
            if (payload.currentStreak !== undefined) {
                setCurrentStreak(payload.currentStreak);
            }
        }));
        // Answer statistics
        cleanups.push(on('answer-statistics', (payload) => {
            console.log('Answer statistics:', payload);
            setAnswerStatistics(payload.statistics);
            setShowStatistics(true);
            setTimeout(() => {
                setShowStatistics(false);
            }, 2000);
        }));
        // Leaderboard updated
        cleanups.push(on('leaderboard-updated', (payload) => {
            console.log('Leaderboard updated:', payload);
            setLeaderboard(payload.leaderboard);
            setShowLeaderboard(true);
        }));
        // Quiz ended
        cleanups.push(on('quiz-ended', (payload) => {
            console.log('Quiz ended:', payload);
            setLeaderboard(payload.finalLeaderboard);
            setTopThree(payload.topThree);
            setActivityState('completed');
            setShowPodium(true);
            setShowLeaderboard(false);
            setTimeout(() => {
                setShowLeaderboard(true);
            }, 3000);
        }));
        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }, [on]);
    // Poll event listeners
    useEffect(() => {
        const cleanups = [];
        // Poll started
        cleanups.push(on('poll-started', (payload) => {
            console.log('Poll started:', payload);
            setPollQuestion(payload.question);
            setPollOptions(payload.options);
            setHasVoted(false);
            setSelectedPollOptions([]);
            setShowPollResults(false);
        }));
        // Poll results updated
        cleanups.push(on('poll-results-updated', (payload) => {
            console.log('Poll results updated:', payload);
            setPollResults(payload.results);
            setShowPollResults(true);
        }));
        // Poll ended
        cleanups.push(on('poll-ended', (payload) => {
            console.log('Poll ended:', payload);
            setPollResults(payload.finalResults);
            setShowPollResults(true);
            setActivityState('completed');
        }));
        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }, [on]);
    // Raffle event listeners
    useEffect(() => {
        const cleanups = [];
        // Raffle started
        cleanups.push(on('raffle-started', (payload) => {
            console.log('Raffle started:', payload);
            setRafflePrize(payload.prizeDescription);
            setHasEntered(false);
            setShowRaffleWinners(false);
            setRaffleWinners([]);
            // Auto-enter if automatic entry mode
            if (payload.entryMethod === 'automatic') {
                console.log('🎫 Auto-entering participant in automatic mode');
                handleRaffleEntry();
            }
        }));
        // Raffle entry confirmed
        cleanups.push(on('raffle-entry-confirmed', (payload) => {
            console.log('Raffle entry confirmed:', payload);
            setHasEntered(true);
        }));
        // Raffle drawing
        cleanups.push(on('raffle-drawing', () => {
            console.log('Raffle drawing...');
            setIsDrawing(true);
        }));
        // Raffle winners announced
        cleanups.push(on('raffle-winners-announced', (payload) => {
            console.log('Raffle winners announced:', payload);
            setRaffleWinners(payload.winners);
            setShowRaffleWinners(true);
            setIsDrawing(false);
        }));
        // Raffle ended
        cleanups.push(on('raffle-ended', () => {
            console.log('Raffle ended');
            setActivityState('completed');
        }));
        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }, [on]);
    // Fetch poll results
    const fetchPollResults = async () => {
        if (!currentActivity || currentActivity.type !== 'poll')
            return;
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiBaseUrl}/activities/${currentActivity.activityId}/poll-results`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched poll results:', data);
                setPollResults(data.results);
                setShowPollResults(true);
            }
        }
        catch (error) {
            console.error('Error fetching poll results:', error);
        }
    };
    // Reset activity state when switching activities
    const resetActivityState = () => {
        // Reset quiz state
        setCurrentQuestion(null);
        setQuestionNumber(0);
        setTotalQuestions(0);
        setQuestionStartTime(0);
        setRemainingSeconds(null);
        setIsAnswerDisabled(false);
        setLeaderboard([]);
        setShowLeaderboard(false);
        setAnswerStatistics(null);
        setShowStatistics(false);
        setAnswerResult(null);
        setShowAnswerResult(false);
        setCurrentStreak(0);
        setTopThree([]);
        setShowPodium(false);
        // Reset poll state
        setPollQuestion('');
        setPollOptions([]);
        setSelectedPollOptions([]);
        setHasVoted(false);
        setPollResults(null);
        setShowPollResults(false);
        // Reset raffle state
        setRafflePrize('');
        setHasEntered(false);
        setRaffleWinners([]);
        setShowRaffleWinners(false);
        setIsDrawing(false);
    };
    // Render waiting state
    if (activityState === 'waiting') {
        return (_jsx(WaitingForActivity, { message: waitingMessage, participantName: participantName }));
    }
    // Render quiz activity
    if (activityState === 'quiz') {
        return (_jsx(QuizActivityView, { currentQuestion: currentQuestion, questionNumber: questionNumber, totalQuestions: totalQuestions, questionStartTime: questionStartTime, remainingSeconds: remainingSeconds, isAnswerDisabled: isAnswerDisabled, answerResult: showAnswerResult ? answerResult : null, currentStreak: currentStreak, answerStatistics: showStatistics ? answerStatistics : null, leaderboard: leaderboard, showLeaderboard: showLeaderboard, showStatistics: showStatistics, activityId: currentActivity?.activityId || '' }));
    }
    // Render poll activity
    if (activityState === 'poll') {
        return (_jsx(PollActivityView, { question: pollQuestion, options: pollOptions, selectedOptions: selectedPollOptions, onSelectOption: setSelectedPollOptions, hasVoted: hasVoted, onVote: setHasVoted, results: pollResults, showResults: showPollResults, eventId: eventId, activityId: currentActivity?.activityId || '', onVoteSubmitted: fetchPollResults }));
    }
    // Render raffle activity
    if (activityState === 'raffle') {
        return (_jsx(RaffleActivityView, { prizeDescription: rafflePrize, hasEntered: hasEntered, onEnter: setHasEntered, winners: raffleWinners, showWinners: showRaffleWinners, isDrawing: isDrawing, participantName: participantName, eventId: eventId, activityId: currentActivity?.activityId || '' }));
    }
    // Render completed state
    if (activityState === 'completed') {
        // Show quiz completion
        if (currentActivity?.type === 'quiz' && topThree.length > 0) {
            const topFive = leaderboard.slice(0, 5);
            return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [showPodium && topThree.length > 0 && (_jsx("div", { className: "mb-8", children: _jsx(PodiumDisplay, { topThree: topThree }) })), showLeaderboard && (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg", children: "Final Top 5" }), _jsxs("p", { className: "text-base md:text-lg text-white/90 drop-shadow", children: ["Thanks for participating, ", participantName, "!"] })] }), _jsx(Leaderboard, { participants: topFive, showTime: true })] }))] }));
        }
        // Show poll completion
        if (currentActivity?.type === 'poll' && pollResults) {
            return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20", children: [_jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white mb-6 text-center", children: "Poll Results" }), _jsx(PollResults, { results: pollResults }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-white/80", children: ["Thanks for voting, ", participantName, "!"] }) })] }) }));
        }
        // Show raffle completion
        if (currentActivity?.type === 'raffle' && showRaffleWinners) {
            return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20", children: [_jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white mb-6 text-center", children: "\uD83C\uDF89 Raffle Complete! \uD83C\uDF89" }), _jsx(RaffleWinnersList, { winners: raffleWinners, participantName: participantName })] }) }));
        }
    }
    // Fallback
    return (_jsx(WaitingForActivity, { message: waitingMessage, participantName: participantName }));
}
/**
 * QuizActivityView - Renders quiz interface
 * Requirement: 6.2, 10.5
 */
function QuizActivityView({ currentQuestion, questionNumber, totalQuestions, questionStartTime, remainingSeconds, isAnswerDisabled, answerResult, currentStreak, answerStatistics, leaderboard, showLeaderboard, showStatistics, activityId, }) {
    const { emit } = useWebSocket();
    const handleAnswerSubmit = (answerId, responseTime) => {
        if (!currentQuestion)
            return;
        console.log('Submitting answer:', { activityId, answerId, responseTime });
        try {
            emit('submit-answer', {
                activityId,
                questionId: currentQuestion.id,
                answerId,
                responseTime,
            });
        }
        catch (error) {
            console.error('Error submitting answer:', error);
        }
    };
    // Show leaderboard after statistics
    if (showLeaderboard && leaderboard.length > 0 && !showStatistics) {
        const topTen = leaderboard.slice(0, 10);
        return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h2", { className: "text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg", children: "Top 10 Standings" }), _jsx("p", { className: "text-sm md:text-base text-white/90 drop-shadow", children: "Waiting for next question..." })] }), _jsx(Leaderboard, { participants: topTen, showTime: false })] }));
    }
    // Show current question
    if (currentQuestion) {
        return (_jsx("div", { className: "space-y-6", children: _jsx(QuestionDisplay, { question: currentQuestion, questionNumber: questionNumber, totalQuestions: totalQuestions, startTime: questionStartTime, remainingSeconds: remainingSeconds, onAnswerSubmit: handleAnswerSubmit, disabled: isAnswerDisabled, answerResult: answerResult, currentStreak: currentStreak, answerStatistics: answerStatistics }) }));
    }
    // Fallback: Quiz is active but no question displayed yet
    return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs("div", { className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-8 md:p-12 text-center border border-white/20", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 rounded-full mb-4", children: _jsx("svg", { className: "w-8 h-8 md:w-10 md:h-10 text-white animate-spin", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) }), _jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white mb-2", children: "Get Ready! \uD83C\uDFAF" }), _jsx("p", { className: "text-lg md:text-xl text-white/80", children: "The first question is coming up..." })] }) }));
}
/**
 * PollActivityView - Renders poll interface
 * Requirement: 6.3
 */
function PollActivityView({ question, options, selectedOptions, onSelectOption, hasVoted, onVote, results, showResults, eventId: _eventId, activityId: _activityId, onVoteSubmitted, }) {
    // TODO: Use emit when poll WebSocket handlers are fully implemented
    // const { emit } = useWebSocket();
    console.log('PollActivityView rendering with:', {
        question,
        optionsCount: options.length,
        hasVoted,
        showResults
    });
    const handleOptionToggle = (optionId) => {
        if (hasVoted)
            return;
        if (selectedOptions.includes(optionId)) {
            onSelectOption(selectedOptions.filter(id => id !== optionId));
        }
        else {
            onSelectOption([...selectedOptions, optionId]);
        }
    };
    const handleSubmitVote = async () => {
        if (selectedOptions.length === 0 || hasVoted)
            return;
        console.log('Submitting vote:', selectedOptions);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiBaseUrl}/activities/${_activityId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: 'participant-' + Math.random().toString(36).substring(2, 9), // Generate a unique participant ID
                    optionIds: selectedOptions,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit vote');
            }
            console.log('Vote submitted successfully');
            onVote(true);
            // Notify parent component to fetch updated results
            if (onVoteSubmitted) {
                onVoteSubmitted();
            }
        }
        catch (error) {
            console.error('Error submitting vote:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit vote');
        }
    };
    return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20", children: [_jsx("div", { className: "bg-kahoot-purple-dark text-white px-6 md:px-8 py-6 md:py-8", children: _jsx("h2", { className: "text-2xl md:text-3xl lg:text-4xl font-bold", children: question }) }), _jsx("div", { className: "p-6 md:p-8 space-y-4", children: options.map((option) => {
                        const isSelected = selectedOptions.includes(option.id);
                        const percentage = results ? (option.voteCount / results.totalVotes) * 100 : 0;
                        return (_jsxs(motion.button, { onClick: () => handleOptionToggle(option.id), disabled: hasVoted, whileHover: !hasVoted ? { scale: 1.02 } : {}, whileTap: !hasVoted ? { scale: 0.98 } : {}, className: `w-full p-4 md:p-6 rounded-xl font-bold text-lg md:text-xl transition-all relative overflow-hidden ${isSelected
                                ? 'bg-blue-600 text-white border-2 border-blue-400'
                                : 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30'} ${hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`, children: [showResults && (_jsx(motion.div, { initial: { width: 0 }, animate: { width: `${percentage}%` }, transition: { duration: 0.5 }, className: "absolute inset-0 bg-blue-500/30" })), _jsxs("div", { className: "relative flex items-center justify-between", children: [_jsx("span", { children: option.text }), showResults && (_jsxs("span", { className: "text-sm md:text-base", children: [percentage.toFixed(1), "% (", option.voteCount, ")"] }))] })] }, option.id));
                    }) }), !hasVoted && (_jsx("div", { className: "px-6 md:px-8 pb-6 md:pb-8", children: _jsx(motion.button, { onClick: handleSubmitVote, disabled: selectedOptions.length === 0, whileHover: selectedOptions.length > 0 ? { scale: 1.02 } : {}, whileTap: selectedOptions.length > 0 ? { scale: 0.98 } : {}, className: `w-full py-4 rounded-xl font-bold text-lg md:text-xl transition-all ${selectedOptions.length > 0
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`, children: "Submit Vote" }) })), hasVoted && !showResults && (_jsx("div", { className: "px-6 md:px-8 pb-6 md:pb-8", children: _jsx("div", { className: "bg-green-500/20 border-2 border-green-500 rounded-xl p-4 text-center", children: _jsx("p", { className: "text-white font-bold", children: "\u2713 Vote submitted! Waiting for results..." }) }) }))] }) }));
}
/**
 * RaffleActivityView - Renders raffle interface
 * Requirement: 6.4
 */
function RaffleActivityView({ prizeDescription, hasEntered, onEnter, winners, showWinners, isDrawing, participantName, eventId: _eventId, activityId: _activityId, }) {
    // TODO: Use emit when raffle WebSocket handlers are fully implemented
    // const { emit } = useWebSocket();
    const handleEnter = async () => {
        if (hasEntered)
            return;
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        try {
            const response = await fetch(`${apiBaseUrl}/activities/${_activityId}/enter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: participantName,
                    participantName,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to enter raffle');
            }
            console.log('🎫 Successfully entered raffle via RaffleActivityView');
            onEnter(true);
        }
        catch (error) {
            console.error('Error entering raffle:', error);
        }
    };
    const isWinner = winners.some(w => w.participantName === participantName);
    return (_jsx("div", { className: "max-w-2xl mx-auto px-4 py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 md:px-8 py-6 md:py-8", children: [_jsx("h2", { className: "text-2xl md:text-3xl lg:text-4xl font-bold mb-2", children: "\uD83C\uDF81 Raffle Time! \uD83C\uDF81" }), _jsx("p", { className: "text-lg md:text-xl opacity-90", children: prizeDescription })] }), _jsxs("div", { className: "p-6 md:p-8", children: [isDrawing && (_jsxs(motion.div, { animate: {
                                scale: [1, 1.1, 1],
                                rotate: [0, 360],
                            }, transition: {
                                duration: 2,
                                repeat: Infinity,
                            }, className: "text-center py-12", children: [_jsx("div", { className: "flex justify-center items-center gap-2 mb-4", children: [...Array(3)].map((_, i) => (_jsx(motion.div, { animate: {
                                            scale: [1, 1.3, 1],
                                            rotate: [0, 180, 360],
                                            y: [0, -10, 0],
                                        }, transition: {
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: 'easeInOut',
                                        }, className: "text-4xl", children: "\uD83C\uDF81" }, i))) }), _jsx("p", { className: "text-2xl font-bold text-white", children: "\uD83C\uDFAA Drawing winners... \uD83C\uDFAA" })] })), showWinners && !isDrawing && (_jsxs("div", { className: "space-y-4", children: [isWinner ? (_jsxs(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring', stiffness: 200, damping: 15 }, className: "bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF89" }), _jsx("h3", { className: "text-3xl font-bold text-white mb-2", children: "Congratulations!" }), _jsx("p", { className: "text-xl text-white", children: "You won the raffle!" })] })) : (_jsxs("div", { className: "bg-white/20 rounded-xl p-8 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDE0A" }), _jsx("p", { className: "text-xl text-white", children: "Better luck next time!" })] })), _jsx(RaffleWinnersList, { winners: winners, participantName: participantName })] })), !hasEntered && !showWinners && !isDrawing && (_jsx(motion.button, { onClick: handleEnter, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "w-full py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-xl md:text-2xl hover:from-purple-700 hover:to-pink-700 transition-all", children: "Enter Raffle \uD83C\uDF9F\uFE0F" })), hasEntered && !showWinners && !isDrawing && (_jsxs("div", { className: "bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center", children: [_jsx("div", { className: "text-4xl mb-2", children: "\u2713" }), _jsx("p", { className: "text-xl font-bold text-white", children: "You're entered!" }), _jsx("p", { className: "text-white/80 mt-2", children: "Good luck! Winners will be announced soon." })] }))] })] }) }));
}
/**
 * PollResults - Displays poll results
 */
function PollResults({ results }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-white/80 text-center mb-4", children: ["Total votes: ", results.totalVotes] }), results.options.map((option) => {
                const percentage = results.totalVotes > 0 ? (option.voteCount / results.totalVotes) * 100 : 0;
                return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-white", children: [_jsx("span", { className: "font-medium", children: option.text }), _jsxs("span", { children: [percentage.toFixed(1), "%"] })] }), _jsx("div", { className: "w-full bg-white/20 rounded-full h-4 overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${percentage}%` }, transition: { duration: 0.5 }, className: "bg-blue-500 h-full rounded-full" }) }), _jsxs("p", { className: "text-white/60 text-sm", children: [option.voteCount, " votes"] })] }, option.id));
            })] }));
}
/**
 * RaffleWinnersList - Displays raffle winners
 */
function RaffleWinnersList({ winners, participantName }) {
    return (_jsxs("div", { className: "bg-white/20 rounded-xl p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4 text-center", children: "\uD83C\uDFC6 Winners \uD83C\uDFC6" }), _jsx("div", { className: "space-y-2", children: winners.map((winner, index) => {
                    const isCurrentParticipant = winner.participantName === participantName;
                    return (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, className: `p-4 rounded-lg ${isCurrentParticipant
                            ? 'bg-yellow-500/30 border-2 border-yellow-400'
                            : 'bg-white/10'}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎉' }), _jsxs("span", { className: `font-bold ${isCurrentParticipant ? 'text-yellow-300' : 'text-white'}`, children: [winner.participantName, isCurrentParticipant && ' (You!)'] })] }) }, winner.participantId));
                }) })] }));
}
