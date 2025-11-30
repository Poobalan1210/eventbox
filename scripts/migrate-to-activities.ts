#!/usr/bin/env ts-node
/**
 * Database migration script for Event Activities Platform
 * 
 * This script migrates the database schema to support the new event-activities model:
 * 1. Adds activeActivityId field to Events table
 * 2. Creates Activities table with GSI for event-activity lookups
 * 3. Creates PollVotes table with GSI for poll-participant lookups
 * 4. Creates RaffleEntries table with GSI for raffle-participant lookups
 * 
 * The script uses DynamoDB's flexible schema, so adding fields to existing items
 * is done through updates rather than ALTER TABLE commands.
 * 
 * Usage:
 *   npm run migrate:activities              # Run migration
 *   npm run migrate:activities:verify       # Verify migration without making changes
 *   npm run migrate:activities:rollback     # Rollback migration
 */

import { 
  DynamoDBClient, 
  CreateTableCommand, 
  DescribeTableCommand,
  DeleteTableCommand,
  waitUntilTableExists,
  waitUntilTableNotExists
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  UpdateCommand,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Configure DynamoDB client
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

// Table names - use environment variables or defaults
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'Events';
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || 'Questions';
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE || 'Activities';
const POLL_VOTES_TABLE = process.env.POLL_VOTES_TABLE || 'PollVotes';
const RAFFLE_ENTRIES_TABLE = process.env.RAFFLE_ENTRIES_TABLE || 'RaffleEntries';

const BACKUP_DIR = path.join(__dirname, '../backups');

interface MigrationState {
  timestamp: string;
  eventsUpdated: number;
  tablesCreated: string[];
  activitiesCreated: number;
  questionsMigrated: number;
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Save migration state for rollback
 */
function saveMigrationState(state: MigrationState): string {
  ensureBackupDir();
  const stateFile = path.join(BACKUP_DIR, `migration-state-${state.timestamp}.json`);
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`✓ Migration state saved to: ${stateFile}`);
  return stateFile;
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
 * Create Activities table
 */
async function createActivitiesTable(): Promise<void> {
  console.log(`\nCreating ${ACTIVITIES_TABLE} table...`);
  
  if (await tableExists(ACTIVITIES_TABLE)) {
    console.log(`✓ Table ${ACTIVITIES_TABLE} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: ACTIVITIES_TABLE,
    KeySchema: [
      { AttributeName: 'activityId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'activityId', AttributeType: 'S' },
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'order', AttributeType: 'N' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'eventId-order-index',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: 'HASH' },
          { AttributeName: 'order', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: {
      StreamEnabled: false,
    },
  });

  await client.send(command);
  
  // Wait for table to be active
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: ACTIVITIES_TABLE }
  );
  
  console.log(`✓ Created ${ACTIVITIES_TABLE} table with eventId-order-index GSI`);
}

/**
 * Create PollVotes table
 */
async function createPollVotesTable(): Promise<void> {
  console.log(`\nCreating ${POLL_VOTES_TABLE} table...`);
  
  if (await tableExists(POLL_VOTES_TABLE)) {
    console.log(`✓ Table ${POLL_VOTES_TABLE} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: POLL_VOTES_TABLE,
    KeySchema: [
      { AttributeName: 'voteId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'voteId', AttributeType: 'S' },
      { AttributeName: 'pollId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'pollId-participantId-index',
        KeySchema: [
          { AttributeName: 'pollId', KeyType: 'HASH' },
          { AttributeName: 'participantId', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: {
      StreamEnabled: false,
    },
  });

  await client.send(command);
  
  // Wait for table to be active
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: POLL_VOTES_TABLE }
  );
  
  console.log(`✓ Created ${POLL_VOTES_TABLE} table with pollId-participantId-index GSI`);
}

/**
 * Create RaffleEntries table
 */
async function createRaffleEntriesTable(): Promise<void> {
  console.log(`\nCreating ${RAFFLE_ENTRIES_TABLE} table...`);
  
  if (await tableExists(RAFFLE_ENTRIES_TABLE)) {
    console.log(`✓ Table ${RAFFLE_ENTRIES_TABLE} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: RAFFLE_ENTRIES_TABLE,
    KeySchema: [
      { AttributeName: 'entryId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'entryId', AttributeType: 'S' },
      { AttributeName: 'raffleId', AttributeType: 'S' },
      { AttributeName: 'participantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'raffleId-participantId-index',
        KeySchema: [
          { AttributeName: 'raffleId', KeyType: 'HASH' },
          { AttributeName: 'participantId', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: {
      StreamEnabled: false,
    },
  });

  await client.send(command);
  
  // Wait for table to be active
  await waitUntilTableExists(
    { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
    { TableName: RAFFLE_ENTRIES_TABLE }
  );
  
  console.log(`✓ Created ${RAFFLE_ENTRIES_TABLE} table with raffleId-participantId-index GSI`);
}

/**
 * Map event status to activity status
 */
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

/**
 * Create a QuizActivity for each existing event
 */
async function migrateEventsToActivities(): Promise<{ activitiesCreated: number; questionsMigrated: number }> {
  console.log(`\nMigrating events to activities...`);
  
  // Scan all events
  const scanCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(scanCommand);
  const events = result.Items || [];
  
  console.log(`Found ${events.length} events to migrate`);
  
  let activitiesCreated = 0;
  let questionsMigrated = 0;
  let skipped = 0;
  
  for (const event of events) {
    try {
      // Check if this event already has activities
      const existingActivitiesCommand = new QueryCommand({
        TableName: ACTIVITIES_TABLE,
        IndexName: 'eventId-order-index',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': event.eventId,
        },
      });

      const existingActivitiesResult = await docClient.send(existingActivitiesCommand);
      const existingActivities = existingActivitiesResult.Items || [];

      if (existingActivities.length > 0) {
        console.log(`  ⊙ Event ${event.eventId} already has ${existingActivities.length} activities, skipping`);
        skipped++;
        continue;
      }

      // Get all questions for this event
      const questionsCommand = new QueryCommand({
        TableName: QUESTIONS_TABLE,
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': event.eventId,
        },
      });

      const questionsResult = await docClient.send(questionsCommand);
      const questions = (questionsResult.Items || []).sort((a, b) => a.order - b.order);

      // Create a QuizActivity for this event
      const activityId = randomUUID();
      const activityStatus = mapEventStatusToActivityStatus(event.status);
      
      const quizActivity = {
        activityId,
        eventId: event.eventId,
        type: 'quiz',
        name: event.name || 'Quiz',
        status: activityStatus,
        order: 0,
        createdAt: event.createdAt || Date.now(),
        lastModified: event.lastModified || Date.now(),
        questions: questions.map(q => ({
          questionId: q.questionId,
          id: q.questionId,
          eventId: q.eventId,
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options,
          correctOptionId: q.correctOptionId,
          timerSeconds: q.timerSeconds,
          order: q.order,
        })),
        currentQuestionIndex: event.currentQuestionIndex || 0,
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      };

      // Save the activity
      const putActivityCommand = new PutCommand({
        TableName: ACTIVITIES_TABLE,
        Item: quizActivity,
      });

      await docClient.send(putActivityCommand);
      console.log(`  ✓ Created QuizActivity for event ${event.eventId} (${event.name}) with ${questions.length} questions`);
      activitiesCreated++;

      // Update questions to reference the activityId
      for (const question of questions) {
        const updateQuestionCommand = new UpdateCommand({
          TableName: QUESTIONS_TABLE,
          Key: {
            eventId: question.eventId,
            questionId: question.questionId,
          },
          UpdateExpression: 'SET activityId = :activityId',
          ExpressionAttributeValues: {
            ':activityId': activityId,
          },
        });

        await docClient.send(updateQuestionCommand);
        questionsMigrated++;
      }

      // If the event was live/active, set this activity as the active one
      if (event.status === 'live' || event.status === 'active') {
        const updateEventCommand = new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId: event.eventId },
          UpdateExpression: 'SET activeActivityId = :activityId',
          ExpressionAttributeValues: {
            ':activityId': activityId,
          },
        });

        await docClient.send(updateEventCommand);
        console.log(`    → Set as active activity for event ${event.eventId}`);
      }

    } catch (error) {
      console.error(`  ✗ Failed to migrate event ${event.eventId}:`, error);
    }
  }
  
  console.log(`\n✓ Created ${activitiesCreated} activities, migrated ${questionsMigrated} questions, skipped ${skipped} events`);
  return { activitiesCreated, questionsMigrated };
}

/**
 * Add activeActivityId field to all events
 */
async function addActiveActivityIdToEvents(): Promise<number> {
  console.log(`\nAdding activeActivityId field to events in ${EVENTS_TABLE}...`);
  
  // Scan all events
  const scanCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(scanCommand);
  const events = result.Items || [];
  
  console.log(`Found ${events.length} events to update`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const event of events) {
    // Skip if activeActivityId already exists
    if (event.activeActivityId !== undefined) {
      skipped++;
      continue;
    }
    
    try {
      const updateCommand = new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId: event.eventId },
        UpdateExpression: 'SET activeActivityId = :null',
        ExpressionAttributeValues: {
          ':null': null,
        },
      });

      await docClient.send(updateCommand);
      console.log(`✓ Updated event: ${event.eventId} (${event.name})`);
      updated++;
    } catch (error) {
      console.error(`✗ Failed to update event ${event.eventId}:`, error);
    }
  }
  
  console.log(`\n✓ Updated ${updated} events, skipped ${skipped} (already had activeActivityId)`);
  return updated;
}

/**
 * Verify migration
 */
async function verifyMigration(): Promise<boolean> {
  console.log('\n=== Verifying Migration ===\n');
  
  let errors = 0;
  
  // Check that all tables exist
  console.log('Checking table existence...');
  const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
  
  for (const tableName of tables) {
    if (await tableExists(tableName)) {
      console.log(`✓ Table ${tableName} exists`);
    } else {
      console.error(`✗ Table ${tableName} does not exist`);
      errors++;
    }
  }
  
  // Check that events have activeActivityId field
  console.log('\nChecking events have activeActivityId field...');
  const scanEventsCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const eventsResult = await docClient.send(scanEventsCommand);
  const events = eventsResult.Items || [];
  
  for (const event of events) {
    if (event.activeActivityId === undefined) {
      console.error(`✗ Event ${event.eventId} missing activeActivityId field`);
      errors++;
    }
  }
  
  if (events.length > 0) {
    console.log(`✓ Checked ${events.length} events, all have activeActivityId field`);
  }

  // Check that activities were created for events
  console.log('\nChecking activities were created...');
  const scanActivitiesCommand = new ScanCommand({
    TableName: ACTIVITIES_TABLE,
  });

  const activitiesResult = await docClient.send(scanActivitiesCommand);
  const activities = activitiesResult.Items || [];
  
  console.log(`✓ Found ${activities.length} activities`);

  // Verify each event has at least one activity
  let eventsWithoutActivities = 0;
  for (const event of events) {
    const eventActivities = activities.filter(a => a.eventId === event.eventId);
    if (eventActivities.length === 0) {
      console.error(`✗ Event ${event.eventId} has no activities`);
      eventsWithoutActivities++;
      errors++;
    }
  }

  if (eventsWithoutActivities === 0 && events.length > 0) {
    console.log(`✓ All ${events.length} events have activities`);
  }

  // Check that questions reference activityId
  console.log('\nChecking questions reference activityId...');
  const scanQuestionsCommand = new ScanCommand({
    TableName: QUESTIONS_TABLE,
    Limit: 10, // Sample check
  });

  const questionsResult = await docClient.send(scanQuestionsCommand);
  const questions = questionsResult.Items || [];
  
  let questionsWithoutActivityId = 0;
  for (const question of questions) {
    if (!question.activityId) {
      console.error(`✗ Question ${question.questionId} missing activityId field`);
      questionsWithoutActivityId++;
      errors++;
    }
  }

  if (questionsWithoutActivityId === 0 && questions.length > 0) {
    console.log(`✓ Checked ${questions.length} questions, all have activityId field`);
  }
  
  if (errors > 0) {
    console.error(`\n✗ Migration verification failed with ${errors} error(s)`);
    return false;
  }
  
  console.log('\n✓ Migration verification passed');
  return true;
}

/**
 * Rollback migration
 */
async function rollback(): Promise<void> {
  console.log('=== Migration Rollback ===\n');
  console.log('⚠️  This will delete the new tables and remove activeActivityId from events');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete new tables
  const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
  
  for (const tableName of tables) {
    try {
      if (await tableExists(tableName)) {
        console.log(`Deleting table ${tableName}...`);
        const command = new DeleteTableCommand({ TableName: tableName });
        await client.send(command);
        
        // Wait for table to be deleted
        await waitUntilTableNotExists(
          { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
          { TableName: tableName }
        );
        
        console.log(`✓ Deleted table ${tableName}`);
      } else {
        console.log(`✓ Table ${tableName} does not exist (already deleted)`);
      }
    } catch (error) {
      console.error(`✗ Failed to delete table ${tableName}:`, error);
    }
  }
  
  // Remove activeActivityId from events
  console.log('\nRemoving activeActivityId from events...');
  const scanCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(scanCommand);
  const events = result.Items || [];
  
  let removed = 0;
  
  for (const event of events) {
    if (event.activeActivityId !== undefined) {
      try {
        const updateCommand = new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId: event.eventId },
          UpdateExpression: 'REMOVE activeActivityId',
        });

        await docClient.send(updateCommand);
        console.log(`✓ Removed activeActivityId from event: ${event.eventId}`);
        removed++;
      } catch (error) {
        console.error(`✗ Failed to update event ${event.eventId}:`, error);
      }
    }
  }
  
  console.log(`\n✓ Removed activeActivityId from ${removed} events`);
  console.log('\n=== Rollback Complete ===');
}

/**
 * Dry run - show what would be done without making changes
 */
async function dryRun(): Promise<void> {
  console.log('=== Migration Dry Run ===\n');
  console.log('This will show what would be done without making any changes.\n');
  
  // Check current state
  console.log('Current state:');
  console.log(`  Events table: ${EVENTS_TABLE}`);
  
  const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
  for (const tableName of tables) {
    const exists = await tableExists(tableName);
    console.log(`  ${tableName}: ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
  }
  
  // Check events
  const scanCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(scanCommand);
  const events = result.Items || [];
  
  const eventsWithoutField = events.filter(e => e.activeActivityId === undefined).length;
  const eventsWithField = events.filter(e => e.activeActivityId !== undefined).length;
  
  console.log(`\nEvents analysis:`);
  console.log(`  Total events: ${events.length}`);
  console.log(`  Events without activeActivityId: ${eventsWithoutField}`);
  console.log(`  Events with activeActivityId: ${eventsWithField}`);
  
  // Check questions
  const scanQuestionsCommand = new ScanCommand({
    TableName: QUESTIONS_TABLE,
  });

  const questionsResult = await docClient.send(scanQuestionsCommand);
  const questions = questionsResult.Items || [];
  
  console.log(`\nQuestions analysis:`);
  console.log(`  Total questions: ${questions.length}`);

  console.log('\nMigration would:');
  console.log(`  1. Create ${ACTIVITIES_TABLE} table with eventId-order-index GSI`);
  console.log(`  2. Create ${POLL_VOTES_TABLE} table with pollId-participantId-index GSI`);
  console.log(`  3. Create ${RAFFLE_ENTRIES_TABLE} table with raffleId-participantId-index GSI`);
  console.log(`  4. Add activeActivityId field to ${eventsWithoutField} events`);
  console.log(`  5. Create QuizActivity for each of ${events.length} events`);
  console.log(`  6. Migrate ${questions.length} questions to reference activityId`);
  console.log(`  7. Set active activity for live/active events`);
  
  console.log('\nTo proceed with migration, run:');
  console.log('  npm run migrate:activities');
}

/**
 * Main migration function
 */
async function migrate(skipConfirmation: boolean = false): Promise<void> {
  try {
    console.log('=== Event Activities Platform Migration ===\n');
    console.log(`Events Table: ${EVENTS_TABLE}`);
    console.log(`Activities Table: ${ACTIVITIES_TABLE}`);
    console.log(`Poll Votes Table: ${POLL_VOTES_TABLE}`);
    console.log(`Raffle Entries Table: ${RAFFLE_ENTRIES_TABLE}`);
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Confirmation prompt
    if (!skipConfirmation) {
      console.log('⚠️  This will create new tables and modify existing events.');
      console.log('Migration state will be saved for rollback capability.\n');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const migrationState: MigrationState = {
      timestamp,
      eventsUpdated: 0,
      tablesCreated: [],
      activitiesCreated: 0,
      questionsMigrated: 0,
    };

    // Step 1: Create Activities table
    await createActivitiesTable();
    migrationState.tablesCreated.push(ACTIVITIES_TABLE);

    // Step 2: Create PollVotes table
    await createPollVotesTable();
    migrationState.tablesCreated.push(POLL_VOTES_TABLE);

    // Step 3: Create RaffleEntries table
    await createRaffleEntriesTable();
    migrationState.tablesCreated.push(RAFFLE_ENTRIES_TABLE);

    // Step 4: Add activeActivityId to events
    const eventsUpdated = await addActiveActivityIdToEvents();
    migrationState.eventsUpdated = eventsUpdated;

    // Step 5: Migrate existing events to activities
    const { activitiesCreated, questionsMigrated } = await migrateEventsToActivities();
    migrationState.activitiesCreated = activitiesCreated;
    migrationState.questionsMigrated = questionsMigrated;

    // Save migration state
    const stateFile = saveMigrationState(migrationState);

    // Verify migration
    const verified = await verifyMigration();

    if (!verified) {
      console.error('\n✗ Migration verification failed!');
      console.log('To rollback, run:');
      console.log('  npm run migrate:activities:rollback');
      process.exit(1);
    }

    console.log('\n=== Migration Complete ===');
    console.log(`✓ Created ${migrationState.tablesCreated.length} tables`);
    console.log(`✓ Updated ${migrationState.eventsUpdated} events`);
    console.log(`✓ Created ${migrationState.activitiesCreated} activities`);
    console.log(`✓ Migrated ${migrationState.questionsMigrated} questions`);
    console.log(`✓ Migration state saved to: ${stateFile}`);
    console.log('\nTo rollback if needed, run:');
    console.log('  npm run migrate:activities:rollback');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'rollback') {
    await rollback();
  } else if (command === 'verify' || command === 'dry-run') {
    await dryRun();
  } else if (command === 'migrate') {
    const skipConfirmation = args.includes('--yes') || args.includes('-y');
    await migrate(skipConfirmation);
  } else {
    // Default to migration
    const skipConfirmation = args.includes('--yes') || args.includes('-y');
    await migrate(skipConfirmation);
  }
}

// Run migration
main().catch(console.error);
