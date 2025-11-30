#!/usr/bin/env ts-node
/**
 * Test script for data migration (Task 36)
 * Creates test events with questions and verifies migration creates activities correctly
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

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
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || 'Questions';
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE || 'Activities';

interface TestEvent {
  eventId: string;
  name: string;
  status: string;
  questionCount: number;
}

const testEvents: TestEvent[] = [
  { eventId: 'test-data-migration-1', name: 'Draft Event', status: 'draft', questionCount: 3 },
  { eventId: 'test-data-migration-2', name: 'Setup Event', status: 'setup', questionCount: 5 },
  { eventId: 'test-data-migration-3', name: 'Live Event', status: 'live', questionCount: 2 },
  { eventId: 'test-data-migration-4', name: 'Completed Event', status: 'completed', questionCount: 4 },
];

async function createTestEvent(testEvent: TestEvent): Promise<void> {
  const event = {
    eventId: testEvent.eventId,
    id: testEvent.eventId,
    name: testEvent.name,
    gamePin: Math.floor(100000 + Math.random() * 900000).toString(),
    organizerId: 'test-organizer',
    status: testEvent.status,
    currentQuestionIndex: 0,
    createdAt: Date.now(),
    joinLink: `http://localhost:3000/join/${testEvent.eventId}`,
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
  console.log(`  ✓ Created event: ${testEvent.eventId} (${testEvent.name}, status: ${testEvent.status})`);
}

async function createTestQuestions(eventId: string, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const questionId = randomUUID();
    const question = {
      questionId,
      id: questionId,
      eventId,
      text: `Question ${i + 1} for ${eventId}`,
      options: [
        { id: 'opt1', text: 'Option A', color: 'red', shape: 'triangle' },
        { id: 'opt2', text: 'Option B', color: 'blue', shape: 'diamond' },
        { id: 'opt3', text: 'Option C', color: 'yellow', shape: 'circle' },
        { id: 'opt4', text: 'Option D', color: 'green', shape: 'square' },
      ],
      correctOptionId: 'opt1',
      timerSeconds: 30,
      order: i,
    };

    const command = new PutCommand({
      TableName: QUESTIONS_TABLE,
      Item: question,
    });

    await docClient.send(command);
  }
  console.log(`  ✓ Created ${count} questions for event ${eventId}`);
}

async function verifyEventMigration(testEvent: TestEvent): Promise<boolean> {
  console.log(`\nVerifying migration for event: ${testEvent.eventId}`);
  let passed = true;

  // 1. Check event has activeActivityId field
  const eventCommand = new GetCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId: testEvent.eventId },
  });

  const eventResult = await docClient.send(eventCommand);
  const event = eventResult.Item;

  if (!event) {
    console.error(`  ✗ Event ${testEvent.eventId} not found`);
    return false;
  }

  if (event.activeActivityId === undefined) {
    console.error(`  ✗ Event ${testEvent.eventId} missing activeActivityId field`);
    passed = false;
  } else {
    console.log(`  ✓ Event has activeActivityId field: ${event.activeActivityId}`);
  }

  // 2. Check activity was created
  const activitiesCommand = new QueryCommand({
    TableName: ACTIVITIES_TABLE,
    IndexName: 'eventId-order-index',
    KeyConditionExpression: 'eventId = :eventId',
    ExpressionAttributeValues: {
      ':eventId': testEvent.eventId,
    },
  });

  const activitiesResult = await docClient.send(activitiesCommand);
  const activities = activitiesResult.Items || [];

  if (activities.length === 0) {
    console.error(`  ✗ No activities found for event ${testEvent.eventId}`);
    passed = false;
  } else if (activities.length > 1) {
    console.error(`  ✗ Expected 1 activity, found ${activities.length} for event ${testEvent.eventId}`);
    passed = false;
  } else {
    const activity = activities[0];
    console.log(`  ✓ Activity created: ${activity.activityId}`);

    // Verify activity type
    if (activity.type !== 'quiz') {
      console.error(`  ✗ Expected activity type 'quiz', got '${activity.type}'`);
      passed = false;
    } else {
      console.log(`  ✓ Activity type is 'quiz'`);
    }

    // Verify activity status matches event status
    const expectedStatus = mapEventStatusToActivityStatus(testEvent.status);
    if (activity.status !== expectedStatus) {
      console.error(`  ✗ Expected activity status '${expectedStatus}', got '${activity.status}'`);
      passed = false;
    } else {
      console.log(`  ✓ Activity status is '${activity.status}' (mapped from event status '${testEvent.status}')`);
    }

    // Verify activity has questions
    if (!activity.questions || activity.questions.length !== testEvent.questionCount) {
      console.error(`  ✗ Expected ${testEvent.questionCount} questions in activity, got ${activity.questions?.length || 0}`);
      passed = false;
    } else {
      console.log(`  ✓ Activity has ${activity.questions.length} questions`);
    }

    // Verify activity name
    if (activity.name !== testEvent.name) {
      console.error(`  ✗ Expected activity name '${testEvent.name}', got '${activity.name}'`);
      passed = false;
    } else {
      console.log(`  ✓ Activity name is '${activity.name}'`);
    }

    // 3. Check questions reference activityId
    const questionsCommand = new QueryCommand({
      TableName: QUESTIONS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': testEvent.eventId,
      },
    });

    const questionsResult = await docClient.send(questionsCommand);
    const questions = questionsResult.Items || [];

    let questionsWithActivityId = 0;
    for (const question of questions) {
      if (question.activityId === activity.activityId) {
        questionsWithActivityId++;
      }
    }

    if (questionsWithActivityId !== testEvent.questionCount) {
      console.error(`  ✗ Expected ${testEvent.questionCount} questions with activityId, got ${questionsWithActivityId}`);
      passed = false;
    } else {
      console.log(`  ✓ All ${questionsWithActivityId} questions reference activityId`);
    }

    // 4. For live events, check activeActivityId is set
    if (testEvent.status === 'live' || testEvent.status === 'active') {
      if (event.activeActivityId !== activity.activityId) {
        console.error(`  ✗ Expected activeActivityId to be ${activity.activityId}, got ${event.activeActivityId}`);
        passed = false;
      } else {
        console.log(`  ✓ Active activity is set correctly for live event`);
      }
    }
  }

  return passed;
}

function mapEventStatusToActivityStatus(eventStatus: string): string {
  switch (eventStatus) {
    case 'draft':
      return 'draft';
    case 'setup':
      return 'ready';
    case 'live':
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    default:
      return 'draft';
  }
}

async function cleanupTestData(): Promise<void> {
  console.log('\nCleaning up test data...');

  for (const testEvent of testEvents) {
    // Delete activities
    const activitiesCommand = new QueryCommand({
      TableName: ACTIVITIES_TABLE,
      IndexName: 'eventId-order-index',
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': testEvent.eventId,
      },
    });

    const activitiesResult = await docClient.send(activitiesCommand);
    const activities = activitiesResult.Items || [];

    for (const activity of activities) {
      await docClient.send(new DeleteCommand({
        TableName: ACTIVITIES_TABLE,
        Key: { activityId: activity.activityId },
      }));
    }

    // Delete questions
    const questionsCommand = new QueryCommand({
      TableName: QUESTIONS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': testEvent.eventId,
      },
    });

    const questionsResult = await docClient.send(questionsCommand);
    const questions = questionsResult.Items || [];

    for (const question of questions) {
      await docClient.send(new DeleteCommand({
        TableName: QUESTIONS_TABLE,
        Key: { eventId: question.eventId, questionId: question.questionId },
      }));
    }

    // Delete event
    await docClient.send(new DeleteCommand({
      TableName: EVENTS_TABLE,
      Key: { eventId: testEvent.eventId },
    }));

    console.log(`  ✓ Cleaned up ${testEvent.eventId}`);
  }
}

async function createTestData(): Promise<void> {
  console.log('=== Creating Test Data for Migration ===\n');
  console.log(`Events Table: ${EVENTS_TABLE}`);
  console.log(`Questions Table: ${QUESTIONS_TABLE}`);
  console.log(`Activities Table: ${ACTIVITIES_TABLE}`);
  console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS'}\n`);

  try {
    console.log('Creating test events and questions...\n');

    for (const testEvent of testEvents) {
      await createTestEvent(testEvent);
      await createTestQuestions(testEvent.eventId, testEvent.questionCount);
    }

    console.log('\n✓ Test data created successfully');
    console.log('\nNow run the migration:');
    console.log('  npm run migrate:activities -- --yes');
    console.log('\nThen run this script again with --verify flag:');
    console.log('  ts-node scripts/test-data-migration.ts --verify');
  } catch (error) {
    console.error('\n✗ Test data creation failed:', error);
    process.exit(1);
  }
}

async function verifyMigration(): Promise<void> {
  console.log('=== Verifying Data Migration ===\n');

  try {
    let allPassed = true;

    for (const testEvent of testEvents) {
      const passed = await verifyEventMigration(testEvent);
      allPassed = allPassed && passed;
    }

    if (allPassed) {
      console.log('\n✅ All data migration tests passed!');
      console.log('\nTo clean up test data, run:');
      console.log('  ts-node scripts/test-data-migration.ts --cleanup');
    } else {
      console.error('\n✗ Some data migration tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  }
}

async function cleanup(): Promise<void> {
  console.log('=== Cleaning Up Test Data ===\n');

  try {
    await cleanupTestData();
    console.log('\n✓ Cleanup complete');
  } catch (error) {
    console.error('\n✗ Cleanup failed:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--verify')) {
  verifyMigration().catch(console.error);
} else if (args.includes('--cleanup')) {
  cleanup().catch(console.error);
} else {
  createTestData().catch(console.error);
}
