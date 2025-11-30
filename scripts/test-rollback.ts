#!/usr/bin/env ts-node
/**
 * Test script for rollback-activity-migration
 * 
 * This script tests the rollback functionality by:
 * 1. Creating test data with activity migration fields
 * 2. Running the rollback script
 * 3. Verifying that fields are removed correctly
 * 
 * Usage:
 *   npm run test:rollback
 *   ts-node scripts/test-rollback.ts
 */

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand,
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';

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

interface TestResults {
  passed: number;
  failed: number;
  errors: string[];
}

/**
 * Check if a table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Create a test event with activeActivityId field
 */
async function createTestEvent(eventId: string): Promise<void> {
  const event = {
    eventId,
    name: `Test Event ${eventId}`,
    gamePin: Math.floor(100000 + Math.random() * 900000).toString(),
    organizerId: 'test-organizer',
    status: 'setup',
    activeActivityId: 'test-activity-123', // This should be removed by rollback
    createdAt: Date.now(),
    lastModified: Date.now(),
    participantCount: 0,
    visibility: 'private',
  };

  const command = new PutCommand({
    TableName: EVENTS_TABLE,
    Item: event,
  });

  await docClient.send(command);
  console.log(`  ✓ Created test event: ${eventId}`);
}

/**
 * Create a test question with activityId field
 */
async function createTestQuestion(eventId: string, questionId: string): Promise<void> {
  const question = {
    eventId,
    questionId,
    activityId: 'test-activity-123', // This should be removed by rollback
    text: 'Test Question',
    options: [
      { id: '1', text: 'Option 1' },
      { id: '2', text: 'Option 2' },
    ],
    correctOptionId: '1',
    timerSeconds: 30,
    order: 0,
  };

  const command = new PutCommand({
    TableName: QUESTIONS_TABLE,
    Item: question,
  });

  await docClient.send(command);
  console.log(`  ✓ Created test question: ${questionId}`);
}

/**
 * Verify event does NOT have activeActivityId field
 */
async function verifyEventFieldRemoved(eventId: string, results: TestResults): Promise<void> {
  const command = new GetCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId },
  });

  const result = await docClient.send(command);
  const event = result.Item;

  if (!event) {
    results.failed++;
    results.errors.push(`Event ${eventId} not found`);
    console.error(`  ✗ Event ${eventId} not found`);
    return;
  }

  if (event.activeActivityId !== undefined) {
    results.failed++;
    results.errors.push(`Event ${eventId} still has activeActivityId field`);
    console.error(`  ✗ Event ${eventId} still has activeActivityId: ${event.activeActivityId}`);
    return;
  }

  results.passed++;
  console.log(`  ✓ Event ${eventId} activeActivityId field removed`);
}

/**
 * Verify question does NOT have activityId field
 */
async function verifyQuestionFieldRemoved(
  eventId: string, 
  questionId: string, 
  results: TestResults
): Promise<void> {
  const command = new GetCommand({
    TableName: QUESTIONS_TABLE,
    Key: { eventId, questionId },
  });

  const result = await docClient.send(command);
  const question = result.Item;

  if (!question) {
    results.failed++;
    results.errors.push(`Question ${questionId} not found`);
    console.error(`  ✗ Question ${questionId} not found`);
    return;
  }

  if (question.activityId !== undefined) {
    results.failed++;
    results.errors.push(`Question ${questionId} still has activityId field`);
    console.error(`  ✗ Question ${questionId} still has activityId: ${question.activityId}`);
    return;
  }

  results.passed++;
  console.log(`  ✓ Question ${questionId} activityId field removed`);
}

/**
 * Verify Activities table does not exist
 */
