/**
 * Event management REST API routes
 */
import { Router, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import multer from 'multer';
import { EventRepository, QuestionRepository, ParticipantRepository } from '../db/repositories/index.js';
import { validateRequest } from '../middleware/validation.js';
import {
  requireOrganizer,
  checkQuizAccess,
  validateModeTransition,
  AuthenticatedRequest,
} from '../middleware/accessControl.js';
import {
  CreateEventRequestSchema,
  CreateQuestionRequestSchema,
  UpdateQuestionRequestSchema,
  UpdateEventStatusRequestSchema,
  UpdateEventVisibilityRequestSchema,
} from '../validation/schemas.js';
import {
  CreateEventRequest,
  CreateEventResponse,
  GetEventResponse,
  GetEventByPinResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  DeleteQuestionResponse,
  GetOrganizerQuizzesResponse,
  QuizHistoryEntry,
  UpdateEventStatusRequest,
  UpdateEventStatusResponse,
  UpdateEventVisibilityRequest,
  UpdateEventVisibilityResponse,

} from '../types/api.js';
import { Event, Question, EventStatus } from '../types/models.js';
import { lookupEventByPin } from '../services/gamePinService.js';
import { assignColorsAndShapes } from '../utils/answerStyles.js';
import {
  uploadQuestionImage,
  validateImageFile,
} from '../services/imageProcessingService.js';

const router = Router();

// Import io instance for WebSocket events
let io: any = null;
export function setIoInstance(ioInstance: any) {
  io = ioInstance;
}

// Configure multer for memory storage (we'll process the buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
const eventRepository = new EventRepository();
const questionRepository = new QuestionRepository();

/**
 * Helper function to categorize quiz based on status
 * Maps EventStatus to quiz category (live, upcoming, past)
 */
function categorizeQuiz(status: EventStatus): 'live' | 'upcoming' | 'completed' {
  switch (status) {
    case 'live':
      return 'live';
    case 'draft':
    case 'setup':
    case 'waiting':
      return 'upcoming';
    case 'completed':
    case 'active':
      return 'completed';
    default:
      return 'upcoming';
  }
}

/**
 * Helper function to convert Event to QuizHistoryEntry
 */
function toQuizHistoryEntry(event: Event): QuizHistoryEntry {
  return {
    eventId: event.eventId,
    name: event.name,
    status: categorizeQuiz(event.status),
    participantCount: event.participantCount || 0,
    createdAt: event.createdAt,
    startedAt: event.startedAt,
    completedAt: event.completedAt,
    visibility: event.visibility || 'private',
    topic: event.topic,
    description: event.description,
    lastModified: event.lastModified || event.createdAt,
  };
}

/**
 * Helper function to sort quizzes by status and date
 * Live quizzes first, then Upcoming, then Past
 * Within each category, sort by date (most recent first)
 */
function sortQuizzes(quizzes: QuizHistoryEntry[]): QuizHistoryEntry[] {
  const statusOrder = { live: 0, upcoming: 1, completed: 2 };
  
  return quizzes.sort((a, b) => {
    // First sort by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    
    // Within same status, sort by date (most recent first)
    // For live and upcoming, use lastModified or createdAt
    // For completed, use completedAt if available
    let dateA: number;
    let dateB: number;
    
    if (a.status === 'completed') {
      dateA = a.completedAt || a.lastModified;
      dateB = b.completedAt || b.lastModified;
    } else {
      dateA = a.lastModified;
      dateB = b.lastModified;
    }
    
    return dateB - dateA; // Descending order (most recent first)
  });
}

/**
 * POST /api/events - Create new event
 */
router.post(
  '/events',
  validateRequest(CreateEventRequestSchema),
  async (req, res, next) => {
    try {
      const { name, organizerId, visibility } = req.body as CreateEventRequest;

      // Validate organizerId is provided
      if (!organizerId || organizerId.trim() === '') {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'organizerId is required and cannot be empty',
        });
      }

      // Generate unique event ID
      const eventId = randomUUID();

      // Generate join link
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const joinLink = `${baseUrl}/join/${eventId}`;

      // Generate QR code as data URL
      const qrCode = await QRCode.toDataURL(joinLink);

      // Generate unique game PIN (imported below)
      const { generateUniqueGamePin } = await import('../services/gamePinService.js');
      const gamePin = await generateUniqueGamePin(eventId);

      // Create event object
      const now = Date.now();
      const event: Event = {
        eventId: eventId,
        id: eventId, // Keep for backward compatibility
        name,
        gamePin,
        organizerId: organizerId.trim(), // Use provided organizerId
        status: 'draft', // New events start in draft mode
        currentQuestionIndex: 0, // Keep for backward compatibility
        createdAt: now,
        joinLink,
        // New fields for organizer UX improvements
        visibility: visibility || 'private', // Default to private
        isTemplate: false,
        lastModified: now,
        participantCount: 0,
        activeActivityId: null, // No activity active initially
      };

      // Save to database
      await eventRepository.createEvent(event);

      // Return response
      const response: CreateEventResponse = {
        eventId,
        gamePin,
        joinLink,
        qrCode,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/events/by-pin/:gamePin - Get event by game PIN
 */
router.get('/events/by-pin/:gamePin', async (req, res, next) => {
  try {
    const { gamePin } = req.params;

    // Lookup event ID by game PIN
    const eventId = await lookupEventByPin(gamePin);

    if (!eventId) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Invalid game PIN',
      });
    }

    // Get event details
    const event = await eventRepository.getEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found',
      });
    }

    // Return response
    const response: GetEventByPinResponse = {
      eventId: event.id,
      name: event.name,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});



