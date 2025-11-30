#!/usr/bin/env ts-node
/**
 * Test script for activities migration
 * Creates test events and verifies migration works correctly
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'Events';

async function createTestEvent(eventId: string, name: string): Promise<void> {
  const event = {
    eventId,
    id: eventId,
    name,
    gamePin: Math.floor(100000 + Math.random() * 900000).toString(),
    organizerId: 'test-organizer',
    status: 'setup',
    currentQuestionIndex: 0,
    createdAt: Date.now(),
    joinLink: `http://localhost:3000/join/${eventId}`,
    visibility: 'private',
    isTemplate: false,
    lastModified: Date.now(),
    participantCount: 0,
  };

  const command = new PutCommand({
    TableName: EVENTS_TABLE,
    Item: event,
  });

  await docClient.send(command);
  console.log(`✓ Created test event: ${eventId} (${name})`);
}

async function verifyEventHasActiveActivityId(eventId: string): Promise<boolean> {
  const command = new GetCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId },
  });

  const result = await docClient.send(command);
  const event = result.Item;

  if (!event) {
    console.error(`✗ Event ${eventId} not found`);
    return false;
  }

  if (event.activeActivityId === undefined) {
    console.error(`✗ Event ${eventId} missing activeActivityId field`);
    return false;
  }

  console.log(`✓ Event ${eventId} has activeActivityId: ${event.activeActivityId}`);
  return true;
}

async function cleanupTestEvents(): Promise<void> {
  const scanCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
    FilterExpression: 'begins_with(eventId, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'test-migration-',
    },
  });

  const result = await docClient.send(scanCommand);
  const events = result.Items || [];

  console.log(`\nCleaning up ${events.length} test events...`);
  // Note: In a real scenario, we'd delete these events
  // For now, just report them
  for (const event of events) {
    console.log(`  - ${event.eventId} (${event.name})`);
  }
}

async function main(): Promise<void> {
  console.log('=== Testing Activities Migration ===\n');
  console.log(`Events Table: ${EVENTS_TABLE}`);
  console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS'}\n`);

  try {
    // Create test events
    console.log('Creating test events...');
    await createTestEvent('test-migration-1', 'Test Event 1');
    await createTestEvent('test-migration-2', 'Test Event 2');
    await createTestEvent('test-migration-3', 'Test Event 3');

    console.log('\n✓ Test events created successfully');
    console.log('\nNow run the migration:');
    console.log('  npm run migrate:activities -- --yes');
    console.log('\nThen run this script again with --verify flag:');
    console.log('  npm run test:activities-migration -- --verify');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

async function verify(): Promise<void> {
  console.log('=== Verifying Migration ===\n');

  try {
    let allPassed = true;

    console.log('Verifying test events have activeActivityId field...');
    allPassed = await verifyEventHasActiveActivityId('test-migration-1') && allPassed;
    allPassed = await verifyEventHasActiveActivityId('test-migration-2') && allPassed;
    allPassed = await verifyEventHasActiveActivityId('test-migration-3') && allPassed;

    if (allPassed) {
      console.log('\n✓ All tests passed!');
      await cleanupTestEvents();
    } else {
      console.error('\n✗ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--verify')) {
  verify().catch(console.error);
} else {
  main().catch(console.error);
}
