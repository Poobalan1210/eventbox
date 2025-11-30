/**
 * GamePinRepository - Data access layer for GamePin operations
 */
import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client';
import { GamePin } from '../../types/models';

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

export class GamePinRepository {
  /**
   * Create a new game PIN in DynamoDB
   */
  async createGamePin(gamePin: GamePin): Promise<GamePin> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.GAME_PINS,
        Item: gamePin,
        ConditionExpression: 'attribute_not_exists(gamePin)', // Ensure uniqueness
      });

      await retryOperation(() => docClient.send(command));
      return gamePin;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Game PIN already exists');
      }
      console.error('Error creating game PIN:', error);
      throw error;
    }
  }

  /**
   * Get a game PIN by PIN code
   */
  async getGamePin(gamePin: string): Promise<GamePin | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAMES.GAME_PINS,
        Key: {
          gamePin: gamePin,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return result.Item ? (result.Item as GamePin) : null;
    } catch (error) {
      console.error('Error getting game PIN:', error);
      throw error;
    }
  }

  /**
   * Delete a game PIN
   */
  async deleteGamePin(gamePin: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAMES.GAME_PINS,
        Key: {
          gamePin: gamePin,
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error deleting game PIN:', error);
      throw error;
    }
  }
}
