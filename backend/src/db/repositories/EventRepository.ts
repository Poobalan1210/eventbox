/**
 * EventRepository - Data access layer for Event operations
 */
import { PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { Event, EventStatus, EventVisibility } from '../../types/models';

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

export class EventRepository {
  /**
   * Create a new event in DynamoDB
   */
  async createEvent(event: Event): Promise<Event> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.EVENTS,
        Item: event,
      });

      await retryOperation(() => docClient.send(command));
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get an event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return result.Item ? (result.Item as Event) : null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  /**
   * Update event status
   */
  async updateEventStatus(
    eventId: string,
    status: EventStatus
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  }

  /**
   * Update current question index
   */
  async updateCurrentQuestionIndex(
    eventId: string,
    questionIndex: number
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
        UpdateExpression: 'SET currentQuestionIndex = :index, lastModified = :lastModified',
        ExpressionAttributeValues: {
          ':index': questionIndex,
          ':lastModified': Date.now(),
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error updating current question index:', error);
      throw error;
    }
  }

  /**
   * Update event visibility
   */
  async updateEventVisibility(
    eventId: string,
    visibility: EventVisibility
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
        UpdateExpression: 'SET visibility = :visibility, lastModified = :lastModified',
        ExpressionAttributeValues: {
          ':visibility': visibility,
          ':lastModified': Date.now(),
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error updating event visibility:', error);
      throw error;
    }
  }

  /**
   * Update event with partial data
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Always update lastModified
      updates.lastModified = Date.now();

      let index = 0;
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'eventId' && key !== 'id' && value !== undefined) {
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;
          updateExpressions.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
          index++;
        }
      }

      if (updateExpressions.length === 0) {
        return; // Nothing to update
      }

      const command = new UpdateCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Get all events for an organizer using GSI
   */
  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAMES.EVENTS,
        IndexName: 'organizerId-index',
        KeyConditionExpression: 'organizerId = :organizerId',
        ExpressionAttributeValues: {
          ':organizerId': organizerId,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as Event[]) || [];
    } catch (error) {
      console.error('Error getting events by organizer:', error);
      throw error;
    }
  }

  /**
   * Get events for an organizer filtered by status using GSI
   */
  async getEventsByOrganizerAndStatus(
    organizerId: string,
    status: EventStatus
  ): Promise<Event[]> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAMES.EVENTS,
        IndexName: 'organizerId-status-index',
        KeyConditionExpression: 'organizerId = :organizerId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':organizerId': organizerId,
          ':status': status,
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as Event[]) || [];
    } catch (error) {
      console.error('Error getting events by organizer and status:', error);
      throw error;
    }
  }

  /**
   * Get all public events
   */
  async getPublicEvents(): Promise<Event[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAMES.EVENTS,
        FilterExpression: 'visibility = :visibility',
        ExpressionAttributeValues: {
          ':visibility': 'public',
        },
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as Event[]) || [];
    } catch (error) {
      console.error('Error getting public events:', error);
      throw error;
    }
  }

  /**
   * Get all events (for migration purposes)
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAMES.EVENTS,
      });

      const result = await retryOperation(() => docClient.send(command));
      return (result.Items as Event[]) || [];
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  /**
   * Delete an event (for testing purposes)
   * Also cascades to delete all associated activities
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      // First, get all activities for this event and delete them
      const activities = await this.listActivities(eventId);
      
      console.log(`Deleting event ${eventId} with ${activities.length} activities`);
      
      // Delete all activities directly with composite key (more efficient)
      for (const activity of activities) {
        console.log(`Deleting activity ${activity.activityId}`);
        const deleteActivityCommand = new DeleteCommand({
          TableName: TABLE_NAMES.ACTIVITIES,
          Key: {
            eventId: eventId,
            activityId: activity.activityId,
          },
        });
        await retryOperation(() => docClient.send(deleteActivityCommand));
      }
      
      console.log(`Deleting event ${eventId} from Events table`);
      // Then delete the event itself
      const command = new DeleteCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
      });

      await retryOperation(() => docClient.send(command));
      console.log(`Successfully deleted event ${eventId}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Set the active activity for an event
   */
  async setActiveActivity(eventId: string, activityId: string | null): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAMES.EVENTS,
        Key: {
          eventId: eventId,
        },
        UpdateExpression: 'SET activeActivityId = :activityId, lastModified = :lastModified',
        ExpressionAttributeValues: {
          ':activityId': activityId,
          ':lastModified': Date.now(),
        },
      });

      await retryOperation(() => docClient.send(command));
    } catch (error) {
      console.error('Error setting active activity:', error);
      throw error;
    }
  }

  /**
   * Get the currently active activity for an event
   */
  async getActiveActivity(eventId: string): Promise<string | null> {
    try {
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }
      return event.activeActivityId || null;
    } catch (error) {
      console.error('Error getting active activity:', error);
      throw error;
    }
  }

  /**
   * List all activities for an event
   */
  async listActivities(eventId: string): Promise<any[]> {
    try {
      // Import ActivityRepository to query activities
      const { ActivityRepository } = await import('./ActivityRepository.js');
      const activityRepo = new ActivityRepository();
      
      return await activityRepo.findByEventId(eventId);
    } catch (error) {
      console.error('Error listing activities:', error);
      throw error;
    }
  }
}
