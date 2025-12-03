/**
 * Activity management REST API routes
 */
import { Router, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validation.js';
import {
  requireOrganizer,
  AuthenticatedRequest,
} from '../middleware/accessControl.js';
import {
  CreateActivityRequestSchema,
  UpdateActivityRequestSchema,
} from '../validation/schemas.js';
import {
  CreateActivityRequest,
  CreateActivityResponse,
  GetActivitiesResponse,
  GetActivityResponse,
  UpdateActivityRequest,
  UpdateActivityResponse,
  DeleteActivityResponse,
  ActivateActivityResponse,
  DeactivateActivityResponse,
} from '../types/api.js';
import {
  createActivity,
  getActivity,
  updateActivity,
  deleteActivity,
  activateActivity,
  deactivateActivity,
} from '../services/activityService.js';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { QuizActivityService } from '../services/quizActivityService.js';
import { PollActivityService } from '../services/pollActivityService.js';
import { RaffleActivityService } from '../services/raffleActivityService.js';
import { assignColorsAndShapes } from '../utils/answerStyles.js';
import { WebSocketService } from '../services/websocketService.js';

const router = Router();
const activityRepository = new ActivityRepository();
const quizActivityService = new QuizActivityService();
const pollActivityService = new PollActivityService();
const raffleActivityService = new RaffleActivityService();
const wsService = new WebSocketService();

// Import io instance for WebSocket events
let io: any = null;
export function setIoInstance(ioInstance: any) {
  io = ioInstance;
}

/**
 * POST /api/events/:eventId/activities - Create activity
 */
router.post(
  '/events/:eventId/activities',
  validateRequest(CreateActivityRequestSchema),
  requireOrganizer,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      const activityConfig = req.body as CreateActivityRequest;

      // Event already verified by requireOrganizer middleware
      const event = req.event!;

      // Create activity
      const activity = await createActivity(eventId, activityConfig);

      // Emit WebSocket event for real-time updates
      if (io && event.organizerId) {
        io.to(`organizer-${event.organizerId}`).emit('activity-created', {
          eventId,
          activity,
        });
      }

      // Return response
      const response: CreateActivityResponse = {
        activityId: activity.activityId,
        activity,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/events/:eventId/activities - List activities
 */
router.get(
  '/events/:eventId/activities',
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      // Get all activities for the event
      const rawActivities = await activityRepository.findByEventId(eventId);

      // Sort by order
      rawActivities.sort((a, b) => a.order - b.order);

      // Populate questions for each activity using getActivity
      const activities = await Promise.all(
        rawActivities.map(async (activity) => {
          const fullActivity = await getActivity(activity.activityId);
          return fullActivity || activity; // Fallback to raw activity if getActivity fails
        })
      );

      // Return response
      const response: GetActivitiesResponse = {
        activities,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/activities/:activityId - Get activity details
 */
router.get(
  '/activities/:activityId',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity
      const activity = await getActivity(activityId);

      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      // Return response
      const response: GetActivityResponse = {
        activity,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/activities/:activityId - Update activity
 */
router.put(
  '/activities/:activityId',
  validateRequest(UpdateActivityRequestSchema),
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const updates = req.body as UpdateActivityRequest;

      // Get activity to verify it exists and get eventId
      const existingActivity = await getActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      // Update activity
      const updatedActivity = await updateActivity(activityId, updates);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(existingActivity.eventId).emit('activity-updated', {
          eventId: existingActivity.eventId,
          activity: updatedActivity,
        });
      }

      // Return response
      const response: UpdateActivityResponse = {
        success: true,
        activity: updatedActivity,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/activities/:activityId - Delete activity
 */
router.delete(
  '/activities/:activityId',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and get eventId
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      // Delete activity (will throw if currently active)
      await deleteActivity(activityId);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('activity-deleted', {
          eventId: activity.eventId,
          activityId,
        });
      }

      // Return response
      const response: DeleteActivityResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/activate - Activate activity
 */
router.post(
  '/activities/:activityId/activate',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and get eventId
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      // Activate activity
      await activateActivity(activity.eventId, activityId);

      // Get updated activity
      const updatedActivity = await getActivity(activityId);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('activity-activated', {
          eventId: activity.eventId,
          activity: updatedActivity,
        });
      }

      // Return response
      const response: ActivateActivityResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/deactivate - Deactivate activity
 */
router.post(
  '/activities/:activityId/deactivate',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and get eventId
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      // Deactivate activity
      await deactivateActivity(activity.eventId, activityId);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('activity-deactivated', {
          eventId: activity.eventId,
          activityId,
        });

        // Send waiting state to participants
        io.to(activity.eventId).emit('waiting-for-activity', {
          eventId: activity.eventId,
          message: 'Waiting for organizer to start an activity',
        });
      }

      // Return response
      const response: DeactivateActivityResponse = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/questions - Add question to quiz activity
 */
router.post(
  '/activities/:activityId/questions',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { text, options, correctOptionId, timerSeconds } = req.body;

      // Validate required fields
      if (!text || !options || !correctOptionId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: text, options, correctOptionId',
        });
      }

      // Validate options array
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Options must be an array with at least 2 items',
        });
      }

      // Get activity to verify it exists and is a quiz
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a quiz',
        });
      }

      // Get existing questions to determine order
      const existingQuestions = await quizActivityService.getQuestions(activityId);
      const order = existingQuestions.length;

      // Assign colors and shapes to options based on index
      const optionsWithStyles = assignColorsAndShapes(options);

      // Create question object
      const questionData = {
        eventId: activity.eventId,
        text,
        options: optionsWithStyles,
        correctOptionId,
        timerSeconds: timerSeconds || 30,
        order,
      };

      // Add question
      const question = await quizActivityService.addQuestion(activityId, questionData);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('question-added', {
          eventId: activity.eventId,
          activityId,
          question,
        });
      }

      res.status(201).json({
        questionId: question.questionId,
        question,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/activities/:activityId/questions/:questionId - Update question in quiz activity
 */
router.put(
  '/activities/:activityId/questions/:questionId',
  async (req, res, next) => {
    try {
      const { activityId, questionId } = req.params;
      const { text, options, correctOptionId, timerSeconds } = req.body;

      // Validate required fields
      if (!text || !options || !correctOptionId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: text, options, correctOptionId',
        });
      }

      // Validate options array
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Options must be an array with at least 2 items',
        });
      }

      // Get activity to verify it exists and is a quiz
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a quiz',
        });
      }

      // Assign colors and shapes to options based on index
      const optionsWithStyles = assignColorsAndShapes(options);

      // Update question
      await quizActivityService.updateQuestion(activityId, questionId, {
        text,
        options: optionsWithStyles,
        correctOptionId,
        timerSeconds: timerSeconds || 30,
      });

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('question-updated', {
          eventId: activity.eventId,
          activityId,
          questionId,
        });
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/activities/:activityId/questions/:questionId - Delete question from quiz activity
 */