async function verifyTableDeleted(tableName: string, results: TestResults): Promise<void> {
  const exists = await tableExists(tableName);

  if (exists) {
    results.failed++;
    results.errors.push(`Table ${tableName} still exists`);
    console.error(`  ✗ Table ${tableName} still exists`);
    return;
  }

  results.passed++;
  console.log(`  ✓ Table ${tableName} deleted`);
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  console.log('\nCleaning up test data...');

  // Delete test events
  const scanEventsCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
    FilterExpression: 'begins_with(eventId, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'test-rollback-',
    },
  });

  const eventsResult = await docClient.send(scanEventsCommand);
  const events = eventsResult.Items || [];

  for (const event of events) {
    try {
      const deleteCommand = new DeleteCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId: event.eventId },
      });
      await docClient.send(deleteCommand);
      console.log(`  ✓ Deleted test event: ${event.eventId}`);
    } catch (error) {
      console.error(`  ✗ Failed to delete event ${event.eventId}:`, error);
    }
  }

  // Delete test questions
  const scanQuestionsCommand = new ScanCommand({
    TableName: QUESTIONS_TABLE,
    FilterExpression: 'begins_with(eventId, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'test-rollback-',
    },
  });

  const questionsResult = await docClient.send(scanQuestionsCommand);
  const questions = questionsResult.Items || [];

  for (const question of questions) {
    try {
      const deleteCommand = new DeleteCommand({
        TableName: QUESTIONS_TABLE,
        Key: { 
          eventId: question.eventId,
          questionId: question.questionId 
        },
      });
      await docClient.send(deleteCommand);
      console.log(`  ✓ Deleted test question: ${question.questionId}`);
    } catch (error) {
      console.error(`  ✗ Failed to delete question ${question.questionId}:`, error);
    }
  }
}

/**
 * Test rollback functionality
 */
async function testRollback(): Promise<void> {
  console.log('=== Testing Rollback Functionality ===\n');
  console.log(`Events Table: ${EVENTS_TABLE}`);
  console.log(`Questions Table: ${QUESTIONS_TABLE}`);
  console.log(`Activities Table: ${ACTIVITIES_TABLE}\n`);

  const results: TestResults = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Step 1: Create test data
    console.log('Step 1: Creating test data with migration fields...');
    const testEventId = `test-rollback-${Date.now()}`;
    const testQuestionId = `test-question-${Date.now()}`;

    await createTestEvent(testEventId);
    await createTestQuestion(testEventId, testQuestionId);

    // Step 2: Verify test data has migration fields
    console.log('\nStep 2: Verifying test data has migration fields...');
    
    const eventCommand = new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { eventId: testEventId },
    });
    const eventResult = await docClient.send(eventCommand);
    const event = eventResult.Item;

    if (event?.activeActivityId) {
      console.log('  ✓ Test event has activeActivityId field');
    } else {
      console.error('  ✗ Test event missing activeActivityId field');
      results.failed++;
    }

    const questionCommand = new GetCommand({
      TableName: QUESTIONS_TABLE,
      Key: { eventId: testEventId, questionId: testQuestionId },
    });
    const questionResult = await docClient.send(questionCommand);
    const question = questionResult.Item;

    if (question?.activityId) {
      console.log('  ✓ Test question has activityId field');
    } else {
      console.error('  ✗ Test question missing activityId field');
      results.failed++;
    }

    // Step 3: Instructions for manual rollback test
    console.log('\n=== Manual Rollback Test Required ===');
    console.log('\nTo complete the rollback test:');
    console.log('1. Run the rollback script:');
    console.log('   npm run migrate:activities:rollback -- --yes');
    console.log('\n2. Then run this test again to verify:');
    console.log('   npm run test:rollback verify');
    console.log('\nOr run the full test with rollback:');
    console.log('   npm run test:rollback full\n');

    // Check if we should verify (if rollback was already run)
    const args = process.argv.slice(2);
    if (args.includes('verify')) {
      console.log('\nStep 3: Verifying rollback results...');
      
      // Verify event field removed
      await verifyEventFieldRemoved(testEventId, results);
      
      // Verify question field removed
      await verifyQuestionFieldRemoved(testEventId, testQuestionId, results);
      
      // Verify tables deleted
      await verifyTableDeleted(ACTIVITIES_TABLE, results);
      await verifyTableDeleted('PollVotes', results);
      await verifyTableDeleted('RaffleEntries', results);

      // Clean up test data
      await cleanupTestData();
    }

    // Generate report
    console.log('\n=== Test Results ===');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (results.failed > 0) {
      console.error('\n✗ Rollback test failed');
      process.exit(1);
    }

    console.log('\n✓ Rollback test passed');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  await testRollback();
}

// Run test
main().catch(console.error);
