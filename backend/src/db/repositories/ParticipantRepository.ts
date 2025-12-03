/**
 * ParticipantRepository - Data access layer for Participant operations
 */
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAMES } from '../client.js';
import { Participant } from '../../types/models';

export class ParticipantRepository {
  /**
   * Add a new participant to an event
   */
  async addParticipant(participant: Participant): Promise<Participant> {
    const command = new PutCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      Item: participant,
    });

    await docClient.send(command);
    return participant;
  }

  /**
   * Get all participants for an event
   */
  async getParticipants(eventId: string): Promise<Participant[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId,
      },
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Participant[];
  }

  /**
   * Get a specific participant
   */
  async getParticipant(
    eventId: string,
    participantId: string
  ): Promise<Participant | null> {
    const command = new GetCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      Key: {
        eventId,
        participantId: participantId,
      },
    });

    const result = await docClient.send(command);
    return result.Item ? (result.Item as Participant) : null;
  }

  /**
   * Update participant score
   */
  async updateParticipantScore(
    eventId: string,
    participantId: string,
    score: number,
    totalAnswerTime: number
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      Key: {
        eventId,
        participantId: participantId,
      },
      UpdateExpression: 'SET score = :score, totalAnswerTime = :totalAnswerTime',
      ExpressionAttributeValues: {
        ':score': score,
        ':totalAnswerTime': totalAnswerTime,
      },
    });

    await docClient.send(command);
  }

  /**
   * Update participant streak
   */
  async updateParticipantStreak(
    eventId: string,
    participantId: string,
    currentStreak: number,
    longestStreak: number
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      Key: {
        eventId,
        participantId: participantId,
      },
      UpdateExpression: 'SET currentStreak = :currentStreak, longestStreak = :longestStreak',
      ExpressionAttributeValues: {
        ':currentStreak': currentStreak,
        ':longestStreak': longestStreak,
      },
    });

    await docClient.send(command);
  }

  /**
   * Update participant's answers array
   */
  async updateParticipantAnswers(
    eventId: string,
    participantId: string,
    answers: any[]
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAMES.PARTICIPANTS,
      Key: {
        eventId,
        participantId: participantId,
      },
      UpdateExpression: 'SET answers = :answers',
      ExpressionAttributeValues: {
        ':answers': answers,
      },
    });

    await docClient.send(command);
  }
}
