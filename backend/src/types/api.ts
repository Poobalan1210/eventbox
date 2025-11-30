/**
 * API request and response types for REST endpoints
 */

import {
  Question,
  AnswerOption,
  Activity,
  ActivityType,
  ActivityStatus,
  PollOption,
} from './models.js';

/**
 * POST /api/events - Create new event
 */
export interface CreateEventRequest {
  name: string;
  organizerId: string;
  visibility?: 'private' | 'public';
}

export interface CreateEventResponse {
  eventId: string;
  gamePin: string;
  joinLink: string;
  qrCode: string;
}

/**
 * GET /api/events/:eventId - Get event details
 */
export interface GetEventResponse {
  id: string;
  name: string;
  gamePin?: string;
  status: string;
  questions: Question[];
}

/**
 * GET /api/events/by-pin/:gamePin - Get event by game PIN
 */
export interface GetEventByPinResponse {
  eventId: string;
  name: string;
}

/**
 * POST /api/events/:eventId/questions - Add question to event
 */
export interface CreateQuestionRequest {
  text: string;
  options: AnswerOption[];
  correctOptionId: string;
  timerSeconds?: number;
}

export interface CreateQuestionResponse {
  questionId: string;
}

/**
 * PUT /api/events/:eventId/questions/:questionId - Update question
 */
export interface UpdateQuestionRequest {
  text: string;
  options: AnswerOption[];
  correctOptionId: string;
  timerSeconds?: number;
}

export interface UpdateQuestionResponse {
  success: boolean;
}

/**
 * DELETE /api/events/:eventId/questions/:questionId - Delete question
 */
export interface DeleteQuestionResponse {
  success: boolean;
}

/**
 * GET /api/events/organizer/:organizerId - Get all quizzes for organizer
 */
export interface QuizHistoryEntry {
  eventId: string;
  name: string;
  status: 'live' | 'upcoming' | 'completed';
  participantCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  visibility: 'private' | 'public';
  topic?: string;
  description?: string;
  lastModified: number;
}

export interface GetOrganizerQuizzesResponse {
  quizzes: QuizHistoryEntry[];
}

/**
 * PATCH /api/events/:eventId/status - Update event status
 */
export interface UpdateEventStatusRequest {
  status: 'draft' | 'setup' | 'live' | 'completed';
}

export interface UpdateEventStatusResponse {
  success: boolean;
}

/**
 * PATCH /api/events/:eventId/visibility - Update event visibility
 */
export interface UpdateEventVisibilityRequest {
  visibility: 'private' | 'public';
}

export interface UpdateEventVisibilityResponse {
  success: boolean;
}

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

/**
 * Type-specific activity creation requests
 */
export interface CreateQuizActivityRequest {
  name: string;
  type: 'quiz';
  scoringEnabled?: boolean;
  speedBonusEnabled?: boolean;
  streakTrackingEnabled?: boolean;
}

export interface CreatePollActivityRequest {
  name: string;
  type: 'poll';
  question?: string;
  options?: string[];
  allowMultipleVotes?: boolean;
  showResultsLive?: boolean;
}

export interface CreateRaffleActivityRequest {
  name: string;
  type: 'raffle';
  prizeDescription?: string;
  entryMethod?: 'automatic' | 'manual';
  winnerCount?: number;
}

export interface CreateActivityResponse {
  activityId: string;
  activity: Activity;
}

/**
 * Activity response wrapper
 */
export interface ActivityResponse {
  activityId: string;
  eventId: string;
  type: ActivityType;
  name: string;
  status: ActivityStatus;
  order: number;
  createdAt: number;
  lastModified: number;
  // Type-specific fields will be included based on activity type
  [key: string]: any;
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
 * POST /api/activities/:activityId/configure-poll - Configure poll
 */
export interface ConfigurePollRequest {
  question: string;
  options: string[];
}

export interface ConfigurePollResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/start-poll - Start poll
 */
export interface StartPollResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/vote - Submit vote
 */
export interface SubmitVoteRequest {
  participantId: string;
  optionIds: string[];
}

export interface SubmitVoteResponse {
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
 * GET /api/activities/:activityId/poll-results - Get poll results
 */
export interface GetPollResultsResponse {
  results: PollResults;
}

/**
 * POST /api/activities/:activityId/end-poll - End poll
 */
export interface EndPollResponse {
  success: boolean;
  results: PollResults;
}

/**
 * POST /api/activities/:activityId/configure-raffle - Configure raffle
 */
export interface ConfigureRaffleRequest {
  prizeDescription: string;
  entryMethod: 'automatic' | 'manual';
  winnerCount: number;
}

export interface ConfigureRaffleResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/start-raffle - Start raffle
 */
export interface StartRaffleResponse {
  success: boolean;
}

/**
 * POST /api/activities/:activityId/enter - Enter raffle
 */
export interface EnterRaffleRequest {
  participantId: string;
  participantName: string;
}

export interface EnterRaffleResponse {
  success: boolean;
}

/**
 * Raffle winner information
 */
export interface RaffleWinner {
  participantId: string;
  participantName: string;
}

/**
 * Raffle results structure
 */
export interface RaffleResults {
  raffleId: string;
  prizeDescription: string;
  totalEntries: number;
  winnerCount: number;
  winners: RaffleWinner[];
}

/**
 * POST /api/activities/:activityId/draw-winners - Draw raffle winners
 */
export interface DrawWinnersRequest {
  count?: number;
}

export interface DrawWinnersResponse {
  success: boolean;
  winners: RaffleWinner[];
}

/**
 * POST /api/activities/:activityId/end-raffle - End raffle
 */
export interface EndRaffleResponse {
  success: boolean;
  results: RaffleResults;
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
