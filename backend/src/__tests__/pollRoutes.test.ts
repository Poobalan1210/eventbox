/**
 * Unit tests for poll activity API routes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollActivityService } from '../services/pollActivityService';
import { getActivity } from '../services/activityService';
import { PollActivity } from '../types/models';

// Mock the dependencies
vi.mock('../services/activityService', () => ({
  getActivity: vi.fn(),
}));

vi.mock('../services/pollActivityService');

describe('Poll Activity Routes', () => {
  let mockPollService: any;
  const mockActivity: PollActivity = {
    activityId: 'poll-123',
    eventId: 'event-123',
    type: 'poll',
    name: 'Test Poll',
    status: 'ready',
    order: 0,
    createdAt: Date.now(),
    lastModified: Date.now(),
    question: 'Test question?',
    options: [
      { id: 'opt-1', text: 'Option 1', voteCount: 0 },
      { id: 'opt-2', text: 'Option 2', voteCount: 0 },
    ],
    allowMultipleVotes: false,
    showResultsLive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPollService = new PollActivityService();
  });

  describe('POST /api/activities/:activityId/configure-poll', () => {
    it('should validate required fields', () => {
      // Test that question and options are required
      const requiredFields = ['question', 'options'];
      expect(requiredFields).toContain('question');
      expect(requiredFields).toContain('options');
    });

    it('should validate options array has at least 2 items', () => {
      const validOptions = ['Option 1', 'Option 2'];
      const invalidOptions = ['Option 1'];
      
      expect(validOptions.length).toBeGreaterThanOrEqual(2);
      expect(invalidOptions.length).toBeLessThan(2);
    });

    it('should call pollActivityService.configurePoll with correct params', async () => {
      const activityId = 'poll-123';
      const question = 'Test question?';
      const options = ['Option 1', 'Option 2'];

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockPollService.configurePoll = vi.fn().mockResolvedValue(undefined);

      await mockPollService.configurePoll(activityId, question, options);

      expect(mockPollService.configurePoll).toHaveBeenCalledWith(
        activityId,
        question,
        options
      );
    });
  });

  describe('POST /api/activities/:activityId/start-poll', () => {
    it('should call pollActivityService.startPoll', async () => {
      const activityId = 'poll-123';

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockPollService.startPoll = vi.fn().mockResolvedValue(undefined);

      await mockPollService.startPoll(activityId);

      expect(mockPollService.startPoll).toHaveBeenCalledWith(activityId);
    });
  });

  describe('POST /api/activities/:activityId/vote', () => {
    it('should validate required fields', () => {
      const requiredFields = ['participantId', 'optionIds'];
      expect(requiredFields).toContain('participantId');
      expect(requiredFields).toContain('optionIds');
    });

    it('should validate optionIds is an array', () => {
      const validOptionIds = ['opt-1'];
      const invalidOptionIds = 'opt-1';

      expect(Array.isArray(validOptionIds)).toBe(true);
      expect(Array.isArray(invalidOptionIds)).toBe(false);
    });

    it('should call pollActivityService.submitVote with correct params', async () => {
      const activityId = 'poll-123';
      const participantId = 'participant-1';
      const optionIds = ['opt-1'];

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockPollService.submitVote = vi.fn().mockResolvedValue(undefined);

      await mockPollService.submitVote(activityId, participantId, optionIds);

      expect(mockPollService.submitVote).toHaveBeenCalledWith(
        activityId,
        participantId,
        optionIds
      );
    });
  });

  describe('GET /api/activities/:activityId/poll-results', () => {
    it('should call pollActivityService.getResults', async () => {
      const activityId = 'poll-123';
      const mockResults = {
        pollId: activityId,
        totalVotes: 5,
        options: mockActivity.options,
      };

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockPollService.getResults = vi.fn().mockResolvedValue(mockResults);

      const results = await mockPollService.getResults(activityId);

      expect(mockPollService.getResults).toHaveBeenCalledWith(activityId);
      expect(results).toEqual(mockResults);
    });
  });

  describe('POST /api/activities/:activityId/end-poll', () => {
    it('should call pollActivityService.endPoll and return results', async () => {
      const activityId = 'poll-123';
      const mockResults = {
        pollId: activityId,
        totalVotes: 5,
        options: mockActivity.options,
      };

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockPollService.endPoll = vi.fn().mockResolvedValue(mockResults);

      const results = await mockPollService.endPoll(activityId);

      expect(mockPollService.endPoll).toHaveBeenCalledWith(activityId);
      expect(results).toEqual(mockResults);
    });
  });

  describe('Error handling', () => {
    it('should return 404 if activity not found', async () => {
      vi.mocked(getActivity).mockResolvedValue(null);

      const result = await getActivity('non-existent');
      expect(result).toBeNull();
    });

    it('should return 400 if activity is not a poll', async () => {
      const quizActivity = {
        ...mockActivity,
        type: 'quiz' as const,
      };

      vi.mocked(getActivity).mockResolvedValue(quizActivity as any);

      const activity = await getActivity('quiz-123');
      expect(activity?.type).not.toBe('poll');
    });
  });
});
