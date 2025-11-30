/**
 * ActivityRepository Tests
 * 
 * Basic tests to verify ActivityRepository CRUD operations
 */
import { describe, it, expect, afterAll } from 'vitest';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import { QuizActivity, PollActivity, RaffleActivity } from '../types/models';
import { randomUUID } from 'crypto';

describe('ActivityRepository', () => {
  const activityRepository = new ActivityRepository();
  const testEventId = `test-event-${randomUUID()}`;
  const createdActivityIds: string[] = [];

  // Cleanup after all tests
  afterAll(async () => {
    for (const activityId of createdActivityIds) {
      try {
        await activityRepository.delete(activityId);
      } catch (error) {
        console.log(`Failed to cleanup activity ${activityId}:`, error);
      }
    }
  });

  describe('create', () => {
    it('should create a quiz activity', async () => {
      const quizActivity: QuizActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'quiz',
        name: 'Test Quiz',
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

      const result = await activityRepository.create(quizActivity);
      createdActivityIds.push(result.activityId);

      expect(result).toEqual(quizActivity);
      expect(result.type).toBe('quiz');
      expect(result.name).toBe('Test Quiz');
    });

    it('should create a poll activity', async () => {
      const pollActivity: PollActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'poll',
        name: 'Test Poll',
        status: 'draft',
        order: 2,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'opt1', text: 'Red', voteCount: 0 },
          { id: 'opt2', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      const result = await activityRepository.create(pollActivity);
      createdActivityIds.push(result.activityId);

      expect(result).toEqual(pollActivity);
      expect(result.type).toBe('poll');
      if (result.type === 'poll') {
        expect(result.question).toBe('What is your favorite color?');
      }
    });

    it('should create a raffle activity', async () => {
      const raffleActivity: RaffleActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'raffle',
        name: 'Test Raffle',
        status: 'draft',
        order: 3,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'Grand Prize',
        entryMethod: 'automatic',
        winnerCount: 1,
        winners: [],
      };

      const result = await activityRepository.create(raffleActivity);
      createdActivityIds.push(result.activityId);

      expect(result).toEqual(raffleActivity);
      expect(result.type).toBe('raffle');
      if (result.type === 'raffle') {
        expect(result.prizeDescription).toBe('Grand Prize');
      }
    });
  });

  describe('findById', () => {
    it('should retrieve an activity by ID', async () => {
      const activity: QuizActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'quiz',
        name: 'Find By ID Test',
        status: 'ready',
        order: 4,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: false,
        streakTrackingEnabled: false,
      };

      await activityRepository.create(activity);
      createdActivityIds.push(activity.activityId);

      const found = await activityRepository.findById(activity.activityId);
      expect(found).not.toBeNull();
      expect(found?.activityId).toBe(activity.activityId);
      expect(found?.name).toBe('Find By ID Test');
    });

    it('should return null for non-existent activity', async () => {
      const found = await activityRepository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should retrieve all activities for an event ordered by order field', async () => {
      const eventId = `test-event-${randomUUID()}`;
      
      const activity1: QuizActivity = {
        activityId: randomUUID(),
        eventId: eventId,
        type: 'quiz',
        name: 'Activity 1',
        status: 'draft',
        order: 2,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      const activity2: PollActivity = {
        activityId: randomUUID(),
        eventId: eventId,
        type: 'poll',
        name: 'Activity 2',
        status: 'draft',
        order: 1,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'Test question?',
        options: [],
        allowMultipleVotes: false,
        showResultsLive: false,
      };

      await activityRepository.create(activity1);
      await activityRepository.create(activity2);
      createdActivityIds.push(activity1.activityId, activity2.activityId);

      const activities = await activityRepository.findByEventId(eventId);
      expect(activities.length).toBe(2);
      // Should be ordered by order field
      expect(activities[0].name).toBe('Activity 2'); // order: 1
      expect(activities[1].name).toBe('Activity 1'); // order: 2
    });

    it('should return empty array for event with no activities', async () => {
      const activities = await activityRepository.findByEventId('non-existent-event');
      expect(activities).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update activity fields', async () => {
      const activity: QuizActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'quiz',
        name: 'Original Name',
        status: 'draft',
        order: 5,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      await activityRepository.create(activity);
      createdActivityIds.push(activity.activityId);

      const updated = await activityRepository.update(activity.activityId, {
        name: 'Updated Name',
        status: 'ready',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('ready');
      expect(updated.activityId).toBe(activity.activityId);
    });
  });

  describe('setStatus', () => {
    it('should update activity status', async () => {
      const activity: QuizActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'quiz',
        name: 'Status Test',
        status: 'draft',
        order: 6,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      await activityRepository.create(activity);
      createdActivityIds.push(activity.activityId);

      await activityRepository.setStatus(activity.activityId, 'active');

      const found = await activityRepository.findById(activity.activityId);
      expect(found?.status).toBe('active');
    });
  });

  describe('delete', () => {
    it('should delete an activity', async () => {
      const activity: QuizActivity = {
        activityId: randomUUID(),
        eventId: testEventId,
        type: 'quiz',
        name: 'Delete Test',
        status: 'draft',
        order: 7,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      await activityRepository.create(activity);

      await activityRepository.delete(activity.activityId);

      const found = await activityRepository.findById(activity.activityId);
      expect(found).toBeNull();
    });
  });
});
