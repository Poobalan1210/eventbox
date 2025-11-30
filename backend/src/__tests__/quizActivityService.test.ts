/**
 * QuizActivityService Tests
 * Tests quiz-specific activity operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { QuizActivityService } from '../services/quizActivityService.js';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { EventRepository } from '../db/repositories/EventRepository.js';
import { QuestionRepository } from '../db/repositories/QuestionRepository.js';
import { ParticipantRepository } from '../db/repositories/ParticipantRepository.js';
import { Question, QuizActivity, Participant } from '../types/models.js';

describe('QuizActivityService', () => {
  const quizActivityService = new QuizActivityService();
  const activityRepo = new ActivityRepository();
  const eventRepo = new EventRepository();
  const questionRepo = new QuestionRepository();
  const participantRepo = new ParticipantRepository();

  let testEventId: string;
  let testActivityId: string;
  const createdQuestionIds: string[] = [];
  const createdParticipantIds: string[] = [];

  beforeAll(async () => {
    // Create a test event
    const eventId = `event-${Date.now()}`;
    const now = Date.now();
    const event = await eventRepo.createEvent({
      eventId,
      id: eventId,
      name: 'Test Quiz Event',
      gamePin: Math.floor(100000 + Math.random() * 900000).toString(),
      organizerId: 'test-organizer',
      status: 'draft',
      currentQuestionIndex: 0,
      createdAt: now,
      joinLink: `http://localhost:3000/join/${eventId}`,
      visibility: 'private',
      isTemplate: false,
      lastModified: now,
      participantCount: 0,
    });
    testEventId = event.eventId;

    // Create a test quiz activity
    const activityId = `activity-${Date.now()}`;
    const activity: QuizActivity = {
      activityId,
      eventId: testEventId,
      type: 'quiz',
      name: 'Test Quiz Activity',
      status: 'draft',
      order: 1,
      createdAt: Date.now(),
      lastModified: Date.now(),
      questions: [],
      currentQuestionIndex: 0,
      scoringEnabled: true,
      speedBonusEnabled: true,
      streakTrackingEnabled: true,
    };
    await activityRepo.create(activity);
    testActivityId = activity.activityId;
  });

  afterAll(async () => {
    // Clean up created questions
    for (const questionId of createdQuestionIds) {
      try {
        await questionRepo.deleteQuestion(testEventId, questionId);
      } catch (error) {
        console.error(`Failed to delete question ${questionId}:`, error);
      }
    }

    // Clean up created participants
    for (const participantId of createdParticipantIds) {
      try {
        await participantRepo.deleteParticipant(testEventId, participantId);
      } catch (error) {
        console.error(`Failed to delete participant ${participantId}:`, error);
      }
    }

    // Clean up activity and event
    try {
      await activityRepo.delete(testActivityId);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }

    try {
      await eventRepo.deleteEvent(testEventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  });

  describe('addQuestion', () => {
    it('should add a question to a quiz activity', async () => {
      const questionData = {
        eventId: testEventId,
        text: 'What is 2 + 2?',
        options: [
          { id: 'opt1', text: '3', color: 'red' as const, shape: 'triangle' as const },
          { id: 'opt2', text: '4', color: 'blue' as const, shape: 'circle' as const },
          { id: 'opt3', text: '5', color: 'green' as const, shape: 'square' as const },
        ],
        correctOptionId: 'opt2',
        timerSeconds: 30,
        order: 1,
      };

      const question = await quizActivityService.addQuestion(testActivityId, questionData);

      expect(question).toBeDefined();
      expect(question.text).toBe('What is 2 + 2?');
      expect(question.options).toHaveLength(3);
      expect(question.correctOptionId).toBe('opt2');

      createdQuestionIds.push(question.questionId);
    });

    it('should throw error when adding question to non-existent activity', async () => {
      const questionData = {
        eventId: testEventId,
        text: 'Test question',
        options: [],
        correctOptionId: 'opt1',
        timerSeconds: 30,
        order: 1,
      };

      await expect(
        quizActivityService.addQuestion('non-existent-activity', questionData)
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('getQuestions', () => {
    it('should retrieve all questions for a quiz activity', async () => {
      const questions = await quizActivityService.getQuestions(testActivityId);

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });
  });

  describe('startQuiz', () => {
    it('should start a quiz activity', async () => {
      await quizActivityService.startQuiz(testActivityId);

      const activity = await activityRepo.findById(testActivityId);
      expect(activity?.status).toBe('active');
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer and calculate score', async () => {
      // Create a participant
      const participant: Participant = {
        id: 'test-participant-1',
        participantId: 'test-participant-1',
        eventId: testEventId,
        name: 'Test Participant',
        score: 0,
        totalAnswerTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        answers: [],
        joinedAt: Date.now(),
      };

      await participantRepo.addParticipant(participant);
      createdParticipantIds.push(participant.participantId);

      // Get a question
      const questions = await quizActivityService.getQuestions(testActivityId);
      expect(questions.length).toBeGreaterThan(0);

      const question = questions[0];
      const correctOptionId = question.correctOptionId;

      // Submit correct answer
      const result = await quizActivityService.submitAnswer(
        testActivityId,
        participant.participantId,
        question.questionId,
        correctOptionId,
        5000 // 5 seconds response time
      );

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(0);
      expect(result.correctOptionId).toBe(correctOptionId);
      expect(result.currentStreak).toBe(1);
    });

    it('should handle incorrect answer', async () => {
      // Create another participant
      const participant: Participant = {
        id: 'test-participant-2',
        participantId: 'test-participant-2',
        eventId: testEventId,
        name: 'Test Participant 2',
        score: 0,
        totalAnswerTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        answers: [],
        joinedAt: Date.now(),
      };

      await participantRepo.addParticipant(participant);
      createdParticipantIds.push(participant.participantId);

      // Get a question
      const questions = await quizActivityService.getQuestions(testActivityId);
      const question = questions[0];
      
      // Find an incorrect option
      const incorrectOption = question.options.find(
        opt => opt.id !== question.correctOptionId
      );
      expect(incorrectOption).toBeDefined();

      // Submit incorrect answer
      const result = await quizActivityService.submitAnswer(
        testActivityId,
        participant.participantId,
        question.questionId,
        incorrectOption!.id,
        5000
      );

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.currentStreak).toBe(0);
    });
  });

  describe('endQuiz', () => {
    it('should end a quiz and return results', async () => {
      const results = await quizActivityService.endQuiz(testActivityId);

      expect(results).toBeDefined();
      expect(results.finalLeaderboard).toBeDefined();
      expect(Array.isArray(results.finalLeaderboard)).toBe(true);
      expect(results.topThree).toBeDefined();
      expect(results.participantCount).toBeGreaterThan(0);

      const activity = await activityRepo.findById(testActivityId);
      expect(activity?.status).toBe('completed');
    });
  });
});
