#!/usr/bin/env ts-node
/**
 * Rollback script for event migration
 * 
 * This script restores events from a backup file created during migration.
 * 
 * Usage:
 *   npm run migrate:rollback <backup-file>
 *   ts-node scripts/rollback-migration.ts <backup-file>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';

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

interface Event {
  eventId: string;
  [key: string]: any;
}

/**
 * Rollback migration using backup file
 */
async function rollback(backupFile: string): Promise<void> {
  console.log('=== Migration Rollback ===\n');
  console.log(`Rolling back from backup: ${backupFile}`);
  
  if (!fs.existsSync(backupFile)) {
    console.error(`✗ Backup file not found: ${backupFile}`);
    console.log('\nAvailable backups:');
    const backupDir = backupFile.substring(0, backupFile.lastIndexOf('/'));
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('events-backup-'));
      files.forEach(f => console.log(`  ${backupDir}/${f}`));
    }
    process.exit(1);
  }
  
  const backupData = fs.readFileSync(backupFile, 'utf-8');
  const events = JSON.parse(backupData) as Event[];

  console.log(`Found ${events.length} events in backup\n`);
  
  // Confirmation prompt
  console.log('⚠️  This will restore all events to their pre-migration state.');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  let restored = 0;
  let failed = 0;
  
  for (const event of events) {
    try {
      const command = new PutCommand({
        TableName: EVENTS_TABLE,
        Item: event,
      });

      await docClient.send(command);
      console.log(`✓ Restored event: ${event.eventId} (${event.name || 'Unnamed'})`);
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
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const backupFile = args[0];

  if (!backupFile) {
    console.error('Error: Backup file path required');
    console.log('\nUsage:');
    console.log('  npm run migrate:rollback <backup-file>');
    console.log('  ts-node scripts/rollback-migration.ts <backup-file>');
    console.log('\nExample:');
    console.log('  npm run migrate:rollback backups/events-backup-2024-01-15T10-30-00-000Z.json');
    process.exit(1);
  }

  await rollback(backupFile);
}

// Run rollback
main().catch(console.error);
