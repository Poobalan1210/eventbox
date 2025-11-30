# Event Activities Platform Migration

This document describes the database migration for the Event Activities Platform feature.

## Overview

The migration transforms the database schema to support the new event-activities model where:
- Events can contain multiple activities (quizzes, polls, raffles)
- Only one activity can be active at a time
- Participants see the currently active activity

## What the Migration Does

### 1. Schema Changes to Events Table
- Adds `activeActivityId` field to all existing events (initially set to `null`)
- This field tracks which activity is currently active in an event

### 2. Creates New Tables

#### Activities Table
- **Partition Key**: `activityId` (String)
- **Attributes**: `eventId`, `type`, `name`, `status`, `order`, `config`, `createdAt`, `lastModified`
- **GSI**: `eventId-order-index` - Allows querying all activities for an event, ordered by display order

#### PollVotes Table
- **Partition Key**: `voteId` (String)
- **Attributes**: `pollId`, `participantId`, `selectedOptionIds`, `submittedAt`
- **GSI**: `pollId-participantId-index` - Allows querying votes by poll and participant

#### RaffleEntries Table
- **Partition Key**: `entryId` (String)
- **Attributes**: `raffleId`, `participantId`, `participantName`, `enteredAt`
- **GSI**: `raffleId-participantId-index` - Allows querying entries by raffle and participant

## Running the Migration

### Prerequisites
- AWS credentials configured (for production)
- DynamoDB tables exist (Events table must exist)
- Node.js and npm installed

### Commands

#### Dry Run (Recommended First)
```bash
npm run migrate:activities:verify
```
Shows what would be done without making any changes.

#### Run Migration
```bash
npm run migrate:activities
```
Executes the migration with a 5-second confirmation delay.

#### Skip Confirmation (for CI/CD)
```bash
npm run migrate:activities -- --yes
```

#### Rollback Migration
```bash
npm run migrate:activities:rollback
```
Deletes the new tables and removes `activeActivityId` from events.

## Migration Process

1. **Verification Phase**
   - Checks if tables already exist
   - Counts events that need updating
   - Shows what will be done

2. **Table Creation Phase**
   - Creates Activities table with GSI
   - Creates PollVotes table with GSI
   - Creates RaffleEntries table with GSI
   - Waits for tables to become active

3. **Data Update Phase**
   - Scans all events in Events table
   - Adds `activeActivityId: null` to events that don't have it
   - Skips events that already have the field

4. **Verification Phase**
   - Checks all tables exist
   - Samples events to verify field was added
   - Reports any errors

5. **State Saving**
   - Saves migration state to `backups/migration-state-{timestamp}.json`
   - Used for rollback if needed

## Safety Features

### Idempotent
- Can be run multiple times safely
- Skips tables that already exist
- Skips events that already have `activeActivityId`

### Rollback Capability
- Saves migration state before making changes
- Rollback command removes all changes
- Deletes new tables
- Removes `activeActivityId` field from events

### Verification
- Dry run mode shows changes without executing
- Post-migration verification checks data integrity
- Samples events to ensure field was added correctly

## Environment Variables

The migration respects these environment variables:

```bash
AWS_REGION=us-east-1                    # AWS region
DYNAMODB_ENDPOINT=http://localhost:8000 # For local DynamoDB
EVENTS_TABLE=LiveQuizEvents             # Events table name
ACTIVITIES_TABLE=LiveQuizActivities     # Activities table name
POLL_VOTES_TABLE=LiveQuizPollVotes      # Poll votes table name
RAFFLE_ENTRIES_TABLE=LiveQuizRaffleEntries # Raffle entries table name
```

## Local Development

For local development with DynamoDB Local:

```bash
# Start DynamoDB Local
npm run db:start

# Set endpoint for local DynamoDB
export DYNAMODB_ENDPOINT=http://localhost:8000

# Run migration
npm run migrate:activities
```

## Production Deployment

For production deployment:

```bash
# Ensure AWS credentials are configured
aws configure

# Set production environment
export AWS_REGION=us-east-1

# Verify what will be done
npm run migrate:activities:verify

# Run migration
npm run migrate:activities
```

## Troubleshooting

### Table Already Exists Error
If you see "Table already exists", the migration is idempotent and will skip creating that table. This is safe.

### Permission Errors
Ensure your AWS credentials have permissions to:
- CreateTable
- DescribeTable
- DeleteTable (for rollback)
- Scan and UpdateItem on Events table

### Timeout Errors
If table creation times out, increase the `maxWaitTime` in the script or check AWS service health.

### Verification Failures
If verification fails:
1. Check the error messages
2. Verify table structure in AWS Console
3. Run rollback if needed
4. Fix issues and re-run migration

## Migration State File

The migration saves state to `backups/migration-state-{timestamp}.json`:

```json
{
  "timestamp": "2024-01-15T10-30-00-000Z",
  "eventsUpdated": 42,
  "tablesCreated": [
    "LiveQuizActivities",
    "LiveQuizPollVotes",
    "LiveQuizRaffleEntries"
  ]
}
```

This file is used for:
- Tracking what was done
- Rollback reference
- Audit trail

## Next Steps After Migration

After successful migration:

1. **Verify Application Works**
   - Test event creation
   - Test activity management
   - Test participant flow

2. **Monitor Performance**
   - Check DynamoDB metrics
   - Monitor GSI usage
   - Watch for throttling

3. **Data Migration** (if needed)
   - Run data migration script to convert existing quizzes to activities
   - See `scripts/migrate-quiz-data-to-activities.ts` (to be created in task 36)

## Rollback Procedure

If you need to rollback:

```bash
# Run rollback command
npm run migrate:activities:rollback

# Verify rollback
npm run migrate:activities:verify

# Should show tables don't exist and events don't have activeActivityId
```

## Support

For issues or questions:
1. Check this README
2. Review migration logs
3. Check AWS CloudWatch logs
4. Verify DynamoDB table structure in AWS Console