router.delete(
  '/activities/:activityId/questions/:questionId',
  async (req, res, next) => {
    try {
      const { activityId, questionId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a quiz',
        });
      }

      // Delete question
      await quizActivityService.deleteQuestion(activityId, questionId);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('question-deleted', {
          eventId: activity.eventId,
          activityId,
          questionId,
        });
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/activities/:activityId/questions - Get all questions for quiz activity
 */
router.get(
  '/activities/:activityId/questions',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a quiz',
        });
      }

      // Get questions
      const questions = await quizActivityService.getQuestions(activityId);

      res.json({
        questions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/configure-poll - Configure poll activity
 */
router.post(
  '/activities/:activityId/configure-poll',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { question, options } = req.body;

      // Validate required fields
      if (!question || !options) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: question, options',
        });
      }

      // Validate options array
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Options must be an array with at least 2 items',
        });
      }

      // Get activity to verify it exists and is a poll
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'poll') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a poll',
        });
      }

      // Configure poll
      await pollActivityService.configurePoll(activityId, question, options);

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('poll-configured', {
          eventId: activity.eventId,
          activityId,
        });
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/start-poll - Start poll activity
 */
router.post(
  '/activities/:activityId/start-poll',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a poll
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'poll') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a poll',
        });
      }

      // Start poll
      await pollActivityService.startPoll(activityId);

      // Get updated activity
      const updatedActivity = await getActivity(activityId);

      // Emit WebSocket event for real-time updates
      if (io && updatedActivity && updatedActivity.type === 'poll') {
        await wsService.broadcastPollStarted(
          io,
          activity.eventId,
          activityId,
          updatedActivity.question,
          updatedActivity.options
        );
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/vote - Submit vote for poll
 */
router.post(
  '/activities/:activityId/vote',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { participantId, optionIds } = req.body;

      // Validate required fields
      if (!participantId || !optionIds) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: participantId, optionIds',
        });
      }

      // Validate optionIds is an array
      if (!Array.isArray(optionIds)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'optionIds must be an array',
        });
      }

      // Get activity to verify it exists and is a poll
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'poll') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a poll',
        });
      }

      // Submit vote
      await pollActivityService.submitVote(activityId, participantId, optionIds);

      // Emit WebSocket event for real-time updates
      if (io) {
        await wsService.broadcastPollVoteSubmitted(
          io,
          activity.eventId,
          activityId,
          participantId
        );

        // If live results are enabled, broadcast updated results
        if (activity.showResultsLive) {
          const results = await pollActivityService.getResults(activityId);
          await wsService.broadcastPollResultsUpdated(
            io,
            activity.eventId,
            activityId,
            results
          );
        }
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/activities/:activityId/poll-results - Get poll results
 */
router.get(
  '/activities/:activityId/poll-results',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a poll
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'poll') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a poll',
        });
      }

      // Get results
      const results = await pollActivityService.getResults(activityId);

      res.json({
        results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/end-poll - End poll activity
 */
router.post(
  '/activities/:activityId/end-poll',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a poll
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'poll') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a poll',
        });
      }

      // End poll and get final results
      const results = await pollActivityService.endPoll(activityId);

      // Emit WebSocket event for real-time updates
      if (io) {
        await wsService.broadcastPollEnded(
          io,
          activity.eventId,
          activityId,
          results
        );
      }

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/configure-raffle - Configure raffle activity
 */
