/**
 * ActivityRepository - Data access layer for Activity operations
 */
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client';
import { Activity, ActivityStatus } from '../../types/models';

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

export class ActivityRepository {
  /**
   * Create a new activity in DynamoDB
   */
  async create(activity: Activity): Promise<Activity> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Item: activity,
      });

      await retryOperation(() => docClient.send(command));
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Get an activity by ID
   */
  async findById(activityId: string): Promise<Activity | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Key: {
          activityId: activityId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return result.Item ? (result.Item as Activity) : null;
    } catch (error) {
      console.error('Error getting activity:', error);
      throw error;
    }
  }

  /**
   * Get all activities for an event using GSI, ordered by order field
   */
  async findByEventId(eventId: string): Promise<Activity[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        IndexName: 'EventActivities',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      const activities = (result.Items as Activity[]) || [];
      
      // Sort by order field
      return activities.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error getting activities by event:', error);
      throw error;
    }
  }

  /**
   * Update activity with partial data
   */
  async update(activityId: string, updates: Partial<Activity>): Promise<Activity> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Always update lastModified
      updates.lastModified = Date.now();

      let index = 0;
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'activityId' && value !== undefined) {
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;
          updateExpressions.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
          index++;
        }
      }

      if (updateExpressions.length === 0) {
        // Nothing to update, just return the current activity
        const current = await this.findById(activityId);
        if (!current) {
          throw new Error(`Activity not found: ${activityId}`);
        }
        return current;
      }

      const command = new UpdateCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Key: {
          activityId: activityId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const result = await retryOperation(() => docClient.send(command));
      return result.Attributes as Activity;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  /**
   * Delete an activity
   */
  async delete(activityId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Key: {
          activityId: activityId,
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  /**
   * Update activity status
   */
  async setStatus(activityId: string, status: ActivityStatus): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAMES.ACTIVITIES,
        Key: {
          activityId: activityId,
        },
        UpdateExpression: 'SET #status = :status, lastModified = :lastModified',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':lastModified': Date.now(),
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error updating activity status:', error);
      throw error;
    }
  }
}
