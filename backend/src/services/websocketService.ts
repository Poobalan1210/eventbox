/**
 * WebSocket Service - Handles real-time communication for quiz events
 */
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinEventPayload,
  StartQuizPayload,
  NextQuestionPayload,
  SubmitAnswerPayload,
  EndQuizPayload,
  GetNicknameSuggestionsPayload,
} from '../types/websocket.js';
import { EventRepository } from '../db/repositories/EventRepository.js';
import { ParticipantRepository } from '../db/repositories/ParticipantRepository.js';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { Participant } from '../types/models.js';
import { generateNicknameSuggestions } from './nicknameService.js';
import { QuizActivityService } from './quizActivityService.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Store active timers for each activity
const activeTimers = new Map<string, NodeJS.Timeout>();

// Store participant socket mappings
const participantSockets = new Map<string, string>(); // socketId -> participantId

export class WebSocketService {
  private eventRepo: EventRepository;
  private participantRepo: ParticipantRepository;
  private activityRepo: ActivityRepository;
  private quizActivityService: QuizActivityService;

  constructor() {
    this.eventRepo = new EventRepository();
    this.participantRepo = new ParticipantRepository();
    this.activityRepo = new ActivityRepository();
    this.quizActivityService = new QuizActivityService();
  }

  /**
   * Initialize WebSocket handlers
   */
  initializeHandlers(io: TypedServer): void {
    io.on('connection', (socket: TypedSocket) => {
      console.log('Client connected:', socket.id);

      // Handle join event
      socket.on('join-event', async (payload: JoinEventPayload) => {
        await this.handleJoinEvent(io, socket, payload);
      });

      // Handle organizer joining (to receive real-time updates)
      socket.on('join-organizer', async (payload: { organizerId: string }) => {
        const { organizerId } = payload;
        if (organizerId) {
          // Join a room for this organizer to receive updates about their quizzes
          socket.join(`organizer-${organizerId}`);
          console.log(`Organizer ${organizerId} joined their room`);
        }
      });

      // Handle organizer joining a specific event (to receive live quiz updates)
      socket.on('join-event-as-organizer', async (payload: { eventId: string }) => {
        const { eventId } = payload;
        if (eventId) {
          // Join the event room to receive question-displayed, leaderboard, etc.
          socket.join(eventId);
          console.log(`Organizer joined event room: ${eventId}`);
          
          // Send current participant list to the organizer
          const participants = await this.participantRepo.getParticipants(eventId);
          socket.emit('participants-updated', { participants });
          console.log(`Sent ${participants.length} participants to organizer`);
        }
      });

      // Handle start quiz
      socket.on('start-quiz', async (payload: StartQuizPayload) => {
        await this.handleStartQuiz(io, socket, payload);
      });

      // Handle next question
      socket.on('next-question', async (payload: NextQuestionPayload) => {
        await this.handleNextQuestion(io, socket, payload);
      });

      // Handle submit answer
      socket.on('submit-answer', async (payload: SubmitAnswerPayload) => {
        await this.handleSubmitAnswer(io, socket, payload);
      });

      // Handle end quiz
      socket.on('end-quiz', async (payload: EndQuizPayload) => {
        await this.handleEndQuiz(io, socket, payload);
      });

      // Handle get nickname suggestions
      socket.on('get-nickname-suggestions', (payload: GetNicknameSuggestionsPayload) => {
        this.handleGetNicknameSuggestions(socket, payload);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Broadcast activity activation to all participants in an event
   * Called by API endpoints when an organizer activates an activity
   */
  async broadcastActivityActivated(io: TypedServer, eventId: string, activityId: string): Promise<void> {
    try {
      // Get the activity details
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found for broadcast`);
        return;
      }

      // Broadcast to all participants in the event room
      io.to(eventId).emit('activity-activated', {
        eventId,
        activity,
      });

      console.log(`Broadcasted activity-activated for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting activity activation:', error);
    }
  }

  /**
   * Broadcast activity deactivation to all participants in an event
   * Returns participants to waiting state
   * Called by API endpoints when an organizer deactivates an activity
   */
  async broadcastActivityDeactivated(io: TypedServer, eventId: string, activityId: string): Promise<void> {
    try {
      // Broadcast deactivation to all participants
      io.to(eventId).emit('activity-deactivated', {
        eventId,
        activityId,
      });

      // Send waiting state message to participants
      io.to(eventId).emit('waiting-for-activity', {
        eventId,
        message: 'Waiting for organizer to start an activity',
      });

      console.log(`Broadcasted activity-deactivated for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting activity deactivation:', error);
    }
  }

  /**
   * Broadcast activity updates to all participants in an event
   * Called when activity configuration changes
   */
  async broadcastActivityUpdated(io: TypedServer, eventId: string, activityId: string): Promise<void> {
    try {
      // Get the updated activity details
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found for broadcast`);
        return;
      }

      // Only broadcast if activity is currently active
      const event = await this.eventRepo.getEvent(eventId);
      if (event && event.activeActivityId === activityId) {
        io.to(eventId).emit('activity-updated', {
          eventId,
          activity,
        });

        console.log(`Broadcasted activity-updated for activity ${activityId} in event ${eventId}`);
      }
    } catch (error) {
      console.error('Error broadcasting activity update:', error);
    }
  }

  /**
   * Send waiting state to a participant when they join an event with no active activity
   */
  async sendWaitingState(socket: TypedSocket, eventId: string): Promise<void> {
    try {
      socket.emit('waiting-for-activity', {
        eventId,
        message: 'Waiting for organizer to start an activity',
      });

      console.log(`Sent waiting state to participant in event ${eventId}`);
    } catch (error) {
      console.error('Error sending waiting state:', error);
    }
  }

  /**
   * Broadcast poll started event to all participants in an event
   * Called by API endpoints when an organizer starts a poll
   */
  async broadcastPollStarted(
    io: TypedServer,
    eventId: string,
    activityId: string,
    question: string,
    options: any[]
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('poll-started', {
        activityId,
        question,
        options,
      });

      console.log(`Broadcasted poll-started for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting poll start:', error);
    }
  }

  /**
   * Broadcast poll vote submitted event to all participants in an event
   * Called by API endpoints when a participant submits a vote
   */
  async broadcastPollVoteSubmitted(
    io: TypedServer,
    eventId: string,
    activityId: string,
    participantId: string
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('poll-vote-submitted', {
        activityId,
        participantId,
      });

      console.log(`Broadcasted poll-vote-submitted for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting poll vote submission:', error);
    }
  }

  /**
   * Broadcast poll results updated event to all participants in an event
   * Called by API endpoints when live results should be shown
   */
  async broadcastPollResultsUpdated(
    io: TypedServer,
    eventId: string,
    activityId: string,
    results: { totalVotes: number; options: any[] }
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('poll-results-updated', {
        activityId,
        results,
      });

      console.log(`Broadcasted poll-results-updated for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting poll results update:', error);
    }
  }

  /**
   * Broadcast poll ended event to all participants in an event
   * Called by API endpoints when an organizer ends a poll
   */
  async broadcastPollEnded(
    io: TypedServer,
    eventId: string,
    activityId: string,
    finalResults: { totalVotes: number; options: any[] }
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('poll-ended', {
        activityId,
        finalResults,
      });

      console.log(`Broadcasted poll-ended for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting poll end:', error);
    }
  }

  /**
   * Broadcast raffle started event to all participants in an event
   * Called by API endpoints when an organizer starts a raffle
   */
  async broadcastRaffleStarted(
    io: TypedServer,
    eventId: string,
    activityId: string,
    prizeDescription: string,
    entryMethod: 'automatic' | 'manual'
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('raffle-started', {
        activityId,
        prizeDescription,
        entryMethod,
      });

      console.log(`Broadcasted raffle-started for activity ${activityId} in event ${eventId} (${entryMethod} entry)`);
    } catch (error) {
      console.error('Error broadcasting raffle start:', error);
    }
  }

  /**
   * Broadcast raffle entry confirmed event to all participants in an event
   * Called by API endpoints when a participant enters a raffle
   */
  async broadcastRaffleEntryConfirmed(
    io: TypedServer,
    eventId: string,
    activityId: string,
    participantId: string
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('raffle-entry-confirmed', {
        activityId,
        participantId,
      });

      console.log(`Broadcasted raffle-entry-confirmed for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting raffle entry confirmation:', error);
    }
  }

  /**
   * Broadcast raffle drawing event to all participants in an event
   * Called by API endpoints when the organizer initiates winner drawing
   * This triggers animation on the frontend
   */
  async broadcastRaffleDrawing(
    io: TypedServer,
    eventId: string,
    activityId: string
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('raffle-drawing', {
        activityId,
      });

      console.log(`Broadcasted raffle-drawing for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting raffle drawing:', error);
    }
  }

  /**
   * Broadcast raffle winners announced event to all participants in an event
   * Called by API endpoints after winners are drawn
   * Includes winner information and triggers celebration animations
   */
  async broadcastRaffleWinnersAnnounced(
    io: TypedServer,
    eventId: string,
    activityId: string,
    winners: Array<{ participantId: string; participantName: string }>
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('raffle-winners-announced', {
        activityId,
        winners,
      });

      console.log(`Broadcasted raffle-winners-announced for activity ${activityId} in event ${eventId} with ${winners.length} winners`);
    } catch (error) {
      console.error('Error broadcasting raffle winners announcement:', error);
    }
  }

  /**
   * Broadcast raffle ended event to all participants in an event
   * Called by API endpoints when an organizer ends a raffle
   */
  async broadcastRaffleEnded(
    io: TypedServer,
    eventId: string,
    activityId: string
  ): Promise<void> {
    try {
      // Broadcast to all participants in the event room
      io.to(eventId).emit('raffle-ended', {
        activityId,
      });

      console.log(`Broadcasted raffle-ended for activity ${activityId} in event ${eventId}`);
    } catch (error) {
      console.error('Error broadcasting raffle end:', error);
    }
  }

  /**
   * Handle participant joining an event
   */
  private async handleJoinEvent(
    io: TypedServer,
    socket: TypedSocket,
    payload: JoinEventPayload
  ): Promise<void> {
    try {
      console.log('🔍 handleJoinEvent called with:', payload);
      const { eventId, participantName } = payload;

      // Validate input
      if (!eventId || !participantName || participantName.trim().length === 0) {
        console.log('❌ Invalid input:', { eventId, participantName });
        socket.emit('error', {
          message: 'Invalid event ID or participant name',
        });
        return;
      }

      // Validate event exists
      console.log('🔍 Looking for event:', eventId);
      const event = await this.eventRepo.getEvent(eventId);
      if (!event) {
        console.log('❌ Event not found:', eventId);
        socket.emit('error', {
          message: 'Event not found',
        });
        return;
      }
      console.log('✅ Event found:', event.name);

      // Check if event is still accepting participants
      if (event.status === 'completed') {
        socket.emit('error', {
          message: 'This quiz has already ended',
        });
        return;
      }

      // Join the event room
      socket.join(eventId);
      console.log(`✅ Participant socket ${socket.id} joined room ${eventId}`);

      // Create participant
      const participant: Participant = {
        id: socket.id,
        participantId: socket.id, // DynamoDB key
        eventId,
        name: participantName.trim(),
        score: 0,
        totalAnswerTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        answers: [],
        joinedAt: Date.now(),
      };

      await this.participantRepo.addParticipant(participant);
      participantSockets.set(socket.id, socket.id);

      // Confirm join to participant
      socket.emit('participant-joined', {
        participantId: socket.id,
        participantName: participant.name,
      });

      // Broadcast updated participant list to all in the room
      const participants = await this.participantRepo.getParticipants(eventId);
      io.to(eventId).emit('participants-updated', { participants });

      // Also notify the organizer's dashboard about participant count update
      if (event.organizerId) {
        io.to(`organizer-${event.organizerId}`).emit('participants-updated', { participants });
      }

      // Check if there's an active activity and send appropriate state
      if (event.activeActivityId) {
        // Get the active activity and send it to the participant
        const activeActivity = await this.activityRepo.findById(event.activeActivityId);
        if (activeActivity) {
          socket.emit('activity-activated', {
            eventId,
            activity: activeActivity,
          });
          console.log(`Sent active activity ${activeActivity.name} to participant ${participant.name}`);
        }
      } else {
        // No active activity, send waiting state
        await this.sendWaitingState(socket, eventId);
      }

      console.log(`Participant ${participant.name} joined event ${eventId}`);
    } catch (error) {
      console.error('Error in join-event handler:', error);
      socket.emit('error', {
        message: 'Failed to join event. Please try again.',
      });
    }
  }

  /**
   * Handle quiz start
   */
  private async handleStartQuiz(
    io: TypedServer,
    _socket: TypedSocket,
    payload: StartQuizPayload
  ): Promise<void> {
    try {
      const { activityId } = payload;

      // Get the activity to get the eventId
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found`);
        return;
      }

      if (activity.type !== 'quiz') {
        console.error(`Activity ${activityId} is not a quiz`);
        return;
      }

      const eventId = activity.eventId;

      // Start the quiz using QuizActivityService
      await this.quizActivityService.startQuiz(activityId);

      // Update event status to active (for backward compatibility)
      await this.eventRepo.updateEventStatus(eventId, 'active');

      // Broadcast quiz started to all participants in the event room
      io.to(eventId).emit('quiz-started', { activityId, eventId });

      console.log(`Quiz activity ${activityId} started for event ${eventId}`);
    } catch (error) {
      console.error('Error in start-quiz handler:', error);
    }
  }

  /**
   * Handle next question
   */
  private async handleNextQuestion(
    io: TypedServer,
    _socket: TypedSocket,
    payload: NextQuestionPayload
  ): Promise<void> {
    try {
      const { activityId, questionId } = payload;
      console.log('handleNextQuestion received:', { activityId, questionId });

      // Get the activity to get the eventId
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found`);
        return;
      }

      if (activity.type !== 'quiz') {
        console.error(`Activity ${activityId} is not a quiz`);
        return;
      }

      const eventId = activity.eventId;

      // Clear any existing timer for this activity
      this.clearTimer(activityId);

      // Get the question using QuizActivityService
      const question = await this.quizActivityService.nextQuestion(activityId, questionId);
      console.log('Question found:', question.text);

      // Get all questions to determine question number
      const allQuestions = await this.quizActivityService.getQuestions(activityId);
      const questionNumber = allQuestions.findIndex(q => q.id === questionId) + 1;
      const totalQuestions = allQuestions.length;
      console.log(`Question ${questionNumber} of ${totalQuestions}`);

      // Update current question index (for backward compatibility)
      await this.eventRepo.updateCurrentQuestionIndex(eventId, questionNumber - 1);

      // Log which sockets are in the room
      const socketsInRoom = await io.in(eventId).allSockets();
      console.log(`Sockets in room ${eventId}:`, Array.from(socketsInRoom));
      console.log(`Number of sockets in room: ${socketsInRoom.size}`);

      // Broadcast question to all participants in the event room
      const startTime = Date.now();
      io.to(eventId).emit('question-displayed', {
        activityId,
        question,
        questionNumber,
        totalQuestions,
        startTime,
      });

      console.log(`✅ Question ${questionNumber} displayed for activity ${activityId} - broadcasted to ${socketsInRoom.size} sockets`);

      // Start timer if configured
      if (question.timerSeconds) {
        this.startTimer(io, activityId, eventId, questionId, question.timerSeconds);
      }
    } catch (error) {
      console.error('Error in next-question handler:', error);
    }
  }

