/**
 * Tests for Poll WebSocket Handlers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketService } from '../services/websocketService.js';
import { Server } from 'socket.io';

describe('Poll WebSocket Handlers', () => {
  let wsService: WebSocketService;
  let mockIo: any;

  beforeEach(() => {
    wsService = new WebSocketService();
    
    // Create mock io instance
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
  });

  describe('broadcastPollStarted', () => {
    it('should broadcast poll-started event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const question = 'What is your favorite color?';
      const options = [
        { id: 'opt1', text: 'Red', voteCount: 0 },
        { id: 'opt2', text: 'Blue', voteCount: 0 },
      ];

      await wsService.broadcastPollStarted(mockIo, eventId, activityId, question, options);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('poll-started', {
        activityId,
        question,
        options,
      });
    });
  });

  describe('broadcastPollVoteSubmitted', () => {
    it('should broadcast poll-vote-submitted event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const participantId = 'participant-789';

      await wsService.broadcastPollVoteSubmitted(mockIo, eventId, activityId, participantId);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('poll-vote-submitted', {
        activityId,
        participantId,
      });
    });
  });

  describe('broadcastPollResultsUpdated', () => {
    it('should broadcast poll-results-updated event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const results = {
        totalVotes: 10,
        options: [
          { id: 'opt1', text: 'Red', voteCount: 6 },
          { id: 'opt2', text: 'Blue', voteCount: 4 },
        ],
      };

      await wsService.broadcastPollResultsUpdated(mockIo, eventId, activityId, results);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('poll-results-updated', {
        activityId,
        results,
      });
    });
  });

  describe('broadcastPollEnded', () => {
    it('should broadcast poll-ended event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const finalResults = {
        totalVotes: 15,
        options: [
          { id: 'opt1', text: 'Red', voteCount: 9 },
          { id: 'opt2', text: 'Blue', voteCount: 6 },
        ],
      };

      await wsService.broadcastPollEnded(mockIo, eventId, activityId, finalResults);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('poll-ended', {
        activityId,
        finalResults,
      });
    });
  });
});