router.post(
  '/activities/:activityId/configure-raffle',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { prizeDescription, entryMethod, winnerCount } = req.body;

      // Validate required fields
      if (!prizeDescription || !entryMethod || !winnerCount) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: prizeDescription, entryMethod, winnerCount',
        });
      }

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // Configure raffle
      await raffleActivityService.configureRaffle(activityId, {
        prizeDescription,
        entryMethod,
        winnerCount,
      });

      // Emit WebSocket event for real-time updates
      if (io) {
        io.to(activity.eventId).emit('raffle-configured', {
          eventId: activity.eventId,
          activityId,
        });
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/start-raffle - Start raffle activity
 */
router.post(
  '/activities/:activityId/start-raffle',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // Start raffle
      await raffleActivityService.startRaffle(activityId);

      // Get updated activity
      const updatedActivity = await getActivity(activityId);

      // Emit WebSocket event for real-time updates
      if (io && updatedActivity && updatedActivity.type === 'raffle') {
        await wsService.broadcastRaffleStarted(
          io,
          activity.eventId,
          activityId,
          updatedActivity.prizeDescription,
          updatedActivity.entryMethod
        );
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/enter - Enter raffle
 */
router.post(
  '/activities/:activityId/enter',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { participantId, participantName } = req.body;

      // Validate required fields
      if (!participantId || !participantName) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Missing required fields: participantId, participantName',
        });
      }

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // Enter raffle
      await raffleActivityService.enterRaffle(activityId, participantId, participantName);

      // Emit WebSocket event for real-time updates
      if (io) {
        await wsService.broadcastRaffleEntryConfirmed(
          io,
          activity.eventId,
          activityId,
          participantId,
          participantName
        );
      }

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/draw-winners - Draw raffle winners
 */
router.post(
  '/activities/:activityId/draw-winners',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;
      const { count } = req.body;

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // Start raffle if not already started (handles the case where activity is active but raffle not started)
      try {
        await raffleActivityService.startRaffle(activityId);
        
        // Emit raffle started event
        if (io) {
          const updatedActivity = await getActivity(activityId);
          if (updatedActivity && updatedActivity.type === 'raffle') {
            await wsService.broadcastRaffleStarted(
              io,
              activity.eventId,
              activityId,
              updatedActivity.prizeDescription,
              updatedActivity.entryMethod
            );
          }
        }
      } catch (error) {
        // If raffle is already started, that's fine, continue
        console.log('Raffle already started or start failed:', error);
      }

      // Emit drawing event
      if (io) {
        await wsService.broadcastRaffleDrawing(io, activity.eventId, activityId);
      }

      // Draw winners
      const winnerIds = await raffleActivityService.drawWinners(activityId, count);

      // Get all entries to map winner IDs to names
      const raffleRepo = new (await import('../db/repositories/RaffleRepository.js')).RaffleRepository();
      const entries = await raffleRepo.getEntries(activityId);
      const winners = entries
        .filter(entry => winnerIds.includes(entry.participantId))
        .map(entry => ({
          participantId: entry.participantId,
          participantName: entry.participantName,
        }));

      // Emit winners announced event with animation triggers
      if (io) {
        await wsService.broadcastRaffleWinnersAnnounced(
          io,
          activity.eventId,
          activityId,
          winners
        );
      }

      res.json({
        success: true,
        winners,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/activities/:activityId/entries - Get raffle entries
 */
router.get(
  '/activities/:activityId/entries',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // Get entries
      const raffleRepo = new (await import('../db/repositories/RaffleRepository.js')).RaffleRepository();
      const entries = await raffleRepo.getEntries(activityId);

      res.json({
        entries: entries.map(entry => ({
          participantId: entry.participantId,
          participantName: entry.participantName,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/end-raffle - End raffle activity
 */
router.post(
  '/activities/:activityId/end-raffle',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a raffle
      const activity = await getActivity(activityId);
      if (!activity) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Activity not found',
        });
      }

      if (activity.type !== 'raffle') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Activity is not a raffle',
        });
      }

      // End raffle and get final results
      const results = await raffleActivityService.endRaffle(activityId);

      // Emit WebSocket event for real-time updates
      if (io) {
        await wsService.broadcastRaffleEnded(io, activity.eventId, activityId);
      }

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/activities/:activityId/leaderboard - Get leaderboard for quiz activity
 */
router.get(
  '/activities/:activityId/leaderboard',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await activityRepository.findById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({ message: 'Leaderboard is only available for quiz activities' });
      }

      // Get leaderboard
      const leaderboard = await quizActivityService.getLeaderboard(activityId);

      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/start-quiz - Start quiz activity
 */
router.post(
  '/activities/:activityId/start-quiz',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await activityRepository.findById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({ message: 'Only quiz activities can be started' });
      }

      // Use WebSocket service to start the quiz
      if (io) {
        await wsService.handleStartQuiz(io, null as any, { activityId });
      }

      res.json({ message: 'Quiz started successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/next-question - Go to next question
 */
router.post(
  '/activities/:activityId/next-question',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await activityRepository.findById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({ message: 'Only quiz activities have questions' });
      }

      // Get all questions to find the next one
      const questions = await quizActivityService.getQuestions(activityId);
      if (questions.length === 0) {
        return res.status(400).json({ message: 'No questions found for this quiz' });
      }

      // For now, just use the first question - in a real implementation,
      // you'd track which question is current and get the next one
      const nextQuestion = questions[0];

      // Use WebSocket service to show the next question
      if (io) {
        await wsService.handleNextQuestion(io, null as any, { 
          activityId, 
          questionId: nextQuestion.id 
        });
      }

      res.json({ message: 'Next question displayed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/activities/:activityId/end-quiz - End quiz activity
 */
router.post(
  '/activities/:activityId/end-quiz',
  async (req, res, next) => {
    try {
      const { activityId } = req.params;

      // Get activity to verify it exists and is a quiz
      const activity = await activityRepository.findById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      if (activity.type !== 'quiz') {
        return res.status(400).json({ message: 'Only quiz activities can be ended' });
      }

      // Use WebSocket service to end the quiz
      if (io) {
        await wsService.handleEndQuiz(io, null as any, { activityId });
      }

      res.json({ message: 'Quiz ended successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
