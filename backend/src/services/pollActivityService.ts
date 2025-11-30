/**
 * PollActivityService - Business logic for poll activity management
 * Handles poll configuration, voting, and results calculation
 */
import { randomUUID } from 'crypto';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { PollRepository, PollResults } from '../db/repositories/PollRepository.js';
import { PollActivity, PollOption, PollVote } from '../types/models.js';

export class PollActivityService {
  private activityRepo: ActivityRepository;
  private pollRepo: PollRepository;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.pollRepo = new PollRepository();
  }

  /**
   * Get a poll activity by ID with type checking
   * @param activityId - The activity ID
   * @returns The poll activity
   * @throws Error if activity not found or not a poll
   */
  private async getPollActivity(activityId: string): Promise<PollActivity> {
    const activity = await this.activityRepo.findById(activityId);
    
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    if (activity.type !== 'poll') {
      throw new Error(`Activity ${activityId} is not a poll activity`);
    }

    return activity as PollActivity;
  }

  /**
   * Configure a poll activity with question and options
   * @param activityId - The poll activity ID
   * @param question - The poll question text
   * @param options - Array of option texts
   * @throws Error if activity not found, not a poll, or validation fails
   */
  async configurePoll(
    activityId: string,
    question: string,
    options: string[]
  ): Promise<void> {
    // Validate inputs
    if (!question || question.trim().length === 0) {
      throw new Error('Poll question is required');
    }

    if (!options || options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }

    if (options.some(opt => !opt || opt.trim().length === 0)) {
      throw new Error('All poll options must have text');
    }

    // Get the poll activity (validates it exists and is a poll)
    const pollActivity = await this.getPollActivity(activityId);

    // Check if poll is in a valid state to be configured
    if (pollActivity.status === 'active') {
      throw new Error('Cannot configure poll while it is active');
    }

    // Create poll options with IDs
    const pollOptions: PollOption[] = options.map((text, index) => ({
      id: `option-${index}-${randomUUID().substring(0, 8)}`,
      text: text.trim(),
      voteCount: 0,
    }));

    // Update the activity with poll configuration
    await this.activityRepo.update(activityId, {
      question: question.trim(),
      options: pollOptions,
      status: 'ready', // Mark as ready once configured
      lastModified: Date.now(),
    });
  }

  /**
   * Start a poll activity (make it active and ready for voting)
   * @param activityId - The poll activity ID
   * @throws Error if activity not found, not a poll, or not ready
   */
  async startPoll(activityId: string): Promise<void> {
    // Get the poll activity
    const pollActivity = await this.getPollActivity(activityId);

    // Validate poll is configured
    if (!pollActivity.question || pollActivity.options.length === 0) {
      throw new Error('Poll must be configured before starting');
    }

    // Validate poll is in ready state
    if (pollActivity.status !== 'ready' && pollActivity.status !== 'draft') {
      throw new Error(`Cannot start poll in ${pollActivity.status} status`);
    }

    // Update status to active
    await this.activityRepo.setStatus(activityId, 'active');
  }

  /**
   * Submit a vote for a poll
   * @param activityId - The poll activity ID
   * @param participantId - The participant submitting the vote
   * @param optionIds - Array of selected option IDs
   * @throws Error if validation fails or duplicate vote
   */
  async submitVote(
    activityId: string,
    participantId: string,
    optionIds: string[]
  ): Promise<void> {
    // Validate inputs
    if (!participantId || participantId.trim().length === 0) {
      throw new Error('Participant ID is required');
    }

    if (!optionIds || optionIds.length === 0) {
      throw new Error('At least one option must be selected');
    }

    // Get the poll activity
    const pollActivity = await this.getPollActivity(activityId);

    // Validate poll is active
    if (pollActivity.status !== 'active') {
      throw new Error('Poll is not currently active');
    }

    // Validate multiple votes setting
    if (!pollActivity.allowMultipleVotes && optionIds.length > 1) {
      throw new Error('This poll does not allow multiple votes');
    }

    // Validate all option IDs are valid
    const validOptionIds = pollActivity.options.map(opt => opt.id);
    const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      throw new Error(`Invalid option IDs: ${invalidOptions.join(', ')}`);
    }

    // Check for duplicate vote
    const existingVote = await this.pollRepo.getVoteByParticipant(
      activityId,
      participantId
    );

    if (existingVote) {
      throw new Error('Participant has already voted in this poll');
    }

    // Create and save the vote
    const vote: PollVote = {
      voteId: randomUUID(),
      pollId: activityId,
      participantId,
      selectedOptionIds: optionIds,
      submittedAt: Date.now(),
    };

    await this.pollRepo.createVote(vote);
  }

  /**
   * Get current results for a poll
   * @param activityId - The poll activity ID
   * @returns Poll results with vote counts
   * @throws Error if activity not found or not a poll
   */
  async getResults(activityId: string): Promise<PollResults> {
    // Get the poll activity
    const pollActivity = await this.getPollActivity(activityId);

    // Get results from repository
    const results = await this.pollRepo.getResults(activityId, pollActivity.options);

    return results;
  }

  /**
   * End a poll activity and return final results
   * @param activityId - The poll activity ID
   * @returns Final poll results
   * @throws Error if activity not found, not a poll, or not active
   */
  async endPoll(activityId: string): Promise<PollResults> {
    // Get the poll activity
    const pollActivity = await this.getPollActivity(activityId);

    // Validate poll is active
    if (pollActivity.status !== 'active') {
      throw new Error('Poll is not currently active');
    }

    // Get final results
    const results = await this.pollRepo.getResults(activityId, pollActivity.options);

    // Update activity status to completed
    await this.activityRepo.setStatus(activityId, 'completed');

    return results;
  }
}
