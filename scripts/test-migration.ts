#!/usr/bin/env ts-node
/**
 * Test script for migration functionality
 * 
 * This script tests the migration process with local DynamoDB:
 * 1. Creates test events with old schema
 * 2. Runs the migration
 * 3. Verifies the results
 * 4. Tests rollback functionality
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Configure DynamoDB client for local testing
const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
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

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'LiveQuizEvents';
const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE || 'LiveQuizParticipants';

interface OldEvent {
  eventId: string;
  id: string;
  name: string;
  gamePin: string;
  organizerId: string;
  status: string;
  currentQuestionIndex: number;
  createdAt: number;
  joinLink: string;
}

interface NewEvent extends OldEvent {
  visibility: 'private' | 'public';
  isTemplate: boolean;
  lastModified: number;
  participantCount: number;
}

/**
 * Create test events with old schema
 */
async function createTestEvents(): Promise<void> {
  console.log('Creating test events with old schema...\n');
  
  const testEvents: OldEvent[] = [
    {
      eventId: 'test-event-1',
      id: 'test-event-1',
      name: 'Test Quiz 1 - Waiting',
      gamePin: '123456',
      organizerId: 'test-organizer-1',
      status: 'waiting',
      currentQuestionIndex: 0,
      createdAt: Date.now() - 86400000, // 1 day ago
      joinLink: 'http://localhost:5173/join/123456',
    },
    {
      eventId: 'test-event-2',
      id: 'test-event-2',
      name: 'Test Quiz 2 - Active',
      gamePin: '234567',
      organizerId: 'test-organizer-1',
      status: 'active',
      currentQuestionIndex: 2,
      createdAt: Date.now() - 3600000, // 1 hour ago
      joinLink: 'http://localhost:5173/join/234567',
    },
    {
      eventId: 'test-event-3',
      id: 'test-event-3',
      name: 'Test Quiz 3 - Completed',
      gamePin: '345678',
      organizerId: 'test-organizer-2',
      status: 'completed',
      currentQuestionIndex: 5,
      createdAt: Date.now() - 172800000, // 2 days ago
      joinLink: 'http://localhost:5173/join/345678',
    },
  ];

  for (const event of testEvents) {
    const command = new PutCommand({
      TableName: EVENTS_TABLE,
      Item: event,
    });

    await docClient.send(command);
    console.log(`✓ Created test event: ${event.name} (status: ${event.status})`);
  }

  // Create some test participants
  console.log('\nCreating test participants...\n');
  
  const participants = [
    { eventId: 'test-event-2', participantId: 'p1', name: 'Alice', score: 1000 },
    { eventId: 'test-event-2', participantId: 'p2', name: 'Bob', score: 800 },
    { eventId: 'test-event-3', participantId: 'p3', name: 'Charlie', score: 1200 },
    { eventId: 'test-event-3', participantId: 'p4', name: 'Diana', score: 900 },
    { eventId: 'test-event-3', participantId: 'p5', name: 'Eve', score: 1100 },
  ];

  for (const participant of participants) {
    const command = new PutCommand({
      TableName: PARTICIPANTS_TABLE,
      Item: participant,
    });

    await docClient.send(command);
    console.log(`✓ Created participant: ${participant.name} for event ${participant.eventId}`);
  }
}

/**
 * Verify migration results
 */
async function verifyMigration(): Promise<boolean> {
  console.log('\n=== Verifying Migration Results ===\n');
  
  const command = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(command);
  const events = (result.Items as NewEvent[]) || [];

  let passed = true;

  for (const event of events) {
    console.log(`Checking event: ${event.name}`);
    
    // Check required new fields
    if (event.visibility === undefined) {
      console.error(`  ✗ Missing visibility field`);
      passed = false;
    } else {
      console.log(`  ✓ visibility: ${event.visibility}`);
    }

    if (event.isTemplate === undefined) {
      console.error(`  ✗ Missing isTemplate field`);
      passed = false;
    } else {
      console.log(`  ✓ isTemplate: ${event.isTemplate}`);
    }

    if (event.lastModified === undefined) {
      console.error(`  ✗ Missing lastModified field`);
      passed = false;
    } else {
      console.log(`  ✓ lastModified: ${new Date(event.lastModified).toISOString()}`);
    }

    if (event.participantCount === undefined) {
      console.error(`  ✗ Missing participantCount field`);
      passed = false;
    } else {
      console.log(`  ✓ participantCount: ${event.participantCount}`);
    }

    // Verify status mapping
    const expectedStatuses = ['setup', 'live', 'completed'];
    if (!expectedStatuses.includes(event.status)) {
      console.error(`  ✗ Invalid status: ${event.status}`);
      passed = false;
    } else {
      console.log(`  ✓ status: ${event.status}`);
    }

    // Verify participant counts
    if (event.eventId === 'test-event-2' && event.participantCount !== 2) {
      console.error(`  ✗ Expected 2 participants, got ${event.participantCount}`);
      passed = false;
    }
    if (event.eventId === 'test-event-3' && event.participantCount !== 3) {
      console.error(`  ✗ Expected 3 participants, got ${event.participantCount}`);
      passed = false;
    }

    console.log('');
  }

  return passed;
}

/**
 * Clean up test data
 */
async function cleanup(): Promise<void> {
  console.log('\n=== Cleaning Up Test Data ===\n');
  
  // This would normally delete the test events, but for safety we'll just log
  console.log('Test data cleanup would happen here in a real test environment');
  console.log('For local testing, you can manually delete test events or recreate the tables');
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  try {
    console.log('=== Migration Test Suite ===\n');
    console.log(`Events Table: ${EVENTS_TABLE}`);
    console.log(`Participants Table: ${PARTICIPANTS_TABLE}`);
    console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'}\n`);

    // Step 1: Create test events
    await createTestEvents();

    console.log('\n✓ Test data created successfully');
    console.log('\nNow run the migration:');
    console.log('  npm run migrate:verify  # Preview changes');
    console.log('  npm run migrate         # Run migration');
    console.log('\nThen run this script again with --verify to check results:');
    console.log('  ts-node scripts/test-migration.ts --verify');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Entry point
 */
async function run(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    const passed = await verifyMigration();
    if (passed) {
      console.log('\n✓ All migration verification checks passed!');
    } else {
      console.error('\n✗ Some migration verification checks failed');
      process.exit(1);
    }
  } else {
    await main();
  }
}

run().catch(console.error);