/**
 * GET /api/events/organizer/:organizerId - Get all quizzes for organizer
 * NOTE: This route must be defined before /events/:eventId to avoid treating "organizer" as an eventId
 */
router.get('/events/organizer/:organizerId', async (req, res, next) => {
  try {
    const { organizerId } = req.params;

    // Get all events for the organizer
    const events = await eventRepository.getEventsByOrganizer(organizerId);

    // Convert to quiz history entries and categorize
    const quizzes = events.map(toQuizHistoryEntry);

    // Sort by status and date
    const sortedQuizzes = sortQuizzes(quizzes);

    // Return response
    const response: GetOrganizerQuizzesResponse = {
      quizzes: sortedQuizzes,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:eventId - Get event details
 */
router.get('/events/:eventId', checkQuizAccess, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Get event from database
    const event = await eventRepository.getEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found',
      });
    }

    // Get questions for the event
    const questions = await questionRepository.getQuestions(eventId);

    // Return response
    const response: GetEventResponse = {
      id: event.id,
      name: event.name,
      gamePin: event.gamePin,
      status: event.status,
      questions,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});



/**
 * PATCH /api/events/:eventId/status - Update event status
 */
router.patch(
  '/events/:eventId/status',
  validateRequest(UpdateEventStatusRequestSchema),
  requireOrganizer,
  validateModeTransition,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      const { status } = req.body as UpdateEventStatusRequest;

      // Event already verified by requireOrganizer middleware
      const event = req.event!;

      // Update status
      await eventRepository.updateEventStatus(eventId, status);

      // Update timestamps based on status transition
      const updates: Partial<Event> = {};
      const timestamp = Date.now();
      if (status === 'live' && !event.startedAt) {
        updates.startedAt = timestamp;
      } else if (status === 'completed' && !event.completedAt) {
        updates.completedAt = timestamp;
      }

      if (Object.keys(updates).length > 0) {
        await eventRepository.updateEvent(eventId, updates);
      }

      // Emit WebSocket event for real-time dashboard updates
      if (io && event.organizerId) {
        io.to(`organizer-${event.organizerId}`).emit('quiz-status-changed', {
          eventId,
          status,
          timestamp,
        });
      }

      // Return response
      const response: UpdateEventStatusResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/events/:eventId/visibility - Update event visibility
 */
router.patch(
  '/events/:eventId/visibility',
  validateRequest(UpdateEventVisibilityRequestSchema),
  requireOrganizer,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      const { visibility } = req.body as UpdateEventVisibilityRequest;

      // Event already verified by requireOrganizer middleware
      const event = req.event!;

      // Prevent changing visibility of live quizzes
      if (event.status === 'live') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cannot change visibility of a live quiz',
        });
      }

      // Update visibility
      await eventRepository.updateEventVisibility(eventId, visibility);

      // Emit WebSocket event for real-time dashboard updates
      if (io && event.organizerId) {
        io.to(`organizer-${event.organizerId}`).emit('quiz-metadata-updated', {
          eventId,
          visibility,
          lastModified: Date.now(),
        });
      }

      // Return response
      const response: UpdateEventVisibilityResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/events/:eventId/questions - Add question to event
 */
