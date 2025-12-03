/**
 * RaffleRepository - Data access layer for Raffle operations
 */
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { RaffleEntry } from '../../types/models';

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

export class RaffleRepository {
  /**
   * Create a new raffle entry in DynamoDB
   */
  async createEntry(entry: RaffleEntry): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.RAFFLE_ENTRIES,
        Item: entry,
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error creating raffle entry:', error);
      throw error;
    }
  }

  /**
   * Get all entries for a raffle using GSI
   */
  async getEntries(raffleId: string): Promise<RaffleEntry[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAMES.RAFFLE_ENTRIES,
        IndexName: 'RaffleEntries',
        KeyConditionExpression: 'raffleId = :raffleId',
        ExpressionAttributeValues: {
          ':raffleId': raffleId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as RaffleEntry[]) || [];
    } catch (error) {
      console.error('Error getting raffle entries:', error);
      throw error;
    }
  }

  /**
   * Get a specific participant's entry for a raffle
   */
  async getEntryByParticipant(
    raffleId: string,
    participantId: string
  ): Promise<RaffleEntry | null> {
    try {
      // Get all entries for the raffle and filter in memory
      // This is acceptable for raffles since they typically have fewer entries
      const entries = await this.getEntries(raffleId);
      
      return entries.find(entry => entry.participantId === participantId) || null;
    } catch (error) {
      console.error('Error getting entry by participant:', error);
      throw error;
    }
  }

  /**
   * Set winners for a raffle by updating the raffle activity
   * Note: This updates the Activity record, not individual entries
   */
  async setWinners(raffleId: string, winnerIds: string[]): Promise<void> {
    try {
      // First, get the activity to find its eventId (needed for composite key)
      const { ActivityRepository } = await import('./ActivityRepository.js');
      const activityRepo = new ActivityRepository();
      const activity = await activityRepo.findById(raffleId);
      
      if (!activity) {
        throw new Error(`Activity not found: ${raffleId}`);
      }

      const command = new UpdateCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Key: {
          eventId: activity.eventId,
          activityId: raffleId,
        },
        UpdateExpression: 'SET winners = :winners, lastModified = :lastModified',
        ExpressionAttributeValues: {
          ':winners': winnerIds,
          ':lastModified': Date.now(),
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error setting raffle winners:', error);
      throw error;
    }
  }
}
