/**
 * QuestionRepository - Data access layer for Question operations
 */
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { Question } from '../../types/models';

export class QuestionRepository {
  /**
   * Add a new question to an event
   */
  async addQuestion(question: Question): Promise<Question> {
    const command = new PutCommand({
      TableName: TABLE_NAMES.QUESTIONS,
      Item: question,
    });

    await docClient.send(command);
    return question;
  }

  /**
   * Get all questions for an event, ordered by question order
   */
  async getQuestions(eventId: string): Promise<Question[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.QUESTIONS,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId,
      },
    });

    const result = await docClient.send(command);
    const questions = (result.Items || []) as Question[];

    // Sort by order field
    return questions.sort((a, b) => a.order - b.order);
  }

  /**
   * Get a specific question by eventId and questionId
   */
  async getQuestion(eventId: string, questionId: string): Promise<Question | null> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.QUESTIONS,
      KeyConditionExpression: 'eventId = :eventId AND questionId = :questionId',
      ExpressionAttributeValues: {
        ':eventId': eventId,
        ':questionId': questionId,
      },
    });

    const result = await docClient.send(command);
    return result.Items && result.Items.length > 0
      ? (result.Items[0] as Question)
      : null;
  }

  /**
   * Update a question
   */
  async updateQuestion(
    eventId: string,
    questionId: string,
    updates: Partial<Omit<Question, 'id' | 'eventId'>>
  ): Promise<void> {
    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.text !== undefined) {
      updateExpressions.push('#text = :text');
      expressionAttributeNames['#text'] = 'text';
      expressionAttributeValues[':text'] = updates.text;
    }

    if (updates.options !== undefined) {
      updateExpressions.push('#options = :options');
      expressionAttributeNames['#options'] = 'options';
      expressionAttributeValues[':options'] = updates.options;
    }

    if (updates.correctOptionId !== undefined) {
      updateExpressions.push('correctOptionId = :correctOptionId');
      expressionAttributeValues[':correctOptionId'] = updates.correctOptionId;
    }

    if (updates.timerSeconds !== undefined) {
      updateExpressions.push('timerSeconds = :timerSeconds');
      expressionAttributeValues[':timerSeconds'] = updates.timerSeconds;
    }

    if (updates.order !== undefined) {
      updateExpressions.push('#order = :order');
      expressionAttributeNames['#order'] = 'order';
      expressionAttributeValues[':order'] = updates.order;
    }

    if (updates.imageUrl !== undefined) {
      updateExpressions.push('imageUrl = :imageUrl');
      expressionAttributeValues[':imageUrl'] = updates.imageUrl;
    }

    if (updateExpressions.length === 0) {
      return; // No updates to perform
    }

    const command = new UpdateCommand({
      TableName: TABLE_NAMES.QUESTIONS,
      Key: {
        eventId,
        questionId: questionId,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0
          ? expressionAttributeNames
          : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
  }

  /**
   * Delete a question
   */
  async deleteQuestion(eventId: string, questionId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAMES.QUESTIONS,
      Key: {
        eventId,
        questionId: questionId,
      },
    });

    await docClient.send(command);
  }
}