  /**
   * Handle answer submission
   */
  private async handleSubmitAnswer(
    io: TypedServer,
    socket: TypedSocket,
    payload: SubmitAnswerPayload
  ): Promise<void> {
    try {
      const { activityId, questionId, answerId, responseTime } = payload;
      const participantId = socket.id;

      // Validate input
      if (!activityId || !questionId || !answerId || responseTime < 0) {
        socket.emit('error', {
          message: 'Invalid answer submission data',
        });
        return;
      }

      // Get the activity to get the eventId
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found`);
        socket.emit('error', {
          message: 'Activity not found',
        });
        return;
      }

      if (activity.type !== 'quiz') {
        console.error(`Activity ${activityId} is not a quiz`);
        socket.emit('error', {
          message: 'Activity is not a quiz',
        });
        return;
      }

      const eventId = activity.eventId;

      // Submit answer using QuizActivityService
      try {
        const result = await this.quizActivityService.submitAnswer(
          activityId,
          participantId,
          questionId,
          answerId,
          responseTime
        );

        console.log(
          `Answer submitted for activity ${activityId}: ${result.isCorrect ? 'Correct' : 'Incorrect'} (Points: ${result.pointsEarned}, Streak: ${result.currentStreak})`
        );

        // Send answer result to participant with current streak
        socket.emit('answer-result', {
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned,
          correctOptionId: result.correctOptionId,
          currentStreak: result.currentStreak,
        });

        // Broadcast updated participant list with new scores to all in the event
        const updatedParticipants = await this.participantRepo.getParticipants(eventId);
        io.to(eventId).emit('participants-updated', { participants: updatedParticipants });
      } catch (error: any) {
        // Handle duplicate submission
        if (error.message === 'Answer already submitted for this question') {
          console.log(
            `Duplicate answer submission prevented for participant ${participantId}, question ${questionId}`
          );
          // Silently ignore duplicate submissions (accept first only)
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in submit-answer handler:', error);
      socket.emit('error', {
        message: 'Failed to submit answer. Please try again.',
      });
    }
  }

  /**
   * Handle quiz end
   */
  private async handleEndQuiz(
    io: TypedServer,
    _socket: TypedSocket,
    payload: EndQuizPayload
  ): Promise<void> {
    try {
      const { activityId } = payload;

      // Get the activity to get the eventId
      const activity = await this.activityRepo.findById(activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found`);
        return;
      }

