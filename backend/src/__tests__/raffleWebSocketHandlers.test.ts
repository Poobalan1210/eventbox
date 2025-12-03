/**
 * Tests for Raffle WebSocket Handlers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketService } from '../services/websocketService.js';

describe('Raffle WebSocket Handlers', () => {
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

  describe('broadcastRaffleStarted', () => {
    it('should broadcast raffle-started event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const prizeDescription = 'Grand Prize: $1000 Gift Card';

      await wsService.broadcastRaffleStarted(mockIo, eventId, activityId, prizeDescription);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-started', {
        activityId,
        prizeDescription,
      });
    });
  });

  describe('broadcastRaffleEntryConfirmed', () => {
    it('should broadcast raffle-entry-confirmed event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const participantId = 'participant-789';
      const participantName = 'John Doe';

      await wsService.broadcastRaffleEntryConfirmed(mockIo, eventId, activityId, participantId, participantName);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-entry-confirmed', {
        activityId,
        participantId,
        participantName,
      });
    });
  });

  describe('broadcastRaffleDrawing', () => {
    it('should broadcast raffle-drawing event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';

      await wsService.broadcastRaffleDrawing(mockIo, eventId, activityId);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-drawing', {
        activityId,
      });
    });
  });

  describe('broadcastRaffleWinnersAnnounced', () => {
    it('should broadcast raffle-winners-announced event to event room with winners', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const winners = [
        { participantId: 'p1', participantName: 'Alice' },
        { participantId: 'p2', participantName: 'Bob' },
        { participantId: 'p3', participantName: 'Charlie' },
      ];

      await wsService.broadcastRaffleWinnersAnnounced(mockIo, eventId, activityId, winners);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-winners-announced', {
        activityId,
        winners,
      });
    });

    it('should broadcast raffle-winners-announced event with single winner', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';
      const winners = [
        { participantId: 'p1', participantName: 'Alice' },
      ];

      await wsService.broadcastRaffleWinnersAnnounced(mockIo, eventId, activityId, winners);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-winners-announced', {
        activityId,
        winners,
      });
    });
  });

  describe('broadcastRaffleEnded', () => {
    it('should broadcast raffle-ended event to event room', async () => {
      const eventId = 'event-123';
      const activityId = 'activity-456';

      await wsService.broadcastRaffleEnded(mockIo, eventId, activityId);

      expect(mockIo.to).toHaveBeenCalledWith(eventId);
      expect(mockIo.emit).toHaveBeenCalledWith('raffle-ended', {
        activityId,
      });
    });
  });
});
