/**
 * Tests for PollActivityService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PollActivityService } from '../services/pollActivityService';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import { PollRepository } from '../db/repositories/PollRepository';
import { PollActivity } from '../types/models';

// Mock the repositories
vi.mock('../db/repositories/ActivityRepository');
vi.mock('../db/repositories/PollRepository');

describe('PollActivityService', () => {
  let service: PollActivityService;
  let mockActivityRepo: any;
  let mockPollRepo: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create service instance
    service = new PollActivityService();
    
    // Get mock instances
    mockActivityRepo = vi.mocked(ActivityRepository).mock.instances[0];
    mockPollRepo = vi.mocked(PollRepository).mock.instances[0];
  });

  describe('configurePoll', () => {
    it('should configure a poll with valid question and options', async () => {
      const activityId = 'poll-123';
      const question = 'What is your favorite color?';
      const options = ['Red', 'Blue', 'Green'];

      const mockPollActivity: PollActivity = {
        activityId,
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: '',
        options: [],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);
      mockActivityRepo.update = vi.fn().mockResolvedValue(undefined);

      await service.configurePoll(activityId, question, options);

      expect(mockActivityRepo.findById).toHaveBeenCalledWith(activityId);
      expect(mockActivityRepo.update).toHaveBeenCalledWith(
        activityId,
        expect.objectContaining({
          question,
          status: 'ready',
          options: expect.arrayContaining([
            expect.objectContaining({ text: 'Red', voteCount: 0 }),
            expect.objectContaining({ text: 'Blue', voteCount: 0 }),
            expect.objectContaining({ text: 'Green', voteCount: 0 }),
          ]),
        })
      );
    });

    it('should throw error if activity not found', async () => {
      mockActivityRepo.findById = vi.fn().mockResolvedValue(null);

      await expect(
        service.configurePoll('invalid-id', 'Question?', ['A', 'B'])
      ).rejects.toThrow('Activity not found');
    });

    it('should throw error if activity is not a poll', async () => {
      const mockQuizActivity = {
        activityId: 'quiz-123',
        type: 'quiz',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockQuizActivity);

      await expect(
        service.configurePoll('quiz-123', 'Question?', ['A', 'B'])
      ).rejects.toThrow('Activity quiz-123 is not a poll activity');
    });

    it('should throw error if question is empty', async () => {
      const mockPollActivity = {
        activityId: 'poll-123',
        type: 'poll',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);

      await expect(
        service.configurePoll('poll-123', '', ['A', 'B'])
      ).rejects.toThrow('Poll question is required');
    });

    it('should throw error if less than 2 options provided', async () => {
      const mockPollActivity = {
        activityId: 'poll-123',
        type: 'poll',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);

      await expect(
        service.configurePoll('poll-123', 'Question?', ['A'])
      ).rejects.toThrow('Poll must have at least 2 options');
    });
  });

  describe('submitVote', () => {
    it('should submit a valid vote', async () => {
      const activityId = 'poll-123';
      const participantId = 'participant-456';
      const optionIds = ['option-0'];

      const mockPollActivity: PollActivity = {
        activityId,
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
          { id: 'option-1', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);
      mockPollRepo.getVoteByParticipant = vi.fn().mockResolvedValue(null);
      mockPollRepo.createVote = vi.fn().mockResolvedValue(undefined);

      await service.submitVote(activityId, participantId, optionIds);

      expect(mockPollRepo.getVoteByParticipant).toHaveBeenCalledWith(
        activityId,
        participantId
      );
      expect(mockPollRepo.createVote).toHaveBeenCalledWith(
        expect.objectContaining({
          pollId: activityId,
          participantId,
          selectedOptionIds: optionIds,
        })
      );
    });

    it('should throw error if participant already voted', async () => {
      const activityId = 'poll-123';
      const participantId = 'participant-456';

      const mockPollActivity: PollActivity = {
        activityId,
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
          { id: 'option-1', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      const existingVote = {
        voteId: 'vote-789',
        pollId: activityId,
        participantId,
        selectedOptionIds: ['option-0'],
        submittedAt: Date.now(),
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);
      mockPollRepo.getVoteByParticipant = vi.fn().mockResolvedValue(existingVote);

      await expect(
        service.submitVote(activityId, participantId, ['option-1'])
      ).rejects.toThrow('Participant has already voted in this poll');
    });

    it('should throw error if poll is not active', async () => {
      const mockPollActivity: PollActivity = {
        activityId: 'poll-123',
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);

      await expect(
        service.submitVote('poll-123', 'participant-456', ['option-0'])
      ).rejects.toThrow('Poll is not currently active');
    });

    it('should throw error if multiple votes not allowed but multiple options selected', async () => {
      const mockPollActivity: PollActivity = {
        activityId: 'poll-123',
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
          { id: 'option-1', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);

      await expect(
        service.submitVote('poll-123', 'participant-456', ['option-0', 'option-1'])
      ).rejects.toThrow('This poll does not allow multiple votes');
    });
  });

  describe('getResults', () => {
    it('should return poll results', async () => {
      const activityId = 'poll-123';
      const mockPollActivity: PollActivity = {
        activityId,
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
          { id: 'option-1', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      const mockResults = {
        pollId: activityId,
        totalVotes: 5,
        options: [
          { id: 'option-0', text: 'Red', voteCount: 3 },
          { id: 'option-1', text: 'Blue', voteCount: 2 },
        ],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);
      mockPollRepo.getResults = vi.fn().mockResolvedValue(mockResults);

      const results = await service.getResults(activityId);

      expect(results).toEqual(mockResults);
      expect(mockPollRepo.getResults).toHaveBeenCalledWith(
        activityId,
        mockPollActivity.options
      );
    });
  });

  describe('endPoll', () => {
    it('should end poll and return final results', async () => {
      const activityId = 'poll-123';
      const mockPollActivity: PollActivity = {
        activityId,
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [
          { id: 'option-0', text: 'Red', voteCount: 0 },
          { id: 'option-1', text: 'Blue', voteCount: 0 },
        ],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      const mockResults = {
        pollId: activityId,
        totalVotes: 5,
        options: [
          { id: 'option-0', text: 'Red', voteCount: 3 },
          { id: 'option-1', text: 'Blue', voteCount: 2 },
        ],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);
      mockPollRepo.getResults = vi.fn().mockResolvedValue(mockResults);
      mockActivityRepo.setStatus = vi.fn().mockResolvedValue(undefined);

      const results = await service.endPoll(activityId);

      expect(results).toEqual(mockResults);
      expect(mockActivityRepo.setStatus).toHaveBeenCalledWith(activityId, 'completed');
    });

    it('should throw error if poll is not active', async () => {
      const mockPollActivity: PollActivity = {
        activityId: 'poll-123',
        eventId: 'event-123',
        type: 'poll',
        name: 'Color Poll',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        question: 'What is your favorite color?',
        options: [],
        allowMultipleVotes: false,
        showResultsLive: true,
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockPollActivity);

      await expect(service.endPoll('poll-123')).rejects.toThrow(
        'Poll is not currently active'
      );
    });
  });
});
