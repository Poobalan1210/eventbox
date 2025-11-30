/**
 * Access control middleware for organizer authorization and quiz access
 */
import { Request, Response, NextFunction } from 'express';
import { EventRepository } from '../db/repositories/index.js';
import { Event } from '../types/models.js';

const eventRepository = new EventRepository();

/**
 * Extended Request interface with organizerId
 */
export interface AuthenticatedRequest extends Request {
  organizerId?: string;
  event?: Event;
}

/**
 * Middleware to require organizer authorization for event operations
 * Verifies that the user is the organizer of the event
 */
export async function requireOrganizer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { eventId } = req.params;
    const organizerId = req.headers['x-organizer-id'] as string;

    // Check if organizerId is provided
    if (!organizerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Organizer ID is required',
      });
    }

    // Check if eventId is provided
    if (!eventId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Event ID is required',
      });
    }

    // Get event from database
    const event = await eventRepository.getEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found',
      });
    }

    // Verify organizer owns the event
    if (event.organizerId !== organizerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this event',
      });
    }

    // Attach organizerId and event to request for downstream use
    req.organizerId = organizerId;
    req.event = event;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check quiz access based on privacy settings
 * Public quizzes are accessible to all, private quizzes require correct game PIN
 */
export async function checkQuizAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { eventId } = req.params;
    const gamePin = req.headers['x-game-pin'] as string;
    const organizerId = req.headers['x-organizer-id'] as string;

    // Check if eventId is provided
    if (!eventId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Event ID is required',
      });
    }

    // Get event from database
    const event = await eventRepository.getEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found',
      });
    }

    // Organizer always has access
    if (organizerId && event.organizerId === organizerId) {
      next();
      return;
    }

    // Public quizzes are accessible to all
    if (event.visibility === 'public') {
      next();
      return;
    }

    // Private quizzes require correct game PIN
    if (event.visibility === 'private') {
      if (!gamePin) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Game PIN is required for private quizzes',
        });
      }

      if (gamePin !== event.gamePin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid game PIN',
        });
      }

      next();
      return;
    }

    // Default to forbidden if visibility is not set
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validation function to check if quiz can transition to live mode
 * Returns validation result with errors if any
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateQuizForLive(eventId: string): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Get event
    const event = await eventRepository.getEvent(eventId);

    if (!event) {
      errors.push('Event not found');
      return { valid: false, errors };
    }

    // Check if event has questions
    const { QuestionRepository } = await import('../db/repositories/index.js');
    const questionRepository = new QuestionRepository();
    const questions = await questionRepository.getQuestions(eventId);

    if (!questions || questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    // Validate each question
    questions.forEach((q, index) => {
      console.log(`Validating question ${index + 1}:`, {
        text: q.text,
        optionsCount: q.options?.length,
        correctOptionId: q.correctOptionId,
        options: q.options,
      });

      if (!q.text || q.text.trim() === '') {
        errors.push(`Question ${index + 1} is missing text`);
      }

      if (!q.options || q.options.length < 2) {
        errors.push(`Question ${index + 1} must have at least 2 options`);
      }

      const hasCorrectAnswer = q.options.some(opt => opt.id === q.correctOptionId);
      if (!hasCorrectAnswer) {
        errors.push(`Question ${index + 1} must have a correct answer`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating quiz for live mode:', error);
    errors.push('Failed to validate quiz');
    return { valid: false, errors };
  }
}

/**
 * Middleware to validate quiz before mode transitions
 * Specifically validates transition to live mode
 */
export async function validateModeTransition(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    // Only validate when transitioning to live mode
    if (status !== 'live') {
      next();
      return;
    }

    // Validate quiz is ready for live mode
    const validation = await validateQuizForLive(eventId);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Quiz is not ready to start',
        details: validation.errors.map(error => ({
          path: 'quiz',
          message: error,
        })),
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
