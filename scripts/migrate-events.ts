#!/usr/bin/env ts-node
/**
 * Database migration script for adding new fields to existing events
 * 
 * This script:
 * 1. Fetches all existing events from DynamoDB
 * 2. Adds default values for new fields (status, visibility, isTemplate, etc.)
 * 3. Calculates participant counts from existing data
 * 4. Updates each event with the new schema
 * 5. Verifies data integrity after migration
 * 6. Provides rollback capability for safety
 * 
 * Usage:
 *   npm run migrate              # Run migration
 *   npm run migrate:rollback <backup-file>  # Rollback to backup
 *   npm run migrate:verify       # Verify migration without making changes
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

const EVENTS_TABLE = process.env.EVENTS_TABLE || 'LiveQuizEvents';
const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE || 'LiveQuizParticipants';
const BACKUP_DIR = path.join(__dirname, '../backups');

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
  templateName?: string;
  lastModified: number;
  startedAt?: number;
  completedAt?: number;
  participantCount: number;
  topic?: string;
  description?: string;
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
 * Save backup of events before migration
 */
function saveBackup(events: OldEvent[]): string {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `events-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(events, null, 2));
  console.log(`✓ Backup saved to: ${backupFile}`);
  return backupFile;
}

/**
 * Fetch all events from DynamoDB
 */
async function getAllEvents(): Promise<OldEvent[]> {
  console.log('Fetching all events from DynamoDB...');
  
  const command = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(command);
  const events = (result.Items as OldEvent[]) || [];
  
  console.log(`✓ Found ${events.length} events`);
  return events;
}

/**
 * Get participant count for an event
 */
async function getParticipantCount(eventId: string): Promise<number> {
  try {
    const command = new QueryCommand({
      TableName: PARTICIPANTS_TABLE,
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': eventId,
      },
      Select: 'COUNT',
    });

    const result = await docClient.send(command);
    return result.Count || 0;
  } catch (error) {
    console.warn(`Warning: Could not fetch participant count for event ${eventId}:`, error);
    return 0;
  }
}

/**
 * Map old status to new status
 */
function mapStatus(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    'waiting': 'setup',
    'active': 'live',
    'completed': 'completed',
  };
  
  return statusMap[oldStatus] || oldStatus;
}

/**
 * Migrate a single event to the new schema
 */
async function migrateEvent(oldEvent: OldEvent): Promise<NewEvent> {
  const now = Date.now();
  const newStatus = mapStatus(oldEvent.status);
  
  // Calculate actual participant count from participants table
  const participantCount = await getParticipantCount(oldEvent.eventId);
  
  const newEvent: NewEvent = {
    ...oldEvent,
    status: newStatus,
    visibility: 'private', // Default to private for existing quizzes
    isTemplate: false,
    lastModified: oldEvent.createdAt || now,
    participantCount: participantCount,
  };

  // Set startedAt for live/completed events
  if (newStatus === 'live' || newStatus === 'completed') {
    newEvent.startedAt = oldEvent.createdAt;
  }

  // Set completedAt for completed events
  if (newStatus === 'completed') {
    newEvent.completedAt = oldEvent.createdAt;
  }

  return newEvent;
}

/**
 * Update an event in DynamoDB
 */
async function updateEvent(event: NewEvent): Promise<void> {
  const command = new PutCommand({
    TableName: EVENTS_TABLE,
    Item: event,
  });

  await docClient.send(command);
}

/**
 * Verify data integrity after migration
 */
async function verifyMigration(migratedEvents: NewEvent[]): Promise<boolean> {
  console.log('\nVerifying data integrity...');
  
  let errors = 0;
  const sampleSize = Math.min(migratedEvents.length, 10);
  const samplesToCheck = migratedEvents.slice(0, sampleSize);
  
  for (const originalEvent of samplesToCheck) {
    const command = new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { eventId: originalEvent.eventId },
    });

    const result = await docClient.send(command);
    const event = result.Item as NewEvent;

    if (!event) {
      console.error(`✗ Event ${originalEvent.eventId} not found after migration`);
      errors++;
      continue;
    }

    // Check that all required new fields exist
    const requiredFields = ['visibility', 'isTemplate', 'lastModified', 'participantCount'];
    for (const field of requiredFields) {
      if (event[field as keyof NewEvent] === undefined) {
        console.error(`✗ Event ${event.eventId} is missing required field: ${field}`);
        errors++;
      }
    }

    // Verify field values are valid
    if (event.visibility !== 'private' && event.visibility !== 'public') {
      console.error(`✗ Event ${event.eventId} has invalid visibility: ${event.visibility}`);
      errors++;
    }

    if (typeof event.isTemplate !== 'boolean') {
      console.error(`✗ Event ${event.eventId} has invalid isTemplate: ${event.isTemplate}`);
      errors++;
    }

    if (typeof event.participantCount !== 'number' || event.participantCount < 0) {
      console.error(`✗ Event ${event.eventId} has invalid participantCount: ${event.participantCount}`);
      errors++;
    }

    // Verify status mapping
    const validStatuses = ['draft', 'setup', 'live', 'completed'];
    if (!validStatuses.includes(event.status)) {
      console.error(`✗ Event ${event.eventId} has invalid status: ${event.status}`);
      errors++;
    }

    // Verify timestamps
    if (event.startedAt && event.startedAt < event.createdAt) {
      console.error(`✗ Event ${event.eventId} has startedAt before createdAt`);
      errors++;
    }

    if (event.completedAt && event.startedAt && event.completedAt < event.startedAt) {
      console.error(`✗ Event ${event.eventId} has completedAt before startedAt`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`✗ Migration verification failed with ${errors} error(s)`);
    return false;
  }

  console.log(`✓ Migration verification passed (checked ${sampleSize} events)`);
  return true;
}

/**
 * Generate migration report
 */
function generateReport(oldEvents: OldEvent[], migratedEvents: NewEvent[]): void {
  console.log('\n=== Migration Report ===');
  console.log(`Total events migrated: ${migratedEvents.length}`);
  
  // Status distribution
  const statusCounts: Record<string, number> = {};
  migratedEvents.forEach(event => {
    statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
  });
  
  console.log('\nStatus distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  // Participant count statistics
  const participantCounts = migratedEvents.map(e => e.participantCount);
  const totalParticipants = participantCounts.reduce((sum, count) => sum + count, 0);
  const avgParticipants = migratedEvents.length > 0 ? totalParticipants / migratedEvents.length : 0;
  const maxParticipants = Math.max(...participantCounts, 0);
  
  console.log('\nParticipant statistics:');
  console.log(`  Total participants: ${totalParticipants}`);
  console.log(`  Average per event: ${avgParticipants.toFixed(2)}`);
  console.log(`  Maximum in one event: ${maxParticipants}`);
  
  // Events with participants
  const eventsWithParticipants = migratedEvents.filter(e => e.participantCount > 0).length;
  console.log(`  Events with participants: ${eventsWithParticipants}`);
  
  console.log('\nNew fields added:');
  console.log('  - visibility (default: private)');
  console.log('  - isTemplate (default: false)');
  console.log('  - lastModified');
  console.log('  - participantCount (calculated from data)');
  console.log('  - startedAt (for live/completed events)');
  console.log('  - completedAt (for completed events)');
  console.log('  - topic (optional)');
  console.log('  - description (optional)');
}

/**
 * Rollback migration using backup file
 */
async function rollback(backupFile: string): Promise<void> {
  console.log('=== Migration Rollback ===\n');
  console.log(`Rolling back from backup: ${backupFile}`);
  
  if (!fs.existsSync(backupFile)) {
    console.error(`✗ Backup file not found: ${backupFile}`);
    process.exit(1);
  }
  
  const backupData = fs.readFileSync(backupFile, 'utf-8');
  const events = JSON.parse(backupData) as OldEvent[];

  console.log(`Found ${events.length} events in backup\n`);
  
  let restored = 0;
  let failed = 0;
  
  for (const event of events) {
    try {
      const command = new PutCommand({
        TableName: EVENTS_TABLE,
        Item: event,
      });

      await docClient.send(command);
      console.log(`✓ Restored event: ${event.eventId} (${event.name})`);
      restored++;
    } catch (error) {
      console.error(`✗ Failed to restore event ${event.eventId}:`, error);
      failed++;
    }
  }

  console.log('\n=== Rollback Complete ===');
  console.log(`✓ Successfully restored: ${restored} events`);
  if (failed > 0) {
    console.log(`✗ Failed to restore: ${failed} events`);
  }
}

/**
 * Dry run - verify what would be migrated without making changes
 */
async function dryRun(): Promise<void> {
  console.log('=== Migration Dry Run ===\n');
  console.log('This will show what would be migrated without making any changes.\n');
  
  const oldEvents = await getAllEvents();
  
  if (oldEvents.length === 0) {
    console.log('No events found. Nothing to migrate.');
    return;
  }
  
  console.log(`Found ${oldEvents.length} events to migrate\n`);
  
  // Show sample of what would be migrated
  const sampleSize = Math.min(oldEvents.length, 5);
  console.log(`Sample of ${sampleSize} events that would be migrated:\n`);
  
  for (let i = 0; i < sampleSize; i++) {
    const oldEvent = oldEvents[i];
    const newEvent = await migrateEvent(oldEvent);
    
    console.log(`Event ${i + 1}:`);
    console.log(`  ID: ${oldEvent.eventId}`);
    console.log(`  Name: ${oldEvent.name}`);
    console.log(`  Old Status: ${oldEvent.status} → New Status: ${newEvent.status}`);
    console.log(`  Participant Count: ${newEvent.participantCount}`);
    console.log(`  Visibility: ${newEvent.visibility}`);
    console.log(`  Is Template: ${newEvent.isTemplate}`);
    console.log(`  Last Modified: ${new Date(newEvent.lastModified).toISOString()}`);
    if (newEvent.startedAt) {
      console.log(`  Started At: ${new Date(newEvent.startedAt).toISOString()}`);
    }
    if (newEvent.completedAt) {
      console.log(`  Completed At: ${new Date(newEvent.completedAt).toISOString()}`);
    }
    console.log('');
  }
  
  // Show status distribution
  const statusCounts: Record<string, number> = {};
  for (const oldEvent of oldEvents) {
    const newStatus = mapStatus(oldEvent.status);
    statusCounts[newStatus] = (statusCounts[newStatus] || 0) + 1;
  }
  
  console.log('Status distribution after migration:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  console.log('\nTo proceed with migration, run:');
  console.log('  npm run migrate');
}

/**
 * Main migration function
 */
async function migrate(skipConfirmation: boolean = false): Promise<void> {
  try {
    console.log('=== Event Schema Migration ===\n');
    console.log(`Events Table: ${EVENTS_TABLE}`);
    console.log(`Participants Table: ${PARTICIPANTS_TABLE}`);
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Fetch all events
    const oldEvents = await getAllEvents();

    if (oldEvents.length === 0) {
      console.log('No events to migrate. Exiting.');
      return;
    }

    console.log(`Found ${oldEvents.length} events to migrate\n`);

    // Confirmation prompt (skip in automated environments)
    if (!skipConfirmation) {
      console.log('⚠️  This will modify all events in the database.');
      console.log('A backup will be created before migration.\n');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Save backup
    const backupFile = saveBackup(oldEvents);

    // Migrate events
    console.log('\nMigrating events...');
    const migratedEvents: NewEvent[] = [];
    let migrated = 0;
    let failed = 0;
    
    for (const oldEvent of oldEvents) {
      try {
        const newEvent = await migrateEvent(oldEvent);
        migratedEvents.push(newEvent);
        await updateEvent(newEvent);
        console.log(`✓ Migrated event: ${newEvent.eventId} (${newEvent.name}) - ${newEvent.participantCount} participants`);
        migrated++;
      } catch (error) {
        console.error(`✗ Failed to migrate event ${oldEvent.eventId}:`, error);
        failed++;
      }
    }

    console.log(`\nMigration progress: ${migrated} succeeded, ${failed} failed`);

    if (failed > 0) {
      console.error('\n⚠️  Some events failed to migrate. Check errors above.');
      console.log('To rollback, run:');
      console.log(`  npm run migrate:rollback ${backupFile}`);
      process.exit(1);
    }

    // Verify migration
    const verified = await verifyMigration(migratedEvents);

    if (!verified) {
      console.error('\n✗ Migration verification failed!');
      console.log('To rollback, run:');
      console.log(`  npm run migrate:rollback ${backupFile}`);
      process.exit(1);
    }

    // Generate report
    generateReport(oldEvents, migratedEvents);

    console.log('\n=== Migration Complete ===');
    console.log(`✓ Successfully migrated ${migratedEvents.length} events`);
    console.log(`✓ Backup saved to: ${backupFile}`);
    console.log('\nTo rollback if needed, run:');
    console.log(`  npm run migrate:rollback ${backupFile}`);
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
    const backupFile = args[1];
    if (!backupFile) {
      console.error('Error: Backup file path required for rollback');
      console.log('Usage: npm run migrate:rollback <backup-file>');
      console.log('   or: ts-node scripts/migrate-events.ts rollback <backup-file>');
      process.exit(1);
    }
    await rollback(backupFile);
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
