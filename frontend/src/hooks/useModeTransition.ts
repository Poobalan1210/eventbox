/**
 * Custom hook for managing quiz mode transitions
 * Implements state machine: draft → setup → live → completed
 */
import { useState, useCallback } from 'react';
import { EventStatus } from '../types/models';

interface ModeTransitionResult {
  success: boolean;
  error?: string;
}

interface UseModeTransitionProps {
  eventId: string;
  currentStatus: EventStatus;
  onStatusChange: (newStatus: EventStatus) => void;
}

interface ModeTransitionHook {
  isTransitioning: boolean;
  transitionError: string | null;
  canTransitionTo: (targetStatus: EventStatus) => boolean;
  transitionTo: (targetStatus: EventStatus) => Promise<ModeTransitionResult>;
  clearError: () => void;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['setup', 'live'], // Allow direct transition to live
  setup: ['live', 'draft'],
  live: ['completed'],
  completed: [],
  waiting: ['active'], // Legacy support
  active: ['completed'], // Legacy support
};

export function useModeTransition({
  eventId,
  currentStatus,
  onStatusChange,
}: UseModeTransitionProps): ModeTransitionHook {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  /**
   * Check if transition to target status is valid
   */
  const canTransitionTo = useCallback(
    (targetStatus: EventStatus): boolean => {
      const validTargets = VALID_TRANSITIONS[currentStatus] || [];
      return validTargets.includes(targetStatus);
    },
    [currentStatus]
  );

  /**
   * Validate quiz before transitioning to live mode
   */
  const validateForLive = async (): Promise<{ valid: boolean; error?: string }> => {
    console.log('[useModeTransition] Starting validation for live mode', { eventId });
    try {
      console.log('[useModeTransition] Fetching event details from:', `${apiBaseUrl}/events/${eventId}`);
      const response = await fetch(`${apiBaseUrl}/events/${eventId}`);
      if (!response.ok) {
        console.error('[useModeTransition] Failed to fetch event details:', response.status);
        return { valid: false, error: 'Failed to load quiz details' };
      }

      const data = await response.json();
      const questions = data.questions || [];
      console.log('[useModeTransition] Loaded questions:', questions.length);

      if (questions.length === 0) {
        console.warn('[useModeTransition] No questions found');
        return {
          valid: false,
          error: 'Cannot start quiz: Add at least one question',
        };
      }

      // Validate each question has correct answer
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`[useModeTransition] Validating question ${i + 1}:`, {
          hasOptions: !!question.options,
          optionsCount: question.options?.length,
          correctOptionId: question.correctOptionId,
        });

        if (!question.options || question.options.length < 2) {
          console.error(`[useModeTransition] Question ${i + 1} has insufficient options`);
          return {
            valid: false,
            error: `Question ${i + 1} must have at least 2 answer options`,
          };
        }

        const hasCorrectAnswer = question.options.some(
          (opt: any) => opt.id === question.correctOptionId
        );
        if (!hasCorrectAnswer) {
          console.error(`[useModeTransition] Question ${i + 1} missing correct answer`);
          return {
            valid: false,
            error: `Question ${i + 1} must have a correct answer selected`,
          };
        }
      }

      console.log('[useModeTransition] Validation passed');
      return { valid: true };
    } catch (error) {
      console.error('[useModeTransition] Validation error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  };

  /**
   * Transition to a new status with validation and rollback
   */
  const transitionTo = useCallback(
    async (targetStatus: EventStatus): Promise<ModeTransitionResult> => {
      console.log('[useModeTransition] transitionTo called', { currentStatus, targetStatus, eventId });
      
      // Clear previous errors
      setTransitionError(null);

      // Check if transition is valid
      if (!canTransitionTo(targetStatus)) {
        const error = `Invalid transition: Cannot go from ${currentStatus} to ${targetStatus}`;
        console.error('[useModeTransition]', error);
        setTransitionError(error);
        return { success: false, error };
      }

      // Validate before transitioning to live
      if (targetStatus === 'live') {
        console.log('[useModeTransition] Validating for live mode...');
        const validation = await validateForLive();
        if (!validation.valid) {
          console.error('[useModeTransition] Validation failed:', validation.error);
          setTransitionError(validation.error!);
          return { success: false, error: validation.error };
        }
        console.log('[useModeTransition] Validation successful');
      }

      setIsTransitioning(true);
      console.log('[useModeTransition] Starting transition...');

      try {
        // For demo purposes, using a hardcoded organizerId
        // In production, this would come from authentication context
        const organizerId = 'demo-organizer-123';
        const url = `${apiBaseUrl}/events/${eventId}/status`;
        
        console.log('[useModeTransition] Making API request:', {
          url,
          method: 'PATCH',
          organizerId,
          targetStatus,
        });

        // Make API call to update status
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify({ status: targetStatus }),
        });

        console.log('[useModeTransition] API response:', {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[useModeTransition] API error response:', errorData);
          
          // Handle validation errors with details
          if (errorData.details && Array.isArray(errorData.details)) {
            const errorMessages = errorData.details.map((d: any) => d.message).join(', ');
            throw new Error(errorMessages || errorData.message || 'Failed to update quiz status');
          }
          
          throw new Error(errorData.message || 'Failed to update quiz status');
        }

        console.log('[useModeTransition] Transition successful');
        // Success - update local state
        onStatusChange(targetStatus);
        return { success: true };
      } catch (error) {
        console.error('[useModeTransition] Mode transition error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to transition mode';
        setTransitionError(errorMessage);
        
        // Rollback is handled by not calling onStatusChange
        // The UI will remain in the current state
        
        return { success: false, error: errorMessage };
      } finally {
        setIsTransitioning(false);
        console.log('[useModeTransition] Transition complete');
      }
    },
    [eventId, currentStatus, canTransitionTo, onStatusChange, apiBaseUrl]
  );

  const clearError = useCallback(() => {
    setTransitionError(null);
  }, []);

  return {
    isTransitioning,
    transitionError,
    canTransitionTo,
    transitionTo,
    clearError,
  };
}
