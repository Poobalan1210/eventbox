/**
 * Data model types for the quiz system
 */

/**
 * Event status enum - Extended for organizer workflow
 */
export type EventStatus = 'draft' | 'setup' | 'live' | 'completed' | 'waiting' | 'active';

/**
 * Event visibility enum
 */
export type EventVisibility = 'private' | 'public';

export interface Event {
  eventId: string;
  name: string;
  gamePin?: string; // Optional for backward compatibility
  organizerId: string;
  status: EventStatus;
  currentQuestionIndex: number;
  createdAt: number;
  joinLink: string;
  
  // New fields for organizer UX improvements
  visibility?: EventVisibility;
  isTemplate?: boolean;
  templateName?: string;
  lastModified?: number;
  startedAt?: number;
  completedAt?: number;
  participantCount?: number;
  topic?: string;
  description?: string;
}

export interface AnswerOption {
  id: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple';
  shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'pentagon';
}

export interface Question {
  id: string;
  eventId: string;
  text: string;
  imageUrl?: string; // Optional S3/CloudFront URL for question image
  options: AnswerOption[];
  correctOptionId: string;
  timerSeconds?: number;
  order: number;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  score: number;
  totalAnswerTime: number;
  answers: Answer[];
  joinedAt: number;
}

export interface Answer {
  participantId: string;
  questionId: string;
  eventId: string;
  selectedOptionId: string;
  responseTime: number;
  isCorrect: boolean;
  submittedAt: number;
}

export interface ParticipantScore {
  rank: number;
  name: string;
  score: number;
  totalAnswerTime: number;
}

export interface AnswerStatistics {
  questionId: string;
  totalResponses: number;
  optionCounts: {
    [optionId: string]: {
      count: number;
      percentage: number;
    };
  };
  correctOptionId: string;
}

/**
 * Activity Types - For event-activities platform
 */

/**
 * ActivityType - The type of activity within an event
 */
export type ActivityType = 'quiz' | 'poll' | 'raffle';

/**
 * ActivityStatus - The current status of an activity
 */
export type ActivityStatus = 'draft' | 'ready' | 'active' | 'completed';

/**
 * BaseActivity - Common fields for all activity types
 */
export interface BaseActivity {
  activityId: string;
  eventId: string;
  type: ActivityType;
  name: string;
  status: ActivityStatus;
  order: number; // Display order in event
  createdAt: number;
  lastModified: number;
}

/**
 * QuizActivity - A quiz activity within an event
 */
export interface QuizActivity extends BaseActivity {
  type: 'quiz';
  questions: Question[];
  currentQuestionIndex: number;
  scoringEnabled: boolean;
  speedBonusEnabled: boolean;
  streakTrackingEnabled: boolean;
}

/**
 * PollOption - A single option in a poll
 */
export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

/**
 * PollActivity - A poll activity within an event
 */
export interface PollActivity extends BaseActivity {
  type: 'poll';
  question: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  showResultsLive: boolean;
}

/**
 * RaffleActivity - A raffle activity within an event
 */
export interface RaffleActivity extends BaseActivity {
  type: 'raffle';
  prizeDescription: string;
  entryMethod: 'automatic' | 'manual';
  winnerCount: number;
  winners: string[]; // Participant IDs
}

/**
 * Activity - Union type for all activity types
 */
export type Activity = QuizActivity | PollActivity | RaffleActivity;
