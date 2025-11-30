/**
 * RaffleActivityService - Business logic for raffle activity management
 * Handles raffle configuration, entry management, and winner selection
 */
import { randomUUID } from 'crypto';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { RaffleRepository } from '../db/repositories/RaffleRepository.js';
import { RaffleActivity, RaffleEntry } from '../types/models.js';

/**
 * Configuration for a raffle
 */
export interface RaffleConfig {
  prizeDescription: string;
  entryMethod: 'automatic' | 'manual';
  winnerCount: number;
}

/**
 * Results of a raffle drawing
 */
export interface RaffleResults {
  raffleId: string;
  prizeDescription: string;
  totalEntries: number;
  winnerCount: number;
  winners: Array<{
    participantId: string;
    participantName: string;
  }>;
}

export class RaffleActivityService {
  private activityRepo: ActivityRepository;
  private raffleRepo: RaffleRepository;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.raffleRepo = new RaffleRepository();
  }

  /**
   * Get a raffle activity by ID with type checking
   * @param activityId - The activity ID
   * @returns The raffle activity
   * @throws Error if activity not found or not a raffle
   */
  private async getRaffleActivity(activityId: string): Promise<RaffleActivity> {
    const activity = await this.activityRepo.findById(activityId);
    
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    if (activity.type !== 'raffle') {
      throw new Error(`Activity ${activityId} is not a raffle activity`);
    }

    return activity as RaffleActivity;
  }

  /**
   * Configure a raffle activity with prize and entry settings
   * @param activityId - The raffle activity ID
   * @param config - Raffle configuration
   * @throws Error if activity not found, not a raffle, or validation fails
   */
  async configureRaffle(
    activityId: string,
    config: RaffleConfig
  ): Promise<void> {
    // Validate inputs
    if (!config.prizeDescription || config.prizeDescription.trim().length === 0) {
      throw new Error('Prize description is required');
    }

    if (!config.entryMethod || !['automatic', 'manual'].includes(config.entryMethod)) {
      throw new Error('Entry method must be either "automatic" or "manual"');
    }

    if (!config.winnerCount || config.winnerCount < 1) {
      throw new Error('Winner count must be at least 1');
    }

    // Get the raffle activity (validates it exists and is a raffle)
    const raffleActivity = await this.getRaffleActivity(activityId);

    // Check if raffle is in a valid state to be configured
    if (raffleActivity.status === 'active') {
      throw new Error('Cannot configure raffle while it is active');
    }

    // Update the activity with raffle configuration
    await this.activityRepo.update(activityId, {
      prizeDescription: config.prizeDescription.trim(),
      entryMethod: config.entryMethod,
      winnerCount: config.winnerCount,
      winners: [], // Reset winners when reconfiguring
      status: 'ready', // Mark as ready once configured
      lastModified: Date.now(),
    });
  }

  /**
   * Start a raffle activity (make it active and ready for entries)
   * @param activityId - The raffle activity ID
   * @throws Error if activity not found, not a raffle, or not ready
   */
  async startRaffle(activityId: string): Promise<void> {
    // Get the raffle activity
    const raffleActivity = await this.getRaffleActivity(activityId);

    // Validate raffle is configured
    if (!raffleActivity.prizeDescription || raffleActivity.winnerCount < 1) {
      throw new Error('Raffle must be configured before starting');
    }

    // Validate raffle is in ready or active state (allow restarting active raffles)
    if (raffleActivity.status !== 'ready' && raffleActivity.status !== 'draft' && raffleActivity.status !== 'active') {
      throw new Error(`Cannot start raffle in ${raffleActivity.status} status`);
    }

    // Update status to active
    await this.activityRepo.setStatus(activityId, 'active');

    // Note: For automatic entry mode, participants would be auto-entered when they connect
    // For now, we rely on participants entering manually or through the participant interface
  }

  /**
   * Enter a participant into a raffle
   * @param activityId - The raffle activity ID
   * @param participantId - The participant entering the raffle
   * @param participantName - The participant's display name
   * @throws Error if validation fails or duplicate entry
   */
  async enterRaffle(
    activityId: string,
    participantId: string,
    participantName: string
  ): Promise<void> {
    // Validate inputs
    if (!participantId || participantId.trim().length === 0) {
      throw new Error('Participant ID is required');
    }

    if (!participantName || participantName.trim().length === 0) {
      throw new Error('Participant name is required');
    }

    // Get the raffle activity
    const raffleActivity = await this.getRaffleActivity(activityId);

    // Validate raffle is active
    if (raffleActivity.status !== 'active') {
      throw new Error('Raffle is not currently active');
    }

    // Check for duplicate entry
    const existingEntry = await this.raffleRepo.getEntryByParticipant(
      activityId,
      participantId
    );

    if (existingEntry) {
      throw new Error('Participant has already entered this raffle');
    }

    // Create and save the entry
    const entry: RaffleEntry = {
      entryId: randomUUID(),
      raffleId: activityId,
      participantId,
      participantName: participantName.trim(),
      enteredAt: Date.now(),
    };

    await this.raffleRepo.createEntry(entry);
  }

  /**
   * Draw random winners from raffle entries
   * @param activityId - The raffle activity ID
   * @param count - Number of winners to draw (optional, uses configured count if not provided)
   * @returns Array of winner participant IDs
   * @throws Error if activity not found, not active, or insufficient entries
   */
  async drawWinners(activityId: string, count?: number): Promise<string[]> {
    // Get the raffle activity
    const raffleActivity = await this.getRaffleActivity(activityId);

    // Validate raffle is active
    if (raffleActivity.status !== 'active') {
      throw new Error('Raffle is not currently active');
    }

    // Use provided count or default to configured winner count
    const winnerCount = count !== undefined ? count : raffleActivity.winnerCount;

    // Validate winner count
    if (winnerCount < 1) {
      throw new Error('Winner count must be at least 1');
    }

    // Get all entries
    const entries = await this.raffleRepo.getEntries(activityId);

    // Validate sufficient entries
    if (entries.length === 0) {
      throw new Error('Cannot draw winners: no entries in raffle');
    }

    if (entries.length < winnerCount) {
      throw new Error(
        `Cannot draw ${winnerCount} winners: only ${entries.length} entries available`
      );
    }

    // Randomly select winners using Fisher-Yates shuffle algorithm
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take the first N entries as winners
    const winners = shuffled.slice(0, winnerCount);
    const winnerIds = winners.map(entry => entry.participantId);

    // Store winners in the raffle activity
    await this.raffleRepo.setWinners(activityId, winnerIds);

    return winnerIds;
  }

  /**
   * End a raffle activity and return final results
   * @param activityId - The raffle activity ID
   * @returns Final raffle results
   * @throws Error if activity not found, not a raffle, or not active
   */
  async endRaffle(activityId: string): Promise<RaffleResults> {
    // Get the raffle activity
    const raffleActivity = await this.getRaffleActivity(activityId);

    // Validate raffle is active
    if (raffleActivity.status !== 'active') {
      throw new Error('Raffle is not currently active');
    }

    // Get all entries
    const entries = await this.raffleRepo.getEntries(activityId);

    // Get winner details
    const winnerDetails = entries
      .filter(entry => raffleActivity.winners.includes(entry.participantId))
      .map(entry => ({
        participantId: entry.participantId,
        participantName: entry.participantName,
      }));

    // Update activity status to completed
    await this.activityRepo.setStatus(activityId, 'completed');

    // Return results
    return {
      raffleId: activityId,
      prizeDescription: raffleActivity.prizeDescription,
      totalEntries: entries.length,
      winnerCount: raffleActivity.winners.length,
      winners: winnerDetails,
    };
  }
}
