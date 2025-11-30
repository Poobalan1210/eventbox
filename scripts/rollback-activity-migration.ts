#!/usr/bin/env ts-node
/**
 * Rollback script for Event Activities Platform migration
 * 
 * This script reverses the activity migration by:
 * 1. Deleting the new tables (Activities, PollVotes, RaffleEntries)
 * 2. Removing activityId field from Questions
 * 3. Removing activeActivityId field from Events
 * 4. Optionally restoring from a backup file
 * 
 * Usage:
 *   npm run migrate:activities:rollback              # Rollback schema changes
 *   npm run migrate:activities:rollback <backup>     # Rollback and restore from backup
 *   ts-node scripts/rollback-activity-migration.ts   # Direct execution
 */

import { 
  DynamoDBClient, 
  DeleteTableCommand,
  DescribeTableCommand,
  waitUntilTableNotExists
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  UpdateCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb';
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

interface RollbackStats {
  tablesDeleted: number;
  eventsUpdated: number;
  questionsUpdated: number;
  eventsRestored: number;
  errors: number;
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
 * Delete a DynamoDB table
 */
async function deleteTable(tableName: string): Promise<boolean> {
  try {
    if (!(await tableExists(tableName))) {
      console.log(`  ✓ Table ${tableName} does not exist (already deleted)`);
      return false;
    }

    console.log(`  Deleting table ${tableName}...`);
    const command = new DeleteTableCommand({ TableName: tableName });
    await client.send(command);
    
    // Wait for table to be deleted
    await waitUntilTableNotExists(
      { client, maxWaitTime: 60, minDelay: 2, maxDelay: 5 },
      { TableName: tableName }
    );
    
    console.log(`  ✓ Deleted table ${tableName}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to delete table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Remove activeActivityId field from all events
 */
async function removeActiveActivityIdFromEvents(): Promise<number> {
  console.log(`\nRemoving activeActivityId field from events in ${EVENTS_TABLE}...`);
  
  try {
    // Scan all events
    const scanCommand = new ScanCommand({
      TableName: EVENTS_TABLE,
    });

    const result = await docClient.send(scanCommand);
    const events = result.Items || [];
    
    console.log(`  Found ${events.length} events to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const event of events) {
      // Skip if activeActivityId doesn't exist
      if (event.activeActivityId === undefined) {
        skipped++;
        continue;
      }
      
      try {
        const updateCommand = new UpdateCommand({
          TableName: EVENTS_TABLE,
          Key: { eventId: event.eventId },
          UpdateExpression: 'REMOVE activeActivityId',
        });

        await docClient.send(updateCommand);
        console.log(`  ✓ Removed activeActivityId from event: ${event.eventId} (${event.name})`);
        updated++;
      } catch (error) {
        console.error(`  ✗ Failed to update event ${event.eventId}:`, error);
        throw error;
      }
    }
    
    console.log(`  ✓ Updated ${updated} events, skipped ${skipped} (no activeActivityId field)`);
    return updated;
  } catch (error) {
    console.error(`  ✗ Failed to remove activeActivityId from events:`, error);
    throw error;
  }
}

/**
 * Remove activityId field from all questions
 */
async function removeActivityIdFromQuestions(): Promise<number> {
  console.log(`\nRemoving activityId field from questions in ${QUESTIONS_TABLE}...`);
  
  try {
    // Scan all questions
    const scanCommand = new ScanCommand({
      TableName: QUESTIONS_TABLE,
    });

    const result = await docClient.send(scanCommand);
    const questions = result.Items || [];
    
    console.log(`  Found ${questions.length} questions to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const question of questions) {
      // Skip if activityId doesn't exist
      if (question.activityId === undefined) {
        skipped++;
        continue;
      }
      
      try {
        const updateCommand = new UpdateCommand({
          TableName: QUESTIONS_TABLE,
          Key: { 
            eventId: question.eventId,
            questionId: question.questionId 
          },
          UpdateExpression: 'REMOVE activityId',
        });

        await docClient.send(updateCommand);
        console.log(`  ✓ Removed activityId from question: ${question.questionId}`);
        updated++;
      } catch (error) {
        console.error(`  ✗ Failed to update question ${question.questionId}:`, error);
        throw error;
      }
    }
    
    console.log(`  ✓ Updated ${updated} questions, skipped ${skipped} (no activityId field)`);
    return updated;
  } catch (error) {
    console.error(`  ✗ Failed to remove activityId from questions:`, error);
    throw error;
  }
}

/**
 * Restore events from backup file
 */
async function restoreFromBackup(backupFile: string): Promise<number> {
  console.log(`\nRestoring events from backup: ${backupFile}`);
  
  if (!fs.existsSync(backupFile)) {
    console.error(`  ✗ Backup file not found: ${backupFile}`);
    console.log('\n  Available backups:');
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('migration-state-') || f.startsWith('events-backup-'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        files.forEach(f => console.log(`    ${path.join(BACKUP_DIR, f)}`));
      } else {
        console.log('    No backup files found');
      }
    }
    throw new Error('Backup file not found');
  }
  
  const backupData = fs.readFileSync(backupFile, 'utf-8');
  const backup = JSON.parse(backupData);
  
  // Handle different backup formats
  let events: any[] = [];
  
  if (Array.isArray(backup)) {
    // Direct array of events
    events = backup;
  } else if (backup.events && Array.isArray(backup.events)) {
    // Backup with events property
    events = backup.events;
  } else {
    console.error('  ✗ Invalid backup file format');
    throw new Error('Invalid backup file format');
  }

  console.log(`  Found ${events.length} events in backup`);
  
  let restored = 0;
  let failed = 0;
  
  for (const event of events) {
    try {
      const command = new PutCommand({
        TableName: EVENTS_TABLE,
        Item: event,
      });

      await docClient.send(command);
      console.log(`  ✓ Restored event: ${event.eventId} (${event.name || 'Unnamed'})`);
      restored++;
    } catch (error) {
      console.error(`  ✗ Failed to restore event ${event.eventId}:`, error);
      failed++;
    }
  }

  if (failed > 0) {
    console.log(`  ⚠️  Restored ${restored} events, failed ${failed}`);
  } else {
    console.log(`  ✓ Successfully restored ${restored} events`);
  }
  
  return restored;
}

/**
 * Verify rollback completion
 */
async function verifyRollback(): Promise<boolean> {
  console.log('\n=== Verifying Rollback ===\n');
  
  let errors = 0;
  
  // Check that new tables are deleted
  console.log('Checking that new tables are deleted...');
  const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
  
  for (const tableName of tables) {
    if (await tableExists(tableName)) {
      console.error(`  ✗ Table ${tableName} still exists`);
      errors++;
    } else {
      console.log(`  ✓ Table ${tableName} deleted`);
    }
  }
  
  // Check that events don't have activeActivityId
  console.log('\nChecking events no longer have activeActivityId...');
  const scanEventsCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
    Limit: 10, // Sample check
  });

  const eventsResult = await docClient.send(scanEventsCommand);
  const events = eventsResult.Items || [];
  
  let eventsWithField = 0;
  for (const event of events) {
    if (event.activeActivityId !== undefined) {
      console.error(`  ✗ Event ${event.eventId} still has activeActivityId field`);
      eventsWithField++;
      errors++;
    }
  }
  
  if (eventsWithField === 0 && events.length > 0) {
    console.log(`  ✓ Checked ${events.length} events, none have activeActivityId field`);
  }

  // Check that questions don't have activityId
  console.log('\nChecking questions no longer have activityId...');
  const scanQuestionsCommand = new ScanCommand({
    TableName: QUESTIONS_TABLE,
    Limit: 10, // Sample check
  });

  const questionsResult = await docClient.send(scanQuestionsCommand);
  const questions = questionsResult.Items || [];
  
  let questionsWithField = 0;
  for (const question of questions) {
    if (question.activityId !== undefined) {
      console.error(`  ✗ Question ${question.questionId} still has activityId field`);
      questionsWithField++;
      errors++;
    }
  }
  
  if (questionsWithField === 0 && questions.length > 0) {
    console.log(`  ✓ Checked ${questions.length} questions, none have activityId field`);
  }
  
  if (errors > 0) {
    console.error(`\n✗ Rollback verification failed with ${errors} error(s)`);
    return false;
  }
  
  console.log('\n✓ Rollback verification passed');
  return true;
}

/**
 * Generate rollback report
 */
function generateReport(stats: RollbackStats): void {
  console.log('\n=== Rollback Report ===');
  console.log(`Tables deleted: ${stats.tablesDeleted}`);
  console.log(`Events updated: ${stats.eventsUpdated}`);
  console.log(`Questions updated: ${stats.questionsUpdated}`);
  
  if (stats.eventsRestored > 0) {
    console.log(`Events restored from backup: ${stats.eventsRestored}`);
  }
  
  if (stats.errors > 0) {
    console.log(`Errors encountered: ${stats.errors}`);
  }
  
  console.log('\nChanges reverted:');
  console.log('  - Deleted Activities table');
  console.log('  - Deleted PollVotes table');
  console.log('  - Deleted RaffleEntries table');
  console.log('  - Removed activeActivityId from Events');
  console.log('  - Removed activityId from Questions');
  
  if (stats.eventsRestored > 0) {
    console.log('  - Restored events from backup');
  }
}

/**
 * Dry run - show what would be done without making changes
 */
async function dryRun(backupFile?: string): Promise<void> {
  console.log('=== Rollback Dry Run ===\n');
  console.log('This will show what would be done without making any changes.\n');
  
  // Check current state
  console.log('Current state:');
  console.log(`  Events table: ${EVENTS_TABLE}`);
  console.log(`  Questions table: ${QUESTIONS_TABLE}`);
  
  const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
  for (const tableName of tables) {
    const exists = await tableExists(tableName);
    console.log(`  ${tableName}: ${exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
  }
  
  // Check events
  const scanEventsCommand = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const eventsResult = await docClient.send(scanEventsCommand);
  const events = eventsResult.Items || [];
  
  const eventsWithField = events.filter(e => e.activeActivityId !== undefined).length;
  
  console.log(`\nEvents analysis:`);
  console.log(`  Total events: ${events.length}`);
  console.log(`  Events with activeActivityId: ${eventsWithField}`);
  
  // Check questions
  const scanQuestionsCommand = new ScanCommand({
    TableName: QUESTIONS_TABLE,
  });

  const questionsResult = await docClient.send(scanQuestionsCommand);
  const questions = questionsResult.Items || [];
  
  const questionsWithField = questions.filter(q => q.activityId !== undefined).length;
  
  console.log(`\nQuestions analysis:`);
  console.log(`  Total questions: ${questions.length}`);
  console.log(`  Questions with activityId: ${questionsWithField}`);
  
  // Check backup file if provided
  if (backupFile) {
    console.log(`\nBackup file: ${backupFile}`);
    if (fs.existsSync(backupFile)) {
      const backupData = fs.readFileSync(backupFile, 'utf-8');
      const backup = JSON.parse(backupData);
      
      let eventCount = 0;
      if (Array.isArray(backup)) {
        eventCount = backup.length;
      } else if (backup.events && Array.isArray(backup.events)) {
        eventCount = backup.events.length;
      }
      
      console.log(`  Backup contains ${eventCount} events`);
    } else {
      console.log(`  ⚠️  Backup file not found`);
    }
  }

  console.log('\nRollback would:');
  console.log(`  1. Delete ${ACTIVITIES_TABLE} table`);
  console.log(`  2. Delete ${POLL_VOTES_TABLE} table`);
  console.log(`  3. Delete ${RAFFLE_ENTRIES_TABLE} table`);
  console.log(`  4. Remove activeActivityId from ${eventsWithField} events`);
  console.log(`  5. Remove activityId from ${questionsWithField} questions`);
  
  if (backupFile) {
    console.log(`  6. Restore events from backup file`);
  }
  
  console.log('\nTo proceed with rollback, run:');
  if (backupFile) {
    console.log(`  npm run migrate:activities:rollback ${backupFile}`);
  } else {
    console.log('  npm run migrate:activities:rollback');
  }
}

/**
 * Main rollback function
 */
async function rollback(backupFile?: string, skipConfirmation: boolean = false): Promise<void> {
  try {
    console.log('=== Event Activities Platform Rollback ===\n');
    console.log(`Events Table: ${EVENTS_TABLE}`);
    console.log(`Questions Table: ${QUESTIONS_TABLE}`);
    console.log(`Activities Table: ${ACTIVITIES_TABLE}`);
    console.log(`Poll Votes Table: ${POLL_VOTES_TABLE}`);
    console.log(`Raffle Entries Table: ${RAFFLE_ENTRIES_TABLE}`);
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Confirmation prompt
    if (!skipConfirmation) {
      console.log('⚠️  WARNING: This will delete tables and remove fields from existing data.');
      console.log('⚠️  This operation cannot be undone without a backup.');
      
      if (backupFile) {
        console.log(`\nBackup file will be used: ${backupFile}`);
      } else {
        console.log('\n⚠️  No backup file provided. Original event data will be lost.');
      }
      
      console.log('\nPress Ctrl+C to cancel, or wait 10 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const stats: RollbackStats = {
      tablesDeleted: 0,
      eventsUpdated: 0,
      questionsUpdated: 0,
      eventsRestored: 0,
      errors: 0,
    };

    // Step 1: Delete new tables
    console.log('\n=== Step 1: Deleting New Tables ===');
    const tables = [ACTIVITIES_TABLE, POLL_VOTES_TABLE, RAFFLE_ENTRIES_TABLE];
    
    for (const tableName of tables) {
      try {
        const deleted = await deleteTable(tableName);
        if (deleted) {
          stats.tablesDeleted++;
        }
      } catch (error) {
        console.error(`Failed to delete table ${tableName}`);
        stats.errors++;
      }
    }

    // Step 2: Remove activeActivityId from events
    console.log('\n=== Step 2: Removing activeActivityId from Events ===');
    try {
      const eventsUpdated = await removeActiveActivityIdFromEvents();
      stats.eventsUpdated = eventsUpdated;
    } catch (error) {
      console.error('Failed to remove activeActivityId from events');
      stats.errors++;
    }

    // Step 3: Remove activityId from questions
    console.log('\n=== Step 3: Removing activityId from Questions ===');
    try {
      const questionsUpdated = await removeActivityIdFromQuestions();
      stats.questionsUpdated = questionsUpdated;
    } catch (error) {
      console.error('Failed to remove activityId from questions');
      stats.errors++;
    }

    // Step 4: Restore from backup if provided
    if (backupFile) {
      console.log('\n=== Step 4: Restoring from Backup ===');
      try {
        const eventsRestored = await restoreFromBackup(backupFile);
        stats.eventsRestored = eventsRestored;
      } catch (error) {
        console.error('Failed to restore from backup');
        stats.errors++;
      }
    }

    // Verify rollback
    const verified = await verifyRollback();

    if (!verified) {
      console.error('\n✗ Rollback verification failed!');
      console.log('Some changes may not have been reverted correctly.');
      process.exit(1);
    }

    // Generate report
    generateReport(stats);

    console.log('\n=== Rollback Complete ===');
    console.log('✓ Successfully rolled back activity migration');
    
    if (stats.errors > 0) {
      console.log(`⚠️  Completed with ${stats.errors} error(s)`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Rollback failed:', error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'verify' || command === 'dry-run') {
    const backupFile = args[1];
    await dryRun(backupFile);
  } else if (command === 'rollback' || !command) {
    const backupFile = args[1] || args[0];
    const skipConfirmation = args.includes('--yes') || args.includes('-y');
    
    // If first arg looks like a flag, no backup file was provided
    const hasBackup = backupFile && !backupFile.startsWith('--');
    
    await rollback(hasBackup ? backupFile : undefined, skipConfirmation);
  } else {
    console.log('Event Activities Platform Rollback Script');
    console.log('\nUsage:');
    console.log('  npm run migrate:activities:rollback              # Rollback without backup');
    console.log('  npm run migrate:activities:rollback <backup>     # Rollback and restore from backup');
    console.log('  npm run migrate:activities:rollback verify       # Dry run (show what would be done)');
    console.log('\nOptions:');
    console.log('  --yes, -y    Skip confirmation prompt');
    console.log('\nExamples:');
    console.log('  npm run migrate:activities:rollback');
    console.log('  npm run migrate:activities:rollback backups/migration-state-2024-01-15.json');
    console.log('  npm run migrate:activities:rollback verify');
    process.exit(0);
  }
}

// Run rollback
main().catch(console.error);
