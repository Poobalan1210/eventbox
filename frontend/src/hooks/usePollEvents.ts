/**
 * Hook to handle poll activity events
 * 
 * This hook manages poll-specific WebSocket events including
 * poll start, vote submission, results updates, and poll end.
 * 
 * Requirements: 4.1, 6.5
 */
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import type { PollOption } from '../types/models';
import type {
  PollStartedPayload,
  PollVoteSubmittedPayload,
  PollResultsUpdatedPayload,
  PollEndedPayload,
} from '../types/websocket';

export interface PollState {
  activityId: string | null;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  isActive: boolean;
  isEnded: boolean;
  lastUpdate: number;
}

export interface UsePollEventsOptions {
  activityId?: string;
  participantId?: string;
  onPollStarted?: (question: string, options: PollOption[]) => void;
  onVoteSubmitted?: (participantId: string) => void;
  onResultsUpdated?: (results: { totalVotes: number; options: PollOption[] }) => void;
  onPollEnded?: (finalResults: { totalVotes: number; options: PollOption[] }) => void;
}

/**
 * Hook to handle poll activity events
 * 
 * @param options - Configuration options
 * @returns Current poll state and control functions
 */
export const usePollEvents = (options: UsePollEventsOptions = {}) => {
  const { activityId, participantId, onPollStarted, onVoteSubmitted, onResultsUpdated, onPollEnded } = options;
  const { on } = useWebSocket();

  const [state, setState] = useState<PollState>({
    activityId: null,
    question: '',
    options: [],
    totalVotes: 0,
    hasVoted: false,
    isActive: false,
    isEnded: false,
    lastUpdate: Date.now(),
  });

  // Handle poll started
  useEffect(() => {
    const cleanup = on('poll-started', (payload: PollStartedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState({
          activityId: payload.activityId,
          question: payload.question,
          options: payload.options,
          totalVotes: 0,
          hasVoted: false,
          isActive: true,
          isEnded: false,
          lastUpdate: Date.now(),
        });

        onPollStarted?.(payload.question, payload.options);
      }
    });

    return cleanup;
  }, [on, activityId, onPollStarted]);

  // Handle vote submitted
  useEffect(() => {
    const cleanup = on('poll-vote-submitted', (payload: PollVoteSubmittedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        // Mark as voted if this is our participant
        if (participantId && payload.participantId === participantId) {
          setState((prev) => ({
            ...prev,
            hasVoted: true,
            lastUpdate: Date.now(),
          }));
        }

        onVoteSubmitted?.(payload.participantId);
      }
    });

    return cleanup;
  }, [on, activityId, participantId, onVoteSubmitted]);

  // Handle results updated
  useEffect(() => {
    const cleanup = on('poll-results-updated', (payload: PollResultsUpdatedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState((prev) => ({
          ...prev,
          options: payload.results.options,
          totalVotes: payload.results.totalVotes,
          lastUpdate: Date.now(),
        }));

        onResultsUpdated?.(payload.results);
      }
    });

    return cleanup;
  }, [on, activityId, onResultsUpdated]);

  // Handle poll ended
  useEffect(() => {
    const cleanup = on('poll-ended', (payload: PollEndedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState((prev) => ({
          ...prev,
          options: payload.finalResults.options,
          totalVotes: payload.finalResults.totalVotes,
          isActive: false,
          isEnded: true,
          lastUpdate: Date.now(),
        }));

        onPollEnded?.(payload.finalResults);
      }
    });

    return cleanup;
  }, [on, activityId, onPollEnded]);

  // Helper to submit a vote
  const submitVote = useCallback(
    (selectedOptionIds: string[]) => {
      if (!state.activityId) {
        console.warn('Cannot submit vote: no active poll');
        return;
      }

      if (state.hasVoted) {
        console.warn('Cannot submit vote: already voted');
        return;
      }

      // Emit vote to server (actual implementation would use proper event)
      // Note: This would typically be handled by a REST API call
      // but included here for completeness
      console.log('Submitting vote:', { activityId: state.activityId, selectedOptionIds });
    },
    [state.activityId, state.hasVoted]
  );

  // Helper to get option by id
  const getOption = useCallback(
    (optionId: string): PollOption | undefined => {
      return state.options.find((opt) => opt.id === optionId);
    },
    [state.options]
  );

  // Helper to get vote percentage for an option
  const getOptionPercentage = useCallback(
    (optionId: string): number => {
      if (state.totalVotes === 0) return 0;
      const option = state.options.find((opt) => opt.id === optionId);
      return option ? (option.voteCount / state.totalVotes) * 100 : 0;
    },
    [state.options, state.totalVotes]
  );

  // Helper to get the leading option
  const getLeadingOption = useCallback((): PollOption | null => {
    if (state.options.length === 0) return null;
    return state.options.reduce((prev, current) =>
      current.voteCount > prev.voteCount ? current : prev
    );
  }, [state.options]);

  return {
    ...state,
    submitVote,
    getOption,
    getOptionPercentage,
    getLeadingOption,
  };
};
