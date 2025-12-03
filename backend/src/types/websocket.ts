/**
 * WebSocket event payload types for Socket.io communication
 */

import {
  Question,
  Participant,
  ParticipantScore,
  AnswerStatistics,
  Activity,
  PollOption,
} from './models.js';
import { RaffleWinner } from './api.js';

/**
 * Client to Server Events
 */

export interface JoinEventPayload {
  eventId: string;
  participantName: string;
}

export interface StartQuizPayload {
  activityId: string;
}

export interface NextQuestionPayload {
  activityId: string;
  questionId: string;
}

export interface SubmitAnswerPayload {
  activityId: string;
  questionId: string;
  answerId: string;
  responseTime: number;
}

export interface EndQuizPayload {
  activityId: string;
}

export interface GetNicknameSuggestionsPayload {
  count?: number;
}

/**
 * Server to Client Events
 */

export interface ParticipantJoinedPayload {
  participantId: string;
  participantName: string;
}

export interface ParticipantsUpdatedPayload {
  participants: Participant[];
}

export interface QuizStartedPayload {
  activityId: string;
  eventId: string;
}

export interface QuestionDisplayedPayload {
  activityId: string;
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  startTime: number;
}

export interface TimerTickPayload {
  remainingSeconds: number;
}

export interface QuestionEndedPayload {
  activityId: string;
  questionId: string;
}

export interface AnswerResultPayload {
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionId: string;
  currentStreak: number;
}

export interface AnswerStatisticsPayload {
  activityId: string;
  statistics: AnswerStatistics;
}

export interface LeaderboardUpdatedPayload {
  activityId: string;
  leaderboard: ParticipantScore[];
}

export interface QuizEndedPayload {
  activityId: string;
  finalLeaderboard: ParticipantScore[];
  topThree: ParticipantScore[];
}

export interface ErrorPayload {
  message: string;
}

export interface NicknameSuggestionsPayload {
  suggestions: string[];
}

export interface QuizStatusChangedPayload {
  eventId: string;
  status: 'draft' | 'setup' | 'live' | 'completed';
  timestamp: number;
}

export interface QuizMetadataUpdatedPayload {
  eventId: string;
  name?: string;
  topic?: string;
  description?: string;
  visibility?: 'private' | 'public';
  lastModified: number;
}

export interface JoinOrganizerPayload {
  organizerId: string;
}

export interface JoinEventAsOrganizerPayload {
  eventId: string;
}

/**
 * Activity Lifecycle Events
 */

export interface ActivityActivatedPayload {
  eventId: string;
  activity: Activity;
}

export interface ActivityDeactivatedPayload {
  eventId: string;
  activityId: string;
}

export interface ActivityUpdatedPayload {
  eventId: string;
  activity: Activity;
}

export interface WaitingForActivityPayload {
  eventId: string;
  message: string;
}

/**
 * Poll Events
 */

export interface PollStartedPayload {
  activityId: string;
  question: string;
  options: PollOption[];
}

export interface PollVoteSubmittedPayload {
  activityId: string;
  participantId: string;
}

export interface PollResultsUpdatedPayload {
  activityId: string;
  results: {
    totalVotes: number;
    options: PollOption[];
  };
}

export interface PollEndedPayload {
  activityId: string;
  finalResults: {
    totalVotes: number;
    options: PollOption[];
  };
}

/**
 * Raffle Events
 */

export interface RaffleStartedPayload {
  activityId: string;
  prizeDescription: string;
  entryMethod: 'automatic' | 'manual';
}

export interface RaffleEntryConfirmedPayload {
  activityId: string;
  participantId: string;
  participantName: string;
}

export interface RaffleDrawingPayload {
  activityId: string;
}

export interface RaffleWinnersAnnouncedPayload {
  activityId: string;
  winners: RaffleWinner[];
}

export interface RaffleEndedPayload {
  activityId: string;
}

/**
 * Socket.io Event Map for type-safe event handling
 */
export interface ClientToServerEvents {
  'join-event': (payload: JoinEventPayload) => void;
  'start-quiz': (payload: StartQuizPayload) => void;
  'next-question': (payload: NextQuestionPayload) => void;
  'submit-answer': (payload: SubmitAnswerPayload) => void;
  'end-quiz': (payload: EndQuizPayload) => void;
  'get-nickname-suggestions': (payload: GetNicknameSuggestionsPayload) => void;
  'join-organizer': (payload: JoinOrganizerPayload) => void;
  'join-event-as-organizer': (payload: JoinEventAsOrganizerPayload) => void;
}

export interface ServerToClientEvents {
  'participant-joined': (payload: ParticipantJoinedPayload) => void;
  'participants-updated': (payload: ParticipantsUpdatedPayload) => void;
  'quiz-started': (payload: QuizStartedPayload) => void;
  'question-displayed': (payload: QuestionDisplayedPayload) => void;
  'timer-tick': (payload: TimerTickPayload) => void;
  'question-ended': (payload: QuestionEndedPayload) => void;
  'answer-result': (payload: AnswerResultPayload) => void;
  'answer-statistics': (payload: AnswerStatisticsPayload) => void;
  'leaderboard-updated': (payload: LeaderboardUpdatedPayload) => void;
  'quiz-ended': (payload: QuizEndedPayload) => void;
  'nickname-suggestions': (payload: NicknameSuggestionsPayload) => void;
  'quiz-status-changed': (payload: QuizStatusChangedPayload) => void;
  'quiz-metadata-updated': (payload: QuizMetadataUpdatedPayload) => void;
  'error': (payload: ErrorPayload) => void;
  
  // Activity lifecycle events
  'activity-activated': (payload: ActivityActivatedPayload) => void;
  'activity-deactivated': (payload: ActivityDeactivatedPayload) => void;
  'activity-updated': (payload: ActivityUpdatedPayload) => void;
  'waiting-for-activity': (payload: WaitingForActivityPayload) => void;
  
  // Poll events
  'poll-started': (payload: PollStartedPayload) => void;
  'poll-vote-submitted': (payload: PollVoteSubmittedPayload) => void;
  'poll-results-updated': (payload: PollResultsUpdatedPayload) => void;
  'poll-ended': (payload: PollEndedPayload) => void;
  
  // Raffle events
  'raffle-started': (payload: RaffleStartedPayload) => void;
  'raffle-entry-confirmed': (payload: RaffleEntryConfirmedPayload) => void;
  'raffle-drawing': (payload: RaffleDrawingPayload) => void;
  'raffle-winners-announced': (payload: RaffleWinnersAnnouncedPayload) => void;
  'raffle-ended': (payload: RaffleEndedPayload) => void;
}
