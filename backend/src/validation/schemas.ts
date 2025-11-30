/**
 * Zod validation schemas for data validation
 */

import { z } from 'zod';

/**
 * Event validation schemas
 */
export const EventStatusSchema = z.enum(['waiting', 'active', 'completed']);

// Extended status schema for organizer workflow
export const ExtendedEventStatusSchema = z.enum(['draft', 'setup', 'live', 'completed']);

export const EventVisibilitySchema = z.enum(['private', 'public']);

export const EventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  organizerId: z.string().min(1),
  status: EventStatusSchema,
  currentQuestionIndex: z.number().int().min(0),
  createdAt: z.number().int().positive(),
  joinLink: z.string().url(),
});

/**
 * Question and Answer validation schemas
 */
export const AnswerOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(500),
  color: z.enum(['red', 'blue', 'yellow', 'green', 'purple']).optional(),
  shape: z.enum(['triangle', 'diamond', 'circle', 'square', 'pentagon']).optional(),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  text: z.string().min(1).max(1000),
  options: z.array(AnswerOptionSchema).min(2).max(5),
  correctOptionId: z.string().min(1),
  timerSeconds: z.number().int().positive().max(300).optional(),
  order: z.number().int().min(0),
});

/**
 * Participant validation schemas
 */
export const AnswerSchema = z.object({
  participantId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  responseTime: z.number().int().min(0),
  isCorrect: z.boolean(),
  submittedAt: z.number().int().positive(),
});

export const ParticipantSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1).max(100),
  score: z.number().int().min(0),
  totalAnswerTime: z.number().int().min(0),
  answers: z.array(AnswerSchema),
  joinedAt: z.number().int().positive(),
});

export const ParticipantScoreSchema = z.object({
  rank: z.number().int().positive(),
  name: z.string().min(1).max(100),
  score: z.number().int().min(0),
  totalAnswerTime: z.number().int().min(0),
});

/**
 * API Request validation schemas
 */
export const CreateEventRequestSchema = z.object({
  name: z.string().min(1).max(200),
  organizerId: z.string().min(1, 'organizerId is required'),
  visibility: z.enum(['private', 'public']).optional(),
});

export const CreateQuestionRequestSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(1000, 'Question text must be 1000 characters or less'),
  options: z.array(AnswerOptionSchema).min(2, 'At least 2 answer options are required').max(5, 'Maximum 5 answer options allowed'),
  correctOptionId: z.string().min(1, 'Correct answer must be specified'),
  timerSeconds: z.number().int().positive().max(300).optional(),
})
.refine(
  (data) => data.options.some((option) => option.id === data.correctOptionId),
  {
    message: 'Exactly one answer option must be marked as correct',
    path: ['correctOptionId'],
  }
)
.refine(
  (data) => {
    const optionIds = data.options.map(o => o.id);
    const uniqueIds = new Set(optionIds);
    return optionIds.length === uniqueIds.size;
  },
  {
    message: 'Answer option IDs must be unique',
    path: ['options'],
  }
)
.refine(
  (data) => {
    const correctCount = data.options.filter(o => o.id === data.correctOptionId).length;
    return correctCount === 1;
  },
  {
    message: 'Exactly one answer option must be marked as correct',
    path: ['correctOptionId'],
  }
);

export const UpdateQuestionRequestSchema = CreateQuestionRequestSchema;

/**
 * WebSocket Event validation schemas
 */
export const JoinEventPayloadSchema = z.object({
  eventId: z.string().min(1),
  participantName: z.string().min(1).max(100),
});

export const StartQuizPayloadSchema = z.object({
  eventId: z.string().min(1),
});

export const NextQuestionPayloadSchema = z.object({
  eventId: z.string().min(1),
  questionId: z.string().min(1),
});

export const SubmitAnswerPayloadSchema = z.object({
  eventId: z.string().min(1),
  questionId: z.string().min(1),
  answerId: z.string().min(1),
  responseTime: z.number().int().min(0),
});

export const EndQuizPayloadSchema = z.object({
  eventId: z.string().min(1),
});



/**
 * Quiz History and Status Management validation schemas
 */
export const UpdateEventStatusRequestSchema = z.object({
  status: ExtendedEventStatusSchema,
});

export const UpdateEventVisibilityRequestSchema = z.object({
  visibility: EventVisibilitySchema,
});

/**
 * Activity validation schemas
 */
export const ActivityTypeSchema = z.enum(['quiz', 'poll', 'raffle']);

export const ActivityStatusSchema = z.enum(['draft', 'ready', 'active', 'completed']);

export const CreateActivityRequestSchema = z.object({
  name: z.string().min(1, 'Activity name is required').max(200, 'Activity name must be 200 characters or less'),
  type: ActivityTypeSchema,
  // Quiz-specific config
  scoringEnabled: z.boolean().optional(),
  speedBonusEnabled: z.boolean().optional(),
  streakTrackingEnabled: z.boolean().optional(),
  // Poll-specific config
  question: z.string().max(1000).optional(),
  options: z.array(z.string()).optional(),
  allowMultipleVotes: z.boolean().optional(),
  showResultsLive: z.boolean().optional(),
  // Raffle-specific config
  prizeDescription: z.string().max(1000).optional(),
  entryMethod: z.enum(['automatic', 'manual']).optional(),
  winnerCount: z.number().int().positive().optional(),
});

export const UpdateActivityRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: ActivityStatusSchema.optional(),
  // Allow any additional fields for type-specific updates
}).passthrough();
