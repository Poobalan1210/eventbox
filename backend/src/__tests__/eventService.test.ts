/**
 * Unit tests for EventService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from '../services/eventService';
import { Event, Activity, QuizActivity } from '../types/models';

vi.mock('../services/gamePinService', () => ({
  generateUniqueGamePin: vi.fn().mockResolvedValue('123456'),
}));

describe('EventService', () => {
  let eventService: EventService;
  let mockEventRepository: any;
  let mockActivityRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock instances
    mockEventRepository = {
      createEvent: vi.fn(),
      getEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      setActiveActivity: vi.fn(),
      getActiveActivity: vi.fn(),
      listActivities: vi.fn(),
      getEventsByOrganizer: vi.fn(),
      getPublicEvents: vi.fn(),
    };

    mockActivityRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEventId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      setStatus: vi.fn(),
    };
    
    eventService = new EventService(mockEventRepository as any, mockActivityRepository as any);
  });

  describe('createEvent', () => {
    it('should create a new event with empty activity list', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      mockEventRepository.createEvent = vi.fn().mockResolvedValue(mockEvent);

      const result = await eventService.createEvent('Test Event', 'org-1', 'private');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Event');
      expect(result.organizerId).toBe('org-1');
      expect(result.visibility).toBe('private');
      expect(result.activeActivityId).toBeNull();
      expect(mockEventRepository.createEvent).toHaveBeenCalledOnce();
    });

    it('should throw error if name is empty', async () => {
      await expect(eventService.createEvent('', 'org-1')).rejects.toThrow(
        'Event name is required and cannot be empty'
      );
    });

    it('should throw error if organizerId is empty', async () => {
      await expect(eventService.createEvent('Test Event', '')).rejects.toThrow(
        'organizerId is required and cannot be empty'
      );
    });
  });

  describe('getEvent', () => {
    it('should return event by ID', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);

      const result = await eventService.getEvent('event-1');

      expect(result).toEqual(mockEvent);
      expect(mockEventRepository.getEvent).toHaveBeenCalledWith('event-1');
    });

    it('should return null if event not found', async () => {
      mockEventRepository.getEvent = vi.fn().mockResolvedValue(null);

      const result = await eventService.getEvent('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateEvent', () => {
    it('should update event fields', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      const updatedEvent = { ...mockEvent, name: 'Updated Event' };

      mockEventRepository.getEvent = vi.fn()
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(updatedEvent);
      mockEventRepository.updateEvent = vi.fn().mockResolvedValue(undefined);

      const result = await eventService.updateEvent('event-1', { name: 'Updated Event' });

      expect(result.name).toBe('Updated Event');
      expect(mockEventRepository.updateEvent).toHaveBeenCalledWith('event-1', { name: 'Updated Event' });
    });

    it('should throw error if event not found', async () => {
      mockEventRepository.getEvent = vi.fn().mockResolvedValue(null);

      await expect(eventService.updateEvent('nonexistent', { name: 'Updated' })).rejects.toThrow(
        'Event not found: nonexistent'
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete event and cascade to activities', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockEventRepository.deleteEvent = vi.fn().mockResolvedValue(undefined);

      await eventService.deleteEvent('event-1');

      expect(mockEventRepository.deleteEvent).toHaveBeenCalledWith('event-1');
    });

    it('should throw error if event not found', async () => {
      mockEventRepository.getEvent = vi.fn().mockResolvedValue(null);

      await expect(eventService.deleteEvent('nonexistent')).rejects.toThrow(
        'Event not found: nonexistent'
      );
    });
  });

  describe('setActiveActivity', () => {
    it('should set active activity for event', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      const mockActivity: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'event-1',
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

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findById = vi.fn().mockResolvedValue(mockActivity);
      mockActivityRepository.setStatus = vi.fn().mockResolvedValue(undefined);
      mockEventRepository.setActiveActivity = vi.fn().mockResolvedValue(undefined);

      await eventService.setActiveActivity('event-1', 'activity-1');

      expect(mockActivityRepository.setStatus).toHaveBeenCalledWith('activity-1', 'active');
      expect(mockEventRepository.setActiveActivity).toHaveBeenCalledWith('event-1', 'activity-1');
    });

    it('should deactivate previous activity when setting new active activity', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: 'activity-1',
      };

      const previousActivity: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'event-1',
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

      const newActivity: QuizActivity = {
        activityId: 'activity-2',
        eventId: 'event-1',
        type: 'quiz',
        name: 'New Quiz',
        status: 'ready',
        order: 1,
        createdAt: Date.now(),
        lastModified: Date.now(),
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findById = vi.fn()
        .mockResolvedValueOnce(newActivity)
        .mockResolvedValueOnce(previousActivity);
      mockActivityRepository.setStatus = vi.fn().mockResolvedValue(undefined);
      mockEventRepository.setActiveActivity = vi.fn().mockResolvedValue(undefined);

      await eventService.setActiveActivity('event-1', 'activity-2');

      expect(mockActivityRepository.setStatus).toHaveBeenCalledWith('activity-2', 'active');
      expect(mockActivityRepository.setStatus).toHaveBeenCalledWith('activity-1', 'completed');
      expect(mockEventRepository.setActiveActivity).toHaveBeenCalledWith('event-1', 'activity-2');
    });

    it('should allow setting active activity to null', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: 'activity-1',
      };

      const previousActivity: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'event-1',
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

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findById = vi.fn().mockResolvedValue(previousActivity);
      mockActivityRepository.setStatus = vi.fn().mockResolvedValue(undefined);
      mockEventRepository.setActiveActivity = vi.fn().mockResolvedValue(undefined);

      await eventService.setActiveActivity('event-1', null);

      expect(mockActivityRepository.setStatus).toHaveBeenCalledWith('activity-1', 'completed');
      expect(mockEventRepository.setActiveActivity).toHaveBeenCalledWith('event-1', null);
    });

    it('should throw error if activity does not belong to event', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      const mockActivity: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'event-2', // Different event!
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

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findById = vi.fn().mockResolvedValue(mockActivity);

      await expect(eventService.setActiveActivity('event-1', 'activity-1')).rejects.toThrow(
        'Activity activity-1 does not belong to event event-1'
      );
    });
  });

  describe('getActiveActivity', () => {
    it('should return active activity for event', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: 'activity-1',
      };

      const mockActivity: QuizActivity = {
        activityId: 'activity-1',
        eventId: 'event-1',
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

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findById = vi.fn().mockResolvedValue(mockActivity);

      const result = await eventService.getActiveActivity('event-1');

      expect(result).toEqual(mockActivity);
      expect(mockActivityRepository.findById).toHaveBeenCalledWith('activity-1');
    });

    it('should return null if no active activity', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);

      const result = await eventService.getActiveActivity('event-1');

      expect(result).toBeNull();
    });
  });

  describe('listActivities', () => {
    it('should return all activities for event', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      const mockActivities: Activity[] = [
        {
          activityId: 'activity-1',
          eventId: 'event-1',
          type: 'quiz',
          name: 'Quiz 1',
          status: 'ready',
          order: 0,
          createdAt: Date.now(),
          lastModified: Date.now(),
          questions: [],
          currentQuestionIndex: 0,
          scoringEnabled: true,
          speedBonusEnabled: true,
          streakTrackingEnabled: true,
        },
        {
          activityId: 'activity-2',
          eventId: 'event-1',
          type: 'poll',
          name: 'Poll 1',
          status: 'draft',
          order: 1,
          createdAt: Date.now(),
          lastModified: Date.now(),
          question: 'Test question?',
          options: [],
          allowMultipleVotes: false,
          showResultsLive: true,
        },
      ];

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findByEventId = vi.fn().mockResolvedValue(mockActivities);

      const result = await eventService.listActivities('event-1');

      expect(result).toEqual(mockActivities);
      expect(mockActivityRepository.findByEventId).toHaveBeenCalledWith('event-1');
    });

    it('should return empty array if no activities', async () => {
      const mockEvent: Event = {
        eventId: 'event-1',
        id: 'event-1',
        name: 'Test Event',
        gamePin: '123456',
        organizerId: 'org-1',
        status: 'draft',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
        joinLink: 'http://localhost:3000/join/event-1',
        visibility: 'private',
        isTemplate: false,
        lastModified: Date.now(),
        participantCount: 0,
        activeActivityId: null,
      };

      mockEventRepository.getEvent = vi.fn().mockResolvedValue(mockEvent);
      mockActivityRepository.findByEventId = vi.fn().mockResolvedValue([]);

      const result = await eventService.listActivities('event-1');

      expect(result).toEqual([]);
    });
  });
});
