/**
 * EventRepository Tests
 * Tests for activity-related methods in EventRepository
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EventRepository } from '../db/repositories/EventRepository';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import { Event, Activity, QuizActivity } from '../types/models';

describe('EventRepository - Activity Support', () => {
  let eventRepo: EventRepository;
  let activityRepo: ActivityRepository;

  beforeEach(() => {
    eventRepo = new EventRepository();
    activityRepo = new ActivityRepository();
  });

  describe('setActiveActivity', () => {
    it('should set the active activity for an event', async () => {
      // Create a test event
      const event: Event = {
        eventId: 'test-event-1',
        id: 'test-event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123456',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      await eventRepo.createEvent(event);

      // Set active activity
      await eventRepo.setActiveActivity('test-event-1', 'activity-1');

      // Verify it was set
      const activeActivityId = await eventRepo.getActiveActivity('test-event-1');
      expect(activeActivityId).toBe('activity-1');

      // Cleanup
      await eventRepo.deleteEvent('test-event-1');
    });

    it('should allow setting active activity to null', async () => {
      // Create a test event with an active activity
      const event: Event = {
        eventId: 'test-event-2',
        id: 'test-event-2',
        name: 'Test Event',
        gamePin: '123457',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123457',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: 'activity-1',
      };

      await eventRepo.createEvent(event);

      // Set active activity to null
      await eventRepo.setActiveActivity('test-event-2', null);

      // Verify it was set to null
      const activeActivityId = await eventRepo.getActiveActivity('test-event-2');
      expect(activeActivityId).toBeNull();

      // Cleanup
      await eventRepo.deleteEvent('test-event-2');
    });
  });

  describe('getActiveActivity', () => {
    it('should return null when no activity is active', async () => {
      // Create a test event
      const event: Event = {
        eventId: 'test-event-3',
        id: 'test-event-3',
        name: 'Test Event',
        gamePin: '123458',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123458',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      await eventRepo.createEvent(event);

      // Get active activity
      const activeActivityId = await eventRepo.getActiveActivity('test-event-3');
      expect(activeActivityId).toBeNull();

      // Cleanup
      await eventRepo.deleteEvent('test-event-3');
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        eventRepo.getActiveActivity('non-existent-event')
      ).rejects.toThrow('Event not found');
    });
  });

  describe('listActivities', () => {
    it('should return empty array when event has no activities', async () => {
      // Create a test event
      const event: Event = {
        eventId: 'test-event-4',
        id: 'test-event-4',
        name: 'Test Event',
        gamePin: '123459',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123459',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      await eventRepo.createEvent(event);

      // List activities
      const activities = await eventRepo.listActivities('test-event-4');
      expect(activities).toEqual([]);

      // Cleanup
      await eventRepo.deleteEvent('test-event-4');
    });

    it('should return all activities for an event', async () => {
      // Create a test event
      const event: Event = {
        eventId: 'test-event-5',
        id: 'test-event-5',
        name: 'Test Event',
        gamePin: '123460',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123460',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      await eventRepo.createEvent(event);

      // Create activities
      const activity1: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'test-event-5',
        type: 'quiz',
        name: 'Quiz 1',
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

      const activity2: QuizActivity = {
        activityId: 'activity-2',
        eventId: 'test-event-5',
        type: 'quiz',
        name: 'Quiz 2',
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

      await activityRepo.create(activity1);
      await activityRepo.create(activity2);

      // List activities
      const activities = await eventRepo.listActivities('test-event-5');
      expect(activities.length).toBe(2);
      expect(activities[0].activityId).toBe('activity-1');
      expect(activities[1].activityId).toBe('activity-2');

      // Cleanup
      await eventRepo.deleteEvent('test-event-5');
    });
  });

  describe('deleteEvent - cascade delete', () => {
    it('should delete all activities when event is deleted', async () => {
      // Create a test event
      const event: Event = {
        eventId: 'test-event-6',
        id: 'test-event-6',
        name: 'Test Event',
        gamePin: '123461',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com/join/123461',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      await eventRepo.createEvent(event);

      // Create activities
      const activity1: QuizActivity = {
        activityId: 'activity-3',
        eventId: 'test-event-6',
        type: 'quiz',
        name: 'Quiz 1',
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

      await activityRepo.create(activity1);

      // Verify activity exists
      const activitiesBefore = await eventRepo.listActivities('test-event-6');
      expect(activitiesBefore.length).toBe(1);

      // Delete event (should cascade delete activities)
      await eventRepo.deleteEvent('test-event-6');

      // Verify activity was deleted
      const deletedActivity = await activityRepo.findById('activity-3');
      expect(deletedActivity).toBeNull();
    });
  });
});
