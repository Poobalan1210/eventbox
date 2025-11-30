/**
 * Activity Routes Tests
 * Tests for activity API endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Event, QuizActivity } from '../types/models.js';

// Create mock instances
const mockEventRepository = {
  getEvent: vi.fn(),
  setActiveActivity: vi.fn(),
};

const mockActivityRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByEventId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  setStatus: vi.fn(),
};

// Mock the repositories before importing the service
vi.mock('../db/repositories/EventRepository.js', () => ({
  EventRepository: vi.fn().mockImplementation(() => mockEventRepository)
}));

vi.mock('../db/repositories/ActivityRepository.js', () => ({
  ActivityRepository: vi.fn().mockImplementation(() => mockActivityRepository)
}));

// Import after mocking
import {
  createActivity,
  activateActivity,
  deleteActivity,
} from '../services/activityService.js';

describe('Activity Service Integration', () => {
  let mockEventRepository: any;
  let mockActivityRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventRepository = new EventRepository();
    mockActivityRepository = new ActivityRepository();
  });

  describe('createActivity', () => {
    it('should create a quiz activity with default settings', async () => {
      const eventId = 'event-123';
      const mockEvent: Event = {
        eventId,
        id: eventId,
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
      };

      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);
      vi.spyOn(activityRepository, 'findByEventId').mockResolvedValue([]);
      vi.spyOn(activityRepository, 'create').mockImplementation(async (activity) => activity);

      const activity = await createActivity(eventId, {
        name: 'Test Quiz',
        type: 'quiz',
      });

      expect(activity.type).toBe('quiz');
      expect(activity.name).toBe('Test Quiz');
      expect(activity.eventId).toBe(eventId);
      expect(activity.status).toBe('draft');
      expect((activity as QuizActivity).scoringEnabled).toBe(true);
    });

    it('should create a poll activity', async () => {
      const eventId = 'event-123';
      const mockEvent: Event = {
        eventId,
        id: eventId,
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
      };

      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);
      vi.spyOn(activityRepository, 'findByEventId').mockResolvedValue([]);
      vi.spyOn(activityRepository, 'create').mockImplementation(async (activity) => activity);

      const activity = await createActivity(eventId, {
        name: 'Test Poll',
        type: 'poll',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
      });

      expect(activity.type).toBe('poll');
      expect(activity.name).toBe('Test Poll');
    });

    it('should throw error if event not found', async () => {
      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(null);

      await expect(
        createActivity('nonexistent', {
          name: 'Test',
          type: 'quiz',
        })
      ).rejects.toThrow('Event not found');
    });

    it('should throw error if activity name is empty', async () => {
      const mockEvent: Event = {
        eventId: 'event-123',
        id: 'event-123',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
      };

      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);

      await expect(
        createActivity('event-123', {
          name: '',
          type: 'quiz',
        })
      ).rejects.toThrow('Activity name is required');
    });
  });

  describe('activateActivity', () => {
    it('should activate an activity and deactivate previous one', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-123';
      const previousActivityId = 'activity-456';

      const mockEvent: Event = {
        eventId,
        id: eventId,
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: previousActivityId,
      };

      const mockActivity: QuizActivity = {
        activityId,
        eventId,
        type: 'quiz',
        name: 'Test Quiz',
        status: 'ready',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      const mockPreviousActivity: QuizActivity = {
        activityId: previousActivityId,
        eventId,
        type: 'quiz',
        name: 'Previous Quiz',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);
      vi.spyOn(activityRepository, 'findById')
        .mockResolvedValueOnce(mockActivity)
        .mockResolvedValueOnce(mockPreviousActivity);
      vi.spyOn(activityRepository, 'setStatus').mockResolvedValue(undefined);
      vi.spyOn(eventRepository, 'setActiveActivity').mockResolvedValue(undefined);

      await activateActivity(eventId, activityId);

      expect(activityRepository.setStatus).toHaveBeenCalledWith(previousActivityId, 'completed');
      expect(activityRepository.setStatus).toHaveBeenCalledWith(activityId, 'active');
      expect(eventRepository.setActiveActivity).toHaveBeenCalledWith(eventId, activityId);
    });

    it('should throw error if activity is in draft status', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-123';

      const mockEvent: Event = {
        eventId,
        id: eventId,
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
      };

      const mockActivity: QuizActivity = {
        activityId,
        eventId,
        type: 'quiz',
        name: 'Test Quiz',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);
      vi.spyOn(activityRepository, 'findById').mockResolvedValue(mockActivity);

      await expect(activateActivity(eventId, activityId)).rejects.toThrow(
        'Cannot activate activity in draft status'
      );
    });
  });

  describe('deleteActivity', () => {
    it('should throw error if trying to delete active activity', async () => {
      const activityId = 'activity-123';
      const eventId = 'event-123';

      const mockActivity: QuizActivity = {
        activityId,
        eventId,
        type: 'quiz',
        name: 'Test Quiz',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      const mockEvent: Event = {
        eventId,
        id: eventId,
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-123',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://test.com',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: activityId,
      };

      vi.spyOn(activityRepository, 'findById').mockResolvedValue(mockActivity);
      vi.spyOn(eventRepository, 'getEvent').mockResolvedValue(mockEvent);

      await expect(deleteActivity(activityId)).rejects.toThrow(
        'Cannot delete currently active activity'
      );
    });
  });
});
