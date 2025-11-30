/**
 * Hook to handle raffle activity events
 * 
 * This hook manages raffle-specific WebSocket events including
 * raffle start, entry confirmation, drawing, winner announcement, and raffle end.
 * 
 * Requirements: 4.1, 6.5
 */
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import type {
  RaffleStartedPayload,
  RaffleEntryConfirmedPayload,
  RaffleDrawingPayload,
  RaffleWinnersAnnouncedPayload,
  RaffleEndedPayload,
  RaffleWinner,
} from '../types/websocket';

export interface RaffleState {
  activityId: string | null;
  prizeDescription: string;
  hasEntered: boolean;
  isDrawing: boolean;
  winners: RaffleWinner[];
  isActive: boolean;
  isEnded: boolean;
  lastUpdate: number;
}

export interface UseRaffleEventsOptions {
  activityId?: string;
  participantId?: string;
  onRaffleStarted?: (prizeDescription: string) => void;
  onEntryConfirmed?: (participantId: string) => void;
  onDrawing?: () => void;
  onWinnersAnnounced?: (winners: RaffleWinner[]) => void;
  onRaffleEnded?: () => void;
}

/**
 * Hook to handle raffle activity events
 * 
 * @param options - Configuration options
 * @returns Current raffle state and control functions
 */
export const useRaffleEvents = (options: UseRaffleEventsOptions = {}) => {
  const {
    activityId,
    participantId,
    onRaffleStarted,
    onEntryConfirmed,
    onDrawing,
    onWinnersAnnounced,
    onRaffleEnded,
  } = options;
  const { on } = useWebSocket();

  const [state, setState] = useState<RaffleState>({
    activityId: null,
    prizeDescription: '',
    hasEntered: false,
    isDrawing: false,
    winners: [],
    isActive: false,
    isEnded: false,
    lastUpdate: Date.now(),
  });

  // Handle raffle started
  useEffect(() => {
    const cleanup = on('raffle-started', (payload: RaffleStartedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState({
          activityId: payload.activityId,
          prizeDescription: payload.prizeDescription,
          hasEntered: false,
          isDrawing: false,
          winners: [],
          isActive: true,
          isEnded: false,
          lastUpdate: Date.now(),
        });

        onRaffleStarted?.(payload.prizeDescription);
      }
    });

    return cleanup;
  }, [on, activityId, onRaffleStarted]);

  // Handle entry confirmed
  useEffect(() => {
    const cleanup = on('raffle-entry-confirmed', (payload: RaffleEntryConfirmedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        // Mark as entered if this is our participant
        if (participantId && payload.participantId === participantId) {
          setState((prev) => ({
            ...prev,
            hasEntered: true,
            lastUpdate: Date.now(),
          }));
        }

        onEntryConfirmed?.(payload.participantId);
      }
    });

    return cleanup;
  }, [on, activityId, participantId, onEntryConfirmed]);

  // Handle drawing started
  useEffect(() => {
    const cleanup = on('raffle-drawing', (payload: RaffleDrawingPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState((prev) => ({
          ...prev,
          isDrawing: true,
          lastUpdate: Date.now(),
        }));

        onDrawing?.();
      }
    });

    return cleanup;
  }, [on, activityId, onDrawing]);

  // Handle winners announced
  useEffect(() => {
    const cleanup = on('raffle-winners-announced', (payload: RaffleWinnersAnnouncedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState((prev) => ({
          ...prev,
          winners: payload.winners,
          isDrawing: false,
          lastUpdate: Date.now(),
        }));

        onWinnersAnnounced?.(payload.winners);
      }
    });

    return cleanup;
  }, [on, activityId, onWinnersAnnounced]);

  // Handle raffle ended
  useEffect(() => {
    const cleanup = on('raffle-ended', (payload: RaffleEndedPayload) => {
      // Only update if this is for our activity (or no activity filter specified)
      if (!activityId || payload.activityId === activityId) {
        setState((prev) => ({
          ...prev,
          isActive: false,
          isEnded: true,
          lastUpdate: Date.now(),
        }));

        onRaffleEnded?.();
      }
    });

    return cleanup;
  }, [on, activityId, onRaffleEnded]);

  // Helper to enter the raffle
  const enterRaffle = useCallback(() => {
    if (!state.activityId) {
      console.warn('Cannot enter raffle: no active raffle');
      return;
    }

    if (state.hasEntered) {
      console.warn('Cannot enter raffle: already entered');
      return;
    }

    // Emit entry to server (actual implementation would use proper event)
    // Note: This would typically be handled by a REST API call
    // but included here for completeness
    console.log('Entering raffle:', { activityId: state.activityId });
  }, [state.activityId, state.hasEntered]);

  // Helper to check if participant is a winner
  const isWinner = useCallback(
    (checkParticipantId?: string): boolean => {
      const idToCheck = checkParticipantId || participantId;
      if (!idToCheck) return false;
      return state.winners.some((winner) => winner.participantId === idToCheck);
    },
    [state.winners, participantId]
  );

  // Helper to get winner by participant ID
  const getWinner = useCallback(
    (checkParticipantId: string): RaffleWinner | undefined => {
      return state.winners.find((winner) => winner.participantId === checkParticipantId);
    },
    [state.winners]
  );

  // Helper to get total number of winners
  const getWinnerCount = useCallback((): number => {
    return state.winners.length;
  }, [state.winners]);

  return {
    ...state,
    enterRaffle,
    isWinner,
    getWinner,
    getWinnerCount,
  };
};
