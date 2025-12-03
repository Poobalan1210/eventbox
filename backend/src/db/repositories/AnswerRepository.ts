/**
 * AnswerRepository - Data access layer for Answer operations
 */
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { Answer } from '../../types/models';

export class AnswerRepository {
  /**
   * Save a participant's answer to a question
   * Uses conditional expression to prevent duplicate submissions
   */
  async saveAnswer(answer: Answer): Promise<Answer> {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAMES.ANSWERS,
        Item: answer,
        // Prevent duplicate submissions - only insert if this combination doesn't exist
        ConditionExpression: 'attribute_not_exists(participantId) AND attribute_not_exists(questionId)',
      });

      await docClient.send(command);
      return answer;
    } catch (error: any) {
      // If condition fails, it means answer already exists
      if (error.name === 'ConditionalCheckFailedException') {
        console.log(`Duplicate answer submission prevented for participant ${answer.participantId}, question ${answer.questionId}`);
        throw new Error('Answer already submitted for this question');
      }
      console.error('Error saving answer:', error);
      throw error;
    }
  }

  /**
   * Get all answers by a specific participant
   */
  async getAnswersByParticipant(participantId: string): Promise<Answer[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.ANSWERS,
      KeyConditionExpression: 'participantId = :participantId',
      ExpressionAttributeValues: {
        ':participantId': participantId,
      },
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Answer[];
  }

  /**
   * Get all answers for a specific question
   * Note: This requires a GSI (Global Secondary Index) on eventId-questionId
   */
  async getAnswersByQuestion(
    eventId: string,
    questionId: string
  ): Promise<Answer[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.ANSWERS,
      IndexName: 'eventId-questionId-index',
      KeyConditionExpression: 'eventId = :eventId AND questionId = :questionId',
      ExpressionAttributeValues: {
        ':eventId': eventId,
        ':questionId': questionId,
      },
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Answer[];
  }

  /**
   * Get a specific answer by participant and question
   */
  async getAnswer(
    participantId: string,
    questionId: string
  ): Promise<Answer | null> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.ANSWERS,
      KeyConditionExpression:
        'participantId = :participantId AND questionId = :questionId',
      ExpressionAttributeValues: {
        ':participantId': participantId,
        ':questionId': questionId,
      },
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0
      ? (result.Items[0] as Answer)
      : null;
  }
}
