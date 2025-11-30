#!/usr/bin/env ts-node

/**
 * Script to create DynamoDB tables locally
 * Run with: npm run setup:local-db
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  ListTablesCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

const tables = [
  {
    TableName: 'Events',
    KeySchema: [{ AttributeName: 'eventId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'organizerId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'organizerId-index',
        KeySchema: [{ AttributeName: 'organizerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'organizerId-status-index',
        KeySchema: [
          { AttributeName: 'organizerId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'GamePins',
    KeySchema: [{ AttributeName: 'gamePin', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'gamePin', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      Enabled: true,
      AttributeName: 'expiresAt',
    },
  },
  {
    TableName: 'Questions',
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' },
      { AttributeName: 'questionId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'questionId', AttributeType: 'S' },
      { AttributeName: 'order', AttributeType: 'N' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'eventId-order-index',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
          { AttributeName: 'order', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Participants',
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' },
      { AttributeName: 'participantId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Answers',
    KeySchema: [
      { AttributeName: 'participantId', KeyType: 'HASH' },
      { AttributeName: 'questionId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'participantId', AttributeType: 'S' },
      { AttributeName: 'questionId', AttributeType: 'S' },
      { AttributeName: 'eventId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'eventId-questionId-index',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
          { AttributeName: 'questionId', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Templates',
    KeySchema: [{ AttributeName: 'templateId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'templateId', AttributeType: 'S' },
      { AttributeName: 'organizerId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'organizerId-index',
        KeySchema: [{ AttributeName: 'organizerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'Activities',
    KeySchema: [{ AttributeName: 'activityId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'activityId', AttributeType: 'S' },
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'order', AttributeType: 'N' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EventActivities',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
          { AttributeName: 'order', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'PollVotes',
    KeySchema: [
      { AttributeName: 'pollId', KeyType: 'HASH' },
      { AttributeName: 'voteId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pollId', AttributeType: 'S' },
      { AttributeName: 'voteId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PollVotes',
        KeySchema: [
          { AttributeName: 'pollId', KeyType: 'HASH' },
          { AttributeName: 'participantId', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'RaffleEntries',
    KeySchema: [
      { AttributeName: 'raffleId', KeyType: 'HASH' },
      { AttributeName: 'entryId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'raffleId', AttributeType: 'S' },
      { AttributeName: 'entryId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'RaffleEntries',
        KeySchema: [
          { AttributeName: 'raffleId', KeyType: 'HASH' },
          { AttributeName: 'participantId', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function setupTables(recreate = false) {
  try {
    console.log('🔍 Checking existing tables...');
    const { TableNames } = await client.send(new ListTablesCommand({}));
    console.log('Existing tables:', TableNames || []);

    for (const table of tables) {
      const exists = TableNames?.includes(table.TableName);

      if (exists && recreate) {
        console.log(`🗑️  Deleting existing table: ${table.TableName}`);
        await client.send(
          new DeleteTableCommand({ TableName: table.TableName })
        );
        // Wait a bit for deletion
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!exists || recreate) {
        console.log(`✨ Creating table: ${table.TableName}`);
        await client.send(new CreateTableCommand(table as any));
        console.log(`✅ Created table: ${table.TableName}`);
      } else {
        console.log(`⏭️  Table already exists: ${table.TableName}`);
      }
    }

    console.log('\n✅ All tables are ready!');
    console.log('\n📊 DynamoDB Admin UI: http://localhost:8001');
    console.log('🔌 DynamoDB Endpoint: http://localhost:8000');
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    process.exit(1);
  }
}

// Check if --recreate flag is passed
const recreate = process.argv.includes('--recreate');

if (recreate) {
  console.log('⚠️  Recreating all tables (existing data will be lost)...\n');
}

setupTables(recreate);
