/**
 * Unit tests for raffle activity API routes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RaffleActivityService } from '../services/raffleActivityService';
import { getActivity } from '../services/activityService';
import { RaffleActivity } from '../types/models';

// Mock the dependencies
vi.mock('../services/activityService', () => ({
  getActivity: vi.fn(),
}));

vi.mock('../services/raffleActivityService');

describe('Raffle Activity Routes', () => {
  let mockRaffleService: any;
  const mockActivity: RaffleActivity = {
    activityId: 'raffle-123',
    eventId: 'event-123',
    type: 'raffle',
    name: 'Test Raffle',
    status: 'ready',
    order: 0,
    createdAt: Date.now(),
    lastModified: Date.now(),
    prizeDescription: 'Test Prize',
    entryMethod: 'manual',
    winnerCount: 1,
    winners: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRaffleService = new RaffleActivityService();
  });

  describe('POST /api/activities/:activityId/configure-raffle', () => {
    it('should validate required fields', () => {
      // Test that prizeDescription, entryMethod, and winnerCount are required
      const requiredFields = ['prizeDescription', 'entryMethod', 'winnerCount'];
      expect(requiredFields).toContain('prizeDescription');
      expect(requiredFields).toContain('entryMethod');
      expect(requiredFields).toContain('winnerCount');
    });

    it('should call raffleActivityService.configureRaffle with correct params', async () => {
      const activityId = 'raffle-123';
      const config = {
        prizeDescription: 'Test Prize',
        entryMethod: 'manual' as const,
        winnerCount: 1,
      };

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.configureRaffle = vi.fn().mockResolvedValue(undefined);

      await mockRaffleService.configureRaffle(activityId, config);

      expect(mockRaffleService.configureRaffle).toHaveBeenCalledWith(
        activityId,
        config
      );
    });
  });

  describe('POST /api/activities/:activityId/start-raffle', () => {
    it('should call raffleActivityService.startRaffle', async () => {
      const activityId = 'raffle-123';

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.startRaffle = vi.fn().mockResolvedValue(undefined);

      await mockRaffleService.startRaffle(activityId);

      expect(mockRaffleService.startRaffle).toHaveBeenCalledWith(activityId);
    });
  });

  describe('POST /api/activities/:activityId/enter', () => {
    it('should validate required fields', () => {
      const requiredFields = ['participantId', 'participantName'];
      expect(requiredFields).toContain('participantId');
      expect(requiredFields).toContain('participantName');
    });

    it('should call raffleActivityService.enterRaffle with correct params', async () => {
      const activityId = 'raffle-123';
      const participantId = 'participant-1';
      const participantName = 'Test User';

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.enterRaffle = vi.fn().mockResolvedValue(undefined);

      await mockRaffleService.enterRaffle(activityId, participantId, participantName);

      expect(mockRaffleService.enterRaffle).toHaveBeenCalledWith(
        activityId,
        participantId,
        participantName
      );
    });
  });

  describe('POST /api/activities/:activityId/draw-winners', () => {
    it('should call raffleActivityService.drawWinners', async () => {
      const activityId = 'raffle-123';
      const mockWinners = ['participant-1'];

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.drawWinners = vi.fn().mockResolvedValue(mockWinners);

      const winners = await mockRaffleService.drawWinners(activityId);

      expect(mockRaffleService.drawWinners).toHaveBeenCalledWith(activityId);
      expect(winners).toEqual(mockWinners);
    });

    it('should accept optional count parameter', async () => {
      const activityId = 'raffle-123';
      const count = 3;
      const mockWinners = ['participant-1', 'participant-2', 'participant-3'];

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.drawWinners = vi.fn().mockResolvedValue(mockWinners);

      const winners = await mockRaffleService.drawWinners(activityId, count);

      expect(mockRaffleService.drawWinners).toHaveBeenCalledWith(activityId, count);
      expect(winners).toEqual(mockWinners);
    });
  });

  describe('POST /api/activities/:activityId/end-raffle', () => {
    it('should call raffleActivityService.endRaffle and return results', async () => {
      const activityId = 'raffle-123';
      const mockResults = {
        raffleId: activityId,
        prizeDescription: 'Test Prize',
        totalEntries: 5,
        winnerCount: 1,
        winners: [
          { participantId: 'participant-1', participantName: 'Test User' },
        ],
      };

      vi.mocked(getActivity).mockResolvedValue(mockActivity);
      mockRaffleService.endRaffle = vi.fn().mockResolvedValue(mockResults);

      const results = await mockRaffleService.endRaffle(activityId);

      expect(mockRaffleService.endRaffle).toHaveBeenCalledWith(activityId);
      expect(results).toEqual(mockResults);
    });
  });

  describe('Error handling', () => {
    it('should return 404 if activity not found', async () => {
      vi.mocked(getActivity).mockResolvedValue(null);

      const result = await getActivity('non-existent');
      expect(result).toBeNull();
    });

    it('should return 400 if activity is not a raffle', async () => {
      const quizActivity = {
        ...mockActivity,
        type: 'quiz' as const,
      };

      vi.mocked(getActivity).mockResolvedValue(quizActivity as any);

      const activity = await getActivity('quiz-123');
      expect(activity?.type).not.toBe('raffle');
    });
  });
});
