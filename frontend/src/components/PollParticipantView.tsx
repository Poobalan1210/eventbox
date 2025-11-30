/**
 * PollParticipantView - Poll participant interface
 * 
 * This component renders the poll interface for participants, allowing them to:
 * - View the poll question
 * - Select one or multiple options (based on poll settings)
 * - Submit their vote
 * - View live results (if enabled)
 * - See vote confirmation feedback
 * 
 * Requirement: 6.3
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { PollOption } from '../types/models';
import type {
  PollStartedPayload,
  PollResultsUpdatedPayload,
  PollEndedPayload,
} from '../types/websocket';

interface PollParticipantViewProps {
  eventId: string;
  activityId: string;
  participantName: string;
}

export default function PollParticipantView({
  eventId: _eventId, // Used for future WebSocket room management
  activityId,
  participantName,
}: PollParticipantViewProps) {
  const { on } = useWebSocket();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  console.log('PollParticipantView props:', { activityId, participantName });
  
  // Poll state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [showResultsLive, setShowResultsLive] = useState(true);
  const [results, setResults] = useState<{ totalVotes: number; options: PollOption[] } | null>(null);
  const [isPollEnded, setIsPollEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current poll state when component mounts
  useEffect(() => {
    const fetchPollState = async () => {
      try {
        console.log('Fetching poll state for activity:', activityId);
        const response = await fetch(`${apiBaseUrl}/activities/${activityId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Poll activity data:', data);
          
          if (data.activity && data.activity.type === 'poll') {
            const pollActivity = data.activity;
            console.log('Setting poll data:', {
              question: pollActivity.question,
              options: pollActivity.options,
              allowMultipleVotes: pollActivity.allowMultipleVotes,
              showResultsLive: pollActivity.showResultsLive,
              status: pollActivity.status
            });
            setQuestion(pollActivity.question || '');
            setOptions(pollActivity.options || []);
            setAllowMultipleVotes(pollActivity.allowMultipleVotes || false);
            setShowResultsLive(pollActivity.showResultsLive || false);
            
            // Check if poll is active and get current results if available
            if (pollActivity.status === 'active' && pollActivity.showResultsLive) {
              // Fetch current results
              try {
                const resultsResponse = await fetch(`${apiBaseUrl}/activities/${activityId}/poll-results`);
                if (resultsResponse.ok) {
                  const resultsData = await resultsResponse.json();
                  setResults(resultsData.results);
                }
              } catch (error) {
                console.log('No current results available');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching poll state:', error);
      }
    };

    fetchPollState();
  }, [activityId, apiBaseUrl]);

  // Listen for poll-started event
  useEffect(() => {
    const cleanup = on('poll-started', (payload: PollStartedPayload) => {
      console.log('Poll started:', payload);
      setQuestion(payload.question);
      setOptions(payload.options);
      setSelectedOptions([]);
      setHasVoted(false);
      setResults(null);
      setIsPollEnded(false);
    });

    return cleanup;
  }, [on]);

  // Listen for poll-results-updated event
  useEffect(() => {
    const cleanup = on('poll-results-updated', (payload: PollResultsUpdatedPayload) => {
      console.log('Poll results updated:', payload);
      if (payload.activityId === activityId) {
        setResults(payload.results);
      }
    });

    return cleanup;
  }, [on, activityId]);

  // Listen for poll-ended event
  useEffect(() => {
    const cleanup = on('poll-ended', (payload: PollEndedPayload) => {
      console.log('Poll ended:', payload);
      if (payload.activityId === activityId) {
        setResults(payload.finalResults);
        setIsPollEnded(true);
      }
    });

    return cleanup;
  }, [on, activityId]);

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isSubmitting) return;
    
    if (allowMultipleVotes) {
      // Multiple selection mode
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      // Single selection mode
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || hasVoted || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit vote via API
      const response = await fetch(
        `${apiBaseUrl}/activities/${activityId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: participantName, // Using participantName as participantId for now
            optionIds: selectedOptions,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit vote');
      }
      
      setHasVoted(true);
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showResults = (showResultsLive && hasVoted) || isPollEnded;

  console.log('Rendering poll with:', { 
    question, 
    optionsCount: options.length, 
    hasVoted, 
    showResults,
    selectedOptions 
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-8 h-8 md:w-10 md:h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Poll
            </h2>
          </div>
          <p className="text-lg md:text-xl lg:text-2xl font-medium">
            {question}
          </p>
        </div>

        {/* Options */}
        <div className="p-6 md:p-8 space-y-3 md:space-y-4">
          <AnimatePresence mode="wait">
            {options.map((option, index) => {
              const isSelected = selectedOptions.includes(option.id);
              const percentage = results && results.totalVotes > 0
                ? (option.voteCount / results.totalVotes) * 100
                : 0;
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={hasVoted || isSubmitting}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!hasVoted && !isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!hasVoted && !isSubmitting ? { scale: 0.98 } : {}}
                  className={`w-full p-4 md:p-5 rounded-xl font-bold text-base md:text-lg transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-2 border-blue-400 shadow-lg'
                      : 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30 hover:border-white/50'
                  } ${hasVoted || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Vote percentage bar (shown when results are visible) */}
                  {showResults && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-500/40"
                    />
                  )}
                  
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Option number badge */}
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full text-sm md:text-base font-bold">
                        {index + 1}
                      </span>
                      
                      {/* Option text */}
                      <span className="text-left break-words">{option.text}</span>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && !showResults && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex-shrink-0"
                      >
                        <svg
                          className="w-6 h-6 md:w-7 md:h-7"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.div>
                    )}
                    
                    {/* Results display */}
                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex-shrink-0 text-right"
                      >
                        <div className="text-lg md:text-xl font-bold">
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs md:text-sm opacity-90">
                          {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          
          {/* Multiple votes hint */}
          {allowMultipleVotes && !hasVoted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm md:text-base text-white/70 text-center pt-2"
            >
              ℹ️ You can select multiple options
            </motion.p>
          )}
        </div>

        {/* Submit button */}
        {!hasVoted && !isPollEnded && (
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <motion.button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || isSubmitting}
              whileHover={selectedOptions.length > 0 && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={selectedOptions.length > 0 && !isSubmitting ? { scale: 0.98 } : {}}
              className={`w-full py-4 md:py-5 rounded-xl font-bold text-lg md:text-xl transition-all shadow-lg ${
                selectedOptions.length > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
                  : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <>
                  {selectedOptions.length === 0 ? (
                    '⚠️ Select an option to vote'
                  ) : (
                    `✓ Submit Vote (${selectedOptions.length} selected)`
                  )}
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Voted confirmation */}
        {hasVoted && !showResults && !isPollEnded && (
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 md:p-5 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-lg md:text-xl font-bold text-white">
                  Vote Submitted!
                </p>
              </div>
              <p className="text-sm md:text-base text-white/80">
                {showResultsLive
                  ? 'Results will be shown live'
                  : 'Waiting for results...'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Results summary */}
        {showResults && results && (
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/20"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg md:text-xl font-bold text-white">
                  📊 Results
                </h3>
                <p className="text-sm md:text-base text-white/80">
                  Total votes: <span className="font-bold">{results.totalVotes}</span>
                </p>
              </div>
              
              {isPollEnded && (
                <p className="text-sm md:text-base text-white/70 text-center mt-3">
                  Thanks for voting, {participantName}! 🎉
                </p>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