      if (activity.type !== 'quiz') {
        console.error(`Activity ${activityId} is not a quiz`);
        return;
      }

      const eventId = activity.eventId;

      // Clear any active timer
      this.clearTimer(activityId);

      // End the quiz using QuizActivityService
      const results = await this.quizActivityService.endQuiz(activityId);

      // Update event status to completed (for backward compatibility)
      await this.eventRepo.updateEventStatus(eventId, 'completed');
      
      // Update participant count in the event
      const event = await this.eventRepo.getEvent(eventId);
      if (event) {
        await this.eventRepo.updateEvent(eventId, {
          participantCount: results.participantCount,
          completedAt: Date.now(),
        });
      }

      // Broadcast quiz ended with final leaderboard and top 3
      io.to(eventId).emit('quiz-ended', {
        activityId,
        finalLeaderboard: results.finalLeaderboard,
        topThree: results.topThree,
      });

      console.log(`Quiz activity ${activityId} ended for event ${eventId} with ${results.participantCount} participants`);
    } catch (error) {
      console.error('Error in end-quiz handler:', error);
    }
  }

  /**
   * Handle get nickname suggestions
   */
  private handleGetNicknameSuggestions(
    socket: TypedSocket,
    payload: GetNicknameSuggestionsPayload
  ): void {
    try {
      const count = payload.count || 3;
      const suggestions = generateNicknameSuggestions(count);

      socket.emit('nickname-suggestions', { suggestions });

      console.log(`Generated ${count} nickname suggestions for client ${socket.id}`);
    } catch (error) {
      console.error('Error in get-nickname-suggestions handler:', error);
      socket.emit('error', {
        message: 'Failed to generate nickname suggestions',
      });
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: TypedSocket): void {
    const participantId = participantSockets.get(socket.id);
    if (participantId) {
      participantSockets.delete(socket.id);
      console.log(`Participant ${participantId} disconnected`);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  }

  /**
   * Start a countdown timer for a question
   */
  private startTimer(
    io: TypedServer,
    activityId: string,
    eventId: string,
    questionId: string,
    timerSeconds: number
  ): void {
    let remainingSeconds = timerSeconds;

    const timerId = setInterval(async () => {
      remainingSeconds--;

      // Emit timer tick to all participants in the event room
      io.to(eventId).emit('timer-tick', { remainingSeconds });

      // When timer expires
      if (remainingSeconds <= 0) {
        this.clearTimer(activityId);

        // Emit question ended
        io.to(eventId).emit('question-ended', { activityId, questionId });

        // Calculate and broadcast answer statistics and leaderboard
        try {
          // Get answer statistics using QuizActivityService
          const statistics = await this.quizActivityService.getAnswerStatistics(
            activityId,
            questionId
          );

          // Broadcast answer statistics
          io.to(eventId).emit('answer-statistics', { activityId, statistics });

          // Get and broadcast leaderboard using QuizActivityService
          const leaderboard = await this.quizActivityService.getLeaderboard(activityId);
          io.to(eventId).emit('leaderboard-updated', { activityId, leaderboard });
        } catch (error) {
          console.error('Error calculating statistics and leaderboard:', error);
        }

        console.log(`Timer expired for question ${questionId} in activity ${activityId}`);
      }
    }, 1000);

    activeTimers.set(activityId, timerId);
  }

  /**
   * Clear active timer for an activity
   */
  private clearTimer(activityId: string): void {
    const timerId = activeTimers.get(activityId);
    if (timerId) {
      clearInterval(timerId);
      activeTimers.delete(activityId);
    }
  }
}
