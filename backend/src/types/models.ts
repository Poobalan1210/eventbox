/**
 * Core data models for the Live Quiz Event System
 */

/**
 * Event status enum - Extended for organizer workflow
 */
export type EventStatus = 'draft' | 'setup' | 'live' | 'completed' | 'waiting' | 'active';

/**
 * Event visibility enum
 */
export type EventVisibility = 'private' | 'public';

/**
 * Event - Represents a quiz event session
 */
export interface Event {
  eventId: string; // DynamoDB partition key
  id: string; // Alias for eventId (for backward compatibility)
  name: string;
  gamePin: string; // 6-digit numeric PIN for joining
  organizerId: string;
  status: EventStatus;
  currentQuestionIndex: number;
  createdAt: number;
  joinLink: string;
  
  // New fields for organizer UX improvements
  visibility: EventVisibility; // Privacy control: private or public
  isTemplate: boolean; // Whether this event is a template
  templateName?: string; // Name of the template (if isTemplate is true)
  lastModified: number; // Timestamp of last modification
  startedAt?: number; // Timestamp when quiz was started (transitioned to live)
  completedAt?: number; // Timestamp when quiz was completed
  participantCount: number; // Current number of participants
  topic?: string; // Quiz topic/category
  description?: string; // Quiz description
  activeActivityId?: string | null; // Currently active activity (for event-activities platform)
}

/**
 * AnswerOption - Represents a single answer choice for a question
 */
export interface AnswerOption {
  id: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple';
  shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'pentagon';
}

/**
 * Question - Represents a quiz question with multiple answer options
 */
export interface Question {
  questionId: string; // DynamoDB sort key
  id: string; // Alias for questionId (for backward compatibility)
  eventId: string;
  text: string;
  imageUrl?: string; // Optional S3/CloudFront URL for question image
  options: AnswerOption[];
  correctOptionId: string;
  timerSeconds?: number;
  order: number;
}

/**
 * Participant - Represents a quiz participant
 */
export interface Participant {
  id: string;
  participantId: string; // DynamoDB sort key
  eventId: string; // DynamoDB partition key
  name: string;
  score: number;
  totalAnswerTime: number;
  currentStreak: number; // Consecutive correct answers
  longestStreak: number; // Best streak achieved
  answers: Answer[];
  joinedAt: number;
}

/**
 * Answer - Represents a participant's answer to a question
 */
export interface Answer {
  participantId: string;
  questionId: string;
  eventId: string;
  selectedOptionId: string;
  responseTime: number;
  isCorrect: boolean;
  pointsEarned: number; // Points awarded (500-1000 for correct, 0 for incorrect)
  submittedAt: number;
}

/**
 * ParticipantScore - Represents a participant's score for leaderboard display
 */
export interface ParticipantScore {
  rank: number;
  name: string;
  score: number;
  totalAnswerTime: number;
}

/**
 * GamePin - Represents a game PIN for quick event access
 */
export interface GamePin {
  gamePin: string; // DynamoDB partition key - 6-digit numeric code
  eventId: string;
  createdAt: number;
  expiresAt: number; // TTL attribute for automatic deletion after 24 hours
}

/**
 * AnswerStatistics - Aggregated data showing the distribution of answers
 */
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

/**
 * PollVote - Represents a participant's vote in a poll
 */
export interface PollVote {
  voteId: string;
  pollId: string;
  participantId: string;
  selectedOptionIds: string[];
  submittedAt: number;
}

/**
 * RaffleEntry - Represents a participant's entry in a raffle
 */
export interface RaffleEntry {
  entryId: string;
  raffleId: string;
  participantId: string;
  participantName: string;
  enteredAt: number;
}
