/**
 * Tests for RaffleActivityService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RaffleActivityService } from '../services/raffleActivityService';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import { RaffleRepository } from '../db/repositories/RaffleRepository';
import { RaffleActivity } from '../types/models';

// Mock the repositories
vi.mock('../db/repositories/ActivityRepository');
vi.mock('../db/repositories/RaffleRepository');

describe('RaffleActivityService', () => {
  let service: RaffleActivityService;
  let mockActivityRepo: any;
  let mockRaffleRepo: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create service instance
    service = new RaffleActivityService();
    
    // Get mock instances
    mockActivityRepo = vi.mocked(ActivityRepository).mock.instances[0];
    mockRaffleRepo = vi.mocked(RaffleRepository).mock.instances[0];
  });

  describe('configureRaffle', () => {
    it('should configure a raffle with valid settings', async () => {
      const activityId = 'raffle-123';
      const config = {
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual' as const,
        winnerCount: 1,
      };

      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: '',
        entryMethod: 'manual',
        winnerCount: 0,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockActivityRepo.update = vi.fn().mockResolvedValue(undefined);

      await service.configureRaffle(activityId, config);

      expect(mockActivityRepo.findById).toHaveBeenCalledWith(activityId);
      expect(mockActivityRepo.update).toHaveBeenCalledWith(
        activityId,
        expect.objectContaining({
          prizeDescription: 'iPad Pro',
          entryMethod: 'manual',
          winnerCount: 1,
          winners: [],
          status: 'ready',
        })
      );
    });

    it('should throw error if activity not found', async () => {
      mockActivityRepo.findById = vi.fn().mockResolvedValue(null);

      await expect(
        service.configureRaffle('invalid-id', {
          prizeDescription: 'Prize',
          entryMethod: 'manual',
          winnerCount: 1,
        })
      ).rejects.toThrow('Activity not found');
    });

    it('should throw error if activity is not a raffle', async () => {
      const mockQuizActivity = {
        activityId: 'quiz-123',
        type: 'quiz',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockQuizActivity);

      await expect(
        service.configureRaffle('quiz-123', {
          prizeDescription: 'Prize',
          entryMethod: 'manual',
          winnerCount: 1,
        })
      ).rejects.toThrow('Activity quiz-123 is not a raffle activity');
    });

    it('should throw error if prize description is empty', async () => {
      const mockRaffleActivity = {
        activityId: 'raffle-123',
        type: 'raffle',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.configureRaffle('raffle-123', {
          prizeDescription: '',
          entryMethod: 'manual',
          winnerCount: 1,
        })
      ).rejects.toThrow('Prize description is required');
    });

    it('should throw error if entry method is invalid', async () => {
      const mockRaffleActivity = {
        activityId: 'raffle-123',
        type: 'raffle',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.configureRaffle('raffle-123', {
          prizeDescription: 'Prize',
          entryMethod: 'invalid' as any,
          winnerCount: 1,
        })
      ).rejects.toThrow('Entry method must be either "automatic" or "manual"');
    });

    it('should throw error if winner count is less than 1', async () => {
      const mockRaffleActivity = {
        activityId: 'raffle-123',
        type: 'raffle',
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.configureRaffle('raffle-123', {
          prizeDescription: 'Prize',
          entryMethod: 'manual',
          winnerCount: 0,
        })
      ).rejects.toThrow('Winner count must be at least 1');
    });

    it('should throw error if raffle is active', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'Old Prize',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.configureRaffle('raffle-123', {
          prizeDescription: 'New Prize',
          entryMethod: 'manual',
          winnerCount: 1,
        })
      ).rejects.toThrow('Cannot configure raffle while it is active');
    });
  });

  describe('startRaffle', () => {
    it('should start a configured raffle', async () => {
      const activityId = 'raffle-123';
      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'ready',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockActivityRepo.setStatus = vi.fn().mockResolvedValue(undefined);

      await service.startRaffle(activityId);

      expect(mockActivityRepo.setStatus).toHaveBeenCalledWith(activityId, 'active');
    });

    it('should throw error if raffle is not configured', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: '',
        entryMethod: 'manual',
        winnerCount: 0,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(service.startRaffle('raffle-123')).rejects.toThrow(
        'Raffle must be configured before starting'
      );
    });
  });

  describe('enterRaffle', () => {
    it('should enter a participant into an active raffle', async () => {
      const activityId = 'raffle-123';
      const participantId = 'participant-456';
      const participantName = 'John Doe';

      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntryByParticipant = vi.fn().mockResolvedValue(null);
      mockRaffleRepo.createEntry = vi.fn().mockResolvedValue(undefined);

      await service.enterRaffle(activityId, participantId, participantName);

      expect(mockRaffleRepo.getEntryByParticipant).toHaveBeenCalledWith(
        activityId,
        participantId
      );
      expect(mockRaffleRepo.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          raffleId: activityId,
          participantId,
          participantName,
        })
      );
    });

    it('should throw error if participant already entered', async () => {
      const activityId = 'raffle-123';
      const participantId = 'participant-456';

      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      const existingEntry = {
        entryId: 'entry-789',
        raffleId: activityId,
        participantId,
        participantName: 'John Doe',
        enteredAt: Date.now(),
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntryByParticipant = vi.fn().mockResolvedValue(existingEntry);

      await expect(
        service.enterRaffle(activityId, participantId, 'John Doe')
      ).rejects.toThrow('Participant has already entered this raffle');
    });

    it('should throw error if raffle is not active', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.enterRaffle('raffle-123', 'participant-456', 'John Doe')
      ).rejects.toThrow('Raffle is not currently active');
    });

    it('should throw error if participant ID is empty', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.enterRaffle('raffle-123', '', 'John Doe')
      ).rejects.toThrow('Participant ID is required');
    });

    it('should throw error if participant name is empty', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(
        service.enterRaffle('raffle-123', 'participant-456', '')
      ).rejects.toThrow('Participant name is required');
    });
  });

  describe('drawWinners', () => {
    it('should draw winners from raffle entries', async () => {
      const activityId = 'raffle-123';
      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 2,
        winners: [],
      };

      const mockEntries = [
        {
          entryId: 'entry-1',
          raffleId: activityId,
          participantId: 'participant-1',
          participantName: 'Alice',
          enteredAt: Date.now(),
        },
        {
          entryId: 'entry-2',
          raffleId: activityId,
          participantId: 'participant-2',
          participantName: 'Bob',
          enteredAt: Date.now(),
        },
        {
          entryId: 'entry-3',
          raffleId: activityId,
          participantId: 'participant-3',
          participantName: 'Charlie',
          enteredAt: Date.now(),
        },
      ];

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntries = vi.fn().mockResolvedValue(mockEntries);
      mockRaffleRepo.setWinners = vi.fn().mockResolvedValue(undefined);

      const winners = await service.drawWinners(activityId);

      expect(winners).toHaveLength(2);
      expect(mockRaffleRepo.setWinners).toHaveBeenCalledWith(
        activityId,
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('should throw error if raffle is not active', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(service.drawWinners('raffle-123')).rejects.toThrow(
        'Raffle is not currently active'
      );
    });

    it('should throw error if no entries exist', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntries = vi.fn().mockResolvedValue([]);

      await expect(service.drawWinners('raffle-123')).rejects.toThrow(
        'Cannot draw winners: no entries in raffle'
      );
    });

    it('should throw error if insufficient entries for winner count', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 3,
        winners: [],
      };

      const mockEntries = [
        {
          entryId: 'entry-1',
          raffleId: 'raffle-123',
          participantId: 'participant-1',
          participantName: 'Alice',
          enteredAt: Date.now(),
        },
      ];

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntries = vi.fn().mockResolvedValue(mockEntries);

      await expect(service.drawWinners('raffle-123')).rejects.toThrow(
        'Cannot draw 3 winners: only 1 entries available'
      );
    });
  });

  describe('endRaffle', () => {
    it('should end raffle and return final results', async () => {
      const activityId = 'raffle-123';
      const mockRaffleActivity: RaffleActivity = {
        activityId,
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'active',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: ['participant-1'],
      };

      const mockEntries = [
        {
          entryId: 'entry-1',
          raffleId: activityId,
          participantId: 'participant-1',
          participantName: 'Alice',
          enteredAt: Date.now(),
        },
        {
          entryId: 'entry-2',
          raffleId: activityId,
          participantId: 'participant-2',
          participantName: 'Bob',
          enteredAt: Date.now(),
        },
      ];

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);
      mockRaffleRepo.getEntries = vi.fn().mockResolvedValue(mockEntries);
      mockActivityRepo.setStatus = vi.fn().mockResolvedValue(undefined);

      const results = await service.endRaffle(activityId);

      expect(results).toEqual({
        raffleId: activityId,
        prizeDescription: 'iPad Pro',
        totalEntries: 2,
        winnerCount: 1,
        winners: [
          {
            participantId: 'participant-1',
            participantName: 'Alice',
          },
        ],
      });
      expect(mockActivityRepo.setStatus).toHaveBeenCalledWith(activityId, 'completed');
    });

    it('should throw error if raffle is not active', async () => {
      const mockRaffleActivity: RaffleActivity = {
        activityId: 'raffle-123',
        eventId: 'event-123',
        type: 'raffle',
        name: 'Prize Raffle',
        status: 'draft',
        order: 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
        prizeDescription: 'iPad Pro',
        entryMethod: 'manual',
        winnerCount: 1,
        winners: [],
      };

      mockActivityRepo.findById = vi.fn().mockResolvedValue(mockRaffleActivity);

      await expect(service.endRaffle('raffle-123')).rejects.toThrow(
        'Raffle is not currently active'
      );
    });
  });
});
