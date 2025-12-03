/**
 * DynamoDB client configuration using AWS SDK v3
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Configure DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

// Create DynamoDB Document Client for simplified operations
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table names from environment variables with defaults
export const TABLE_NAMES = {
  EVENTS: process.env.EVENTS_TABLE_NAME || process.env.EVENTS_TABLE || 'LiveQuizEvents',
  QUESTIONS: process.env.QUESTIONS_TABLE_NAME || process.env.QUESTIONS_TABLE || 'LiveQuizQuestions',
  PARTICIPANTS: process.env.PARTICIPANTS_TABLE_NAME || process.env.PARTICIPANTS_TABLE || 'LiveQuizParticipants',
  ANSWERS: process.env.ANSWERS_TABLE_NAME || process.env.ANSWERS_TABLE || 'LiveQuizAnswers',
  GAME_PINS: process.env.GAME_PINS_TABLE_NAME || process.env.GAME_PINS_TABLE || 'LiveQuizGamePins',
  ACTIVITIES: process.env.ACTIVITIES_TABLE || 'Activities',
  POLL_VOTES: process.env.POLL_VOTES_TABLE || 'PollVotes',
  RAFFLE_ENTRIES: process.env.RAFFLE_ENTRIES_TABLE || 'RaffleEntries',
};
