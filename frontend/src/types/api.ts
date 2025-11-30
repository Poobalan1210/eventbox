/**
 * API request and response types for frontend
 */

import { Activity, ActivityType, ActivityStatus, PollOption } from './models';

/**
 * POST /api/events/:eventId/activities - Create activity
 */
export interface CreateActivityRequest {
  name: string;
  type: ActivityType;
  // Quiz-specific config
  scoringEnabled?: boolean;
  speedBonusEnabled?: boolean;
  streakTrackingEnabled?: boolean;
  // Poll-specific config
  question?: string;
  options?: string[];
  allowMultipleVotes?: boolean;
  showResultsLive?: boolean;
  // Raffle-specific config
  prizeDescription?: string;
  entryMethod?: 'automatic' | 'manual';
  winnerCount?: number;
}

export interface CreateActivityResponse {
  activityId: string;
  activity: Activity;
}

/**
 * GET /api/events/:eventId/activities - List activities
 */
export interface GetActivitiesResponse {
  activities: Activity[];
}

/**
 * GET /api/activities/:activityId - Get activity details
 */
export interface GetActivityResponse {
  activity: Activity;
}

/**
 * PUT /api/activities/:activityId - Update activity
 */
export interface UpdateActivityRequest {
  name?: string;
  status?: ActivityStatus;
  // Quiz-specific updates
  scoringEnabled?: boolean;
  speedBonusEnabled?: boolean;
  streakTrackingEnabled?: boolean;
  // Poll-specific updates
  question?: string;
  options?: string[];
  allowMultipleVotes?: boolean;
  showResultsLive?: boolean;
  // Raffle-specific updates
  prizeDescription?: string;
  entryMethod?: 'automatic' | 'manual';
  winnerCount?: number;
}

export interface UpdateActivityResponse {
  success: boolean;
  activity: Activity;
}

/**
 * DELETE /api/activities/:activityId - Delete activity
 */
export interface DeleteActivityResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/activate - Activate activity
 */
export interface ActivateActivityResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/deactivate - Deactivate activity
 */
export interface DeactivateActivityResponse {
  success: boolean;
}

/**
 * Poll results structure
 */
export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: PollOption[];
}

/**
 * Raffle winner information
 */
export interface RaffleWinner {
  participantId: string;
  participantName: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Array<{
    path: string;
    message: string;
  }>;
}
