/**
 * PollRepository - Data access layer for Poll operations
 */
import {
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { PollVote, PollOption } from '../../types/models';

/**
 * PollResults - Aggregated poll voting results
 */
export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: PollOption[];
}

/**
 * Retry helper for transient errors
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on non-transient errors
      if (
        error.name === 'ResourceNotFoundException' ||
        error.name === 'ValidationException' ||
        error.name === 'ConditionalCheckFailedException'
      ) {
        throw error;
      }
      
      // Retry on transient errors
      if (
        attempt < maxRetries &&
        (error.name === 'ProvisionedThroughputExceededException' ||
         error.name === 'ThrottlingException' ||
         error.name === 'ServiceUnavailable' ||
         error.name === 'InternalServerError')
      ) {
        const backoffDelay = delayMs * Math.pow(2, attempt);
        console.log(`Retrying operation after ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export class PollRepository {
  /**
   * Create a new vote in DynamoDB
   */
  async createVote(vote: PollVote): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.POLL_VOTES,
        Item: vote,
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error creating poll vote:', error);
      throw error;
    }
  }

  /**
   * Get all votes for a poll using GSI
   */
  async getVotes(pollId: string): Promise<PollVote[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAMES.POLL_VOTES,
        IndexName: 'PollVotes',
        KeyConditionExpression: 'pollId = :pollId',
        ExpressionAttributeValues: {
          ':pollId': pollId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as PollVote[]) || [];
    } catch (error) {
      console.error('Error getting poll votes:', error);
      throw error;
    }
  }

  /**
   * Get a specific participant's vote for a poll
   */
  async getVoteByParticipant(
    pollId: string,
    participantId: string
  ): Promise<PollVote | null> {
    try {
      // Get all votes for the poll and filter in memory
      // This is acceptable for polls since they typically have fewer votes
      const votes = await this.getVotes(pollId);
      
      return votes.find(vote => vote.participantId === participantId) || null;
    } catch (error) {
      console.error('Error getting vote by participant:', error);
      throw error;
    }
  }

  /**
   * Get aggregated results for a poll
   */
  async getResults(pollId: string, pollOptions: PollOption[]): Promise<PollResults> {
    try {
      // Get all votes for the poll
      const votes = await this.getVotes(pollId);
      
      // Initialize vote counts
      const optionCounts = new Map<string, number>();
      pollOptions.forEach(option => {
        optionCounts.set(option.id, 0);
      });
      
      // Count votes for each option
      votes.forEach(vote => {
        vote.selectedOptionIds.forEach(optionId => {
          const currentCount = optionCounts.get(optionId) || 0;
          optionCounts.set(optionId, currentCount + 1);
        });
      });
      
      // Build results with updated vote counts
      const resultsOptions = pollOptions.map(option => ({
        ...option,
        voteCount: optionCounts.get(option.id) || 0,
      }));
      
      return {
        pollId,
        totalVotes: votes.length,
        options: resultsOptions,
      };
    } catch (error) {
      console.error('Error getting poll results:', error);
      throw error;
    }
  }
}
