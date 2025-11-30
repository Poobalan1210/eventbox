/**
 * ActivityService Tests
 * Tests for activity management business logic
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import { EventRepository } from '../db/repositories/EventRepository';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import * as activityService from '../services/activityService';
import { Event, QuizActivity, PollActivity, RaffleActivity } from '../types/models';

describe('ActivityService', () => {
  const eventRepository = new EventRepository();
  const activityRepository = new ActivityRepository();
  
  let testEventId: string;
  const createdActivityIds: string[] = [];

  beforeAll(async () => {
    // Create a test event
    testEventId = randomUUID();
    const testEvent: Event = {
      eventId: testEventId,
      id: testEventId,
      name: 'Test Event for Activities',
      gamePin: '123456',
      organizerId: 'test-organizer',
      status: 'setup',
      currentQuestionIndex: 0,
      createdAt: Date.now(),
      joinLink: `http://localhost:5173/join/${testEventId}`,
      visibility: 'private',
      isTemplate: false,
      lastModified: Date.now(),
      participantCount: 0,
    };
    await eventRepository.createEvent(testEvent);
  });

  afterAll(async () => {
    // Clean up created activities
    for (const activityId of createdActivityIds) {
      try {
        await activityRepository.delete(activityId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    // Clean up test event
    try {
      await eventRepository.deleteEvent(testEventId);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('createActivity', () => {
    it('should create a quiz activity', async () => {
      const activity = await activityService.createActivity(testEventId, {
        name: 'Test Quiz',
        type: 'quiz',
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      });

      createdActivityIds.push(activity.activityId);

      expect(activity).toBeDefined();
      expect(activity.type).toBe('quiz');
      expect(activity.name).toBe('Test Quiz');
      expect(activity.eventId).toBe(testEventId);
      expect(activity.status).toBe('draft');
      expect((activity as QuizActivity).scoringEnabled).toBe(true);
      expect((activity as QuizActivity).questions).toEqual([]);
    });

    it('should create a poll activity', async () => {
      const activity = await activityService.createActivity(testEventId, {
        name: 'Test Poll',
        type: 'poll',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
        allowMultipleVotes: false,
        showResultsLive: true,
      });

      createdActivityIds.push(activity.activityId);

      expect(activity).toBeDefined();
      expect(activity.type).toBe('poll');
      expect(activity.name).toBe('Test Poll');
      expect((activity as PollActivity).question).toBe('What is your favorite color?');
      expect((activity as PollActivity).options).toHaveLength(3);
    });

    it('should create a raffle activity', async () => {
      const activity = await activityService.createActivity(testEventId, {
        name: 'Test Raffle',
        type: 'raffle',
        prizeDescription: 'Free T-Shirt',
        entryMethod: 'automatic',
        winnerCount: 1,
      });

      createdActivityIds.push(activity.activityId);

      expect(activity).toBeDefined();
      expect(activity.type).toBe('raffle');
      expect(activity.name).toBe('Test Raffle');
      expect((activity as RaffleActivity).prizeDescription).toBe('Free T-Shirt');
      expect((activity as RaffleActivity).winners).toEqual([]);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        activityService.createActivity('non-existent-event', {
          name: 'Test Activity',
          type: 'quiz',
        })
      ).rejects.toThrow('Event not found');
    });

    it('should throw error for empty activity name', async () => {
      await expect(
        activityService.createActivity(testEventId, {
          name: '',
          type: 'quiz',
        })
      ).rejects.toThrow('Activity name is required');
    });
  });

  describe('getActivity', () => {
    it('should retrieve an activity by ID', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Retrievable Quiz',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      const retrieved = await activityService.getActivity(created.activityId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.activityId).toBe(created.activityId);
      expect(retrieved?.name).toBe('Retrievable Quiz');
    });

    it('should return null for non-existent activity', async () => {
      const result = await activityService.getActivity('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateActivity', () => {
    it('should update activity fields', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Original Name',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      const updated = await activityService.updateActivity(created.activityId, {
        name: 'Updated Name',
        status: 'ready',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('ready');
      expect(updated.activityId).toBe(created.activityId);
    });

    it('should throw error for non-existent activity', async () => {
      await expect(
        activityService.updateActivity('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'To Be Deleted',
        type: 'quiz',
      });

      await activityService.deleteActivity(created.activityId);

      const retrieved = await activityService.getActivity(created.activityId);
      expect(retrieved).toBeNull();
    });

    it('should throw error when deleting non-existent activity', async () => {
      await expect(
        activityService.deleteActivity('non-existent-id')
      ).rejects.toThrow('Activity not found');
    });

    it('should throw error when deleting active activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Active Activity',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      // Update to ready status first
      await activityService.updateActivity(created.activityId, { status: 'ready' });
      
      // Activate the activity
      await activityService.activateActivity(testEventId, created.activityId);

      // Try to delete - should fail
      await expect(
        activityService.deleteActivity(created.activityId)
      ).rejects.toThrow('Cannot delete currently active activity');

      // Clean up - deactivate first
      await activityService.deactivateActivity(testEventId, created.activityId);
    });
  });

  describe('activateActivity', () => {
    it('should activate an activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'To Be Activated',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      // Update to ready status first
      await activityService.updateActivity(created.activityId, { status: 'ready' });

      await activityService.activateActivity(testEventId, created.activityId);

      const event = await eventRepository.getEvent(testEventId);
      expect(event?.activeActivityId).toBe(created.activityId);

      const activity = await activityService.getActivity(created.activityId);
      expect(activity?.status).toBe('active');

      // Clean up
      await activityService.deactivateActivity(testEventId, created.activityId);
    });

    it('should enforce mutual exclusion when activating', async () => {
      const activity1 = await activityService.createActivity(testEventId, {
        name: 'Activity 1',
        type: 'quiz',
      });
      createdActivityIds.push(activity1.activityId);

      const activity2 = await activityService.createActivity(testEventId, {
        name: 'Activity 2',
        type: 'poll',
        question: 'Test?',
        options: ['Yes', 'No'],
      });
      createdActivityIds.push(activity2.activityId);

      // Set both to ready
      await activityService.updateActivity(activity1.activityId, { status: 'ready' });
      await activityService.updateActivity(activity2.activityId, { status: 'ready' });

      // Activate first activity
      await activityService.activateActivity(testEventId, activity1.activityId);

      // Activate second activity - should deactivate first
      await activityService.activateActivity(testEventId, activity2.activityId);

      const event = await eventRepository.getEvent(testEventId);
      expect(event?.activeActivityId).toBe(activity2.activityId);

      const firstActivity = await activityService.getActivity(activity1.activityId);
      expect(firstActivity?.status).toBe('completed');

      const secondActivity = await activityService.getActivity(activity2.activityId);
      expect(secondActivity?.status).toBe('active');

      // Clean up
      await activityService.deactivateActivity(testEventId, activity2.activityId);
    });

    it('should throw error when activating draft activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Draft Activity',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      await expect(
        activityService.activateActivity(testEventId, created.activityId)
      ).rejects.toThrow('Cannot activate activity in draft status');
    });
  });

  describe('deactivateActivity', () => {
    it('should deactivate an active activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'To Be Deactivated',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      // Update to ready and activate
      await activityService.updateActivity(created.activityId, { status: 'ready' });
      await activityService.activateActivity(testEventId, created.activityId);

      // Deactivate
      await activityService.deactivateActivity(testEventId, created.activityId);

      const event = await eventRepository.getEvent(testEventId);
      expect(event?.activeActivityId).toBeNull();

      const activity = await activityService.getActivity(created.activityId);
      expect(activity?.status).toBe('completed');
    });

    it('should throw error when deactivating non-active activity', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Not Active',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      await expect(
        activityService.deactivateActivity(testEventId, created.activityId)
      ).rejects.toThrow('is not currently active');
    });
  });

  describe('type-specific getters', () => {
    it('should get quiz activity with type checking', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Quiz for Type Check',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      const quiz = await activityService.getQuizActivity(created.activityId);

      expect(quiz.type).toBe('quiz');
      expect(quiz.questions).toBeDefined();
      expect(quiz.scoringEnabled).toBeDefined();
    });

    it('should get poll activity with type checking', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Poll for Type Check',
        type: 'poll',
        question: 'Test?',
        options: ['A', 'B'],
      });
      createdActivityIds.push(created.activityId);

      const poll = await activityService.getPollActivity(created.activityId);

      expect(poll.type).toBe('poll');
      expect(poll.question).toBeDefined();
      expect(poll.options).toBeDefined();
    });

    it('should get raffle activity with type checking', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Raffle for Type Check',
        type: 'raffle',
        prizeDescription: 'Prize',
      });
      createdActivityIds.push(created.activityId);

      const raffle = await activityService.getRaffleActivity(created.activityId);

      expect(raffle.type).toBe('raffle');
      expect(raffle.prizeDescription).toBeDefined();
      expect(raffle.winners).toBeDefined();
    });

    it('should throw error when getting wrong activity type', async () => {
      const created = await activityService.createActivity(testEventId, {
        name: 'Quiz Activity',
        type: 'quiz',
      });
      createdActivityIds.push(created.activityId);

      await expect(
        activityService.getPollActivity(created.activityId)
      ).rejects.toThrow('is not a poll activity');

      await expect(
        activityService.getRaffleActivity(created.activityId)
      ).rejects.toThrow('is not a raffle activity');
    });
  });
});