router.post(
  '/events/:eventId/questions',
  validateRequest(CreateQuestionRequestSchema),
  requireOrganizer,
  async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { text, options, correctOptionId, timerSeconds } =
        req.body as CreateQuestionRequest;

      // Event already verified by requireOrganizer middleware

      // Get existing questions to determine order
      const existingQuestions = await questionRepository.getQuestions(eventId);
      const order = existingQuestions.length;

      // Generate question ID
      const questionId = randomUUID();

      // Assign colors and shapes to options based on index
      const optionsWithStyles = assignColorsAndShapes(options);

      // Create question object
      const question: Question = {
        questionId: questionId,
        id: questionId, // Keep for backward compatibility
        eventId,
        text,
        options: optionsWithStyles,
        correctOptionId,
        timerSeconds,
        order,
      };

      // Save to database
      await questionRepository.addQuestion(question);

      // Return response
      const response: CreateQuestionResponse = {
        questionId,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/events/:eventId/questions/:questionId - Update question
 */
router.put(
  '/events/:eventId/questions/:questionId',
  validateRequest(UpdateQuestionRequestSchema),
  requireOrganizer,
  async (req, res, next) => {
    try {
      const { eventId, questionId } = req.params;
      const { text, options, correctOptionId, timerSeconds } =
        req.body as UpdateQuestionRequest;

      // Event already verified by requireOrganizer middleware

      // Verify question exists
      const question = await questionRepository.getQuestion(eventId, questionId);
      if (!question) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Question not found',
        });
      }

      // Assign colors and shapes to options based on index
      const optionsWithStyles = assignColorsAndShapes(options);

      // Update question
      await questionRepository.updateQuestion(eventId, questionId, {
        text,
        options: optionsWithStyles,
        correctOptionId,
        timerSeconds,
      });

      // Return response
      const response: UpdateQuestionResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/events/:eventId/questions/:questionId - Delete question
 */
router.delete(
  '/events/:eventId/questions/:questionId',
  requireOrganizer,
  async (req, res, next) => {
    try {
      const { eventId, questionId } = req.params;

      // Event already verified by requireOrganizer middleware

    // Verify question exists
    const question = await questionRepository.getQuestion(eventId, questionId);
    if (!question) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Question not found',
      });
    }

    // Delete question
    await questionRepository.deleteQuestion(eventId, questionId);

    // Return response
    const response: DeleteQuestionResponse = {
      success: true,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:eventId/questions/:questionId/image - Upload image for question
 */
router.post(
  '/events/:eventId/questions/:questionId/image',
  upload.single('image'),
  requireOrganizer,
  async (req, res, next) => {
    try {
      const { eventId, questionId } = req.params;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No image file provided',
        });
      }

      // Event already verified by requireOrganizer middleware

      // Verify question exists
      const question = await questionRepository.getQuestion(eventId, questionId);
      if (!question) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Question not found',
        });
      }

      // Validate image file
      const validation = validateImageFile(req.file.buffer, req.file.mimetype);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'BadRequest',
          message: validation.error,
        });
      }

      // Process and upload image
      const { imageUrl } = await uploadQuestionImage(
        req.file.buffer,
        eventId,
        questionId
      );

      // Update question with image URL
      await questionRepository.updateQuestion(eventId, questionId, {
        imageUrl,
      });

      // Return response
      res.status(200).json({
        imageUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/events/:eventId - Delete event
 */
router.delete(
  '/events/:eventId',
  requireOrganizer,
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      // Event already verified by requireOrganizer middleware
      // Organizer ownership already verified

      // Delete all questions for this event first
      const questions = await questionRepository.getQuestions(eventId);
      for (const question of questions) {
        await questionRepository.deleteQuestion(eventId, question.id);
      }

      // Delete the event
      await eventRepository.deleteEvent(eventId);

      // Return success response
      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

/**
 * GET /api/events/:eventId/participants - Get participants for an event
 */
router.get('/events/:eventId/participants', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const participantRepo = new ParticipantRepository();
    const participants = await participantRepo.getParticipants(eventId);
    
    res.json({ participants });
  } catch (error) {
    next(error);
  }
});
