# Event Migration Script

This directory contains the migration script for updating existing events with new schema fields required for the organizer UX improvements.

## What Gets Migrated

The migration adds the following new fields to existing events:

- `status`: Maps old status values to new workflow states (draft/setup/live/completed)
- `visibility`: Privacy setting (defaults to 'private')
- `isTemplate`: Whether the event is a template (defaults to false)
- `lastModified`: Timestamp of last modification
- `startedAt`: When the quiz was started (for live/completed events)
- `completedAt`: When the quiz was completed (for completed events)
- `participantCount`: Number of participants (calculated from participants table)
- `topic`: Quiz topic (optional)
- `description`: Quiz description (optional)

## Status Mapping

Old status values are mapped to new values:

- `waiting` → `setup`
- `active` → `live`
- `completed` → `completed`

## Running the Migration

### Prerequisites

1. Ensure you have AWS credentials configured
2. Set the appropriate environment variables:
   ```bash
   export AWS_REGION=us-east-1
   export EVENTS_TABLE=LiveQuizEvents
   export PARTICIPANTS_TABLE=LiveQuizParticipants
   ```

### Dry Run (Recommended First Step)

Before running the actual migration, perform a dry run to see what would be changed:

```bash
npm run migrate:verify
```

This will:
- Show how many events would be migrated
- Display a sample of events with their new field values
- Show the status distribution after migration
- Not make any changes to the database

### Local Development

For local DynamoDB:

```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
npm run migrate
```

### Production

For production AWS DynamoDB:

```bash
# Make sure AWS credentials are configured
npm run migrate
```

The migration will:
1. Wait 5 seconds for confirmation (press Ctrl+C to cancel)
2. Create a backup before making changes
3. Migrate all events
4. Verify data integrity
5. Generate a detailed report

To skip the confirmation prompt (for automated deployments):

```bash
npm run migrate -- --yes
```

## Backup and Rollback

The migration automatically creates a backup before making changes. Backups are stored in the `backups/` directory with timestamps.

### Rollback

If you need to rollback the migration:

```bash
npm run migrate:rollback backups/events-backup-<timestamp>.json
```

Example:
```bash
npm run migrate:rollback backups/events-backup-2024-01-15T10-30-00-000Z.json
```

The rollback will:
1. Wait 5 seconds for confirmation
2. Restore all events from the backup
3. Report success/failure for each event

## Safety Features

1. **Automatic Backup**: Creates a JSON backup of all events before migration
2. **Dry Run Mode**: Preview changes without modifying data
3. **Participant Count Calculation**: Accurately counts participants from the participants table
4. **Data Integrity Verification**: Comprehensive checks after migration including:
   - All required fields exist
   - Field values are valid (correct types and ranges)
   - Status values are valid
   - Timestamps are logically consistent
5. **Rollback Support**: Can restore from backup if needed
6. **Detailed Reporting**: Shows migration statistics and participant data
7. **Error Handling**: Continues migration even if individual events fail
8. **Idempotent**: Safe to run multiple times (won't duplicate data)

## Migration Process

1. Fetches all events from DynamoDB
2. Creates a timestamped backup file
3. For each event:
   - Maps old status to new status
   - Queries participants table for accurate count
   - Sets default values for new fields
   - Updates timestamps based on status
4. Updates events in DynamoDB
5. Verifies data integrity on a sample of events
6. Generates detailed migration report
7. Provides rollback instructions

## Migration Report

After successful migration, you'll see a detailed report including:

- Total events migrated
- Status distribution (draft/setup/live/completed)
- Participant statistics:
  - Total participants across all events
  - Average participants per event
  - Maximum participants in a single event
  - Number of events with participants
- List of new fields added

## Data Integrity Verification

The migration verifies:

- ✓ All events exist after migration
- ✓ All required new fields are present
- ✓ Visibility is either 'private' or 'public'
- ✓ isTemplate is a boolean
- ✓ participantCount is a non-negative number
- ✓ Status is one of: draft, setup, live, completed
- ✓ startedAt is not before createdAt
- ✓ completedAt is not before startedAt

## Troubleshooting

### Migration Fails

If the migration fails:

1. Check the error message for details
2. Verify your AWS credentials and permissions
3. Check that the table names are correct
4. Ensure both Events and Participants tables are accessible
5. Use the rollback command to restore from backup

### Verification Fails

If verification fails after migration:

1. The script will automatically suggest rollback
2. Review the verification errors in the output
3. Fix any issues and re-run the migration
4. The backup is preserved for safety

### Participant Count Issues

If participant counts seem incorrect:

1. Verify the PARTICIPANTS_TABLE environment variable is correct
2. Check that the participants table is accessible
3. The script will log warnings if it can't fetch participant counts
4. Participant counts default to 0 if the query fails

## Testing

Before running in production:

1. **Test on development/staging first**
2. Run `npm run migrate:verify` to preview changes
3. Verify the backup file is created correctly
4. Test the rollback process with a backup
5. Check that all events have the new fields
6. Verify participant counts are accurate
7. Test that the application works with migrated data

## Notes

- The migration is designed to be backward compatible
- Existing fields are preserved
- New fields have sensible defaults
- The migration can be run multiple times safely
- Participant counts are calculated from actual data, not estimated
- The migration handles errors gracefully and continues processing
- All timestamps are in milliseconds since epoch
- Backups are stored as JSON for easy inspection and manual recovery if needed

## Commands Reference

```bash
# Preview what would be migrated (no changes)
npm run migrate:verify

# Run the migration (with confirmation prompt)
npm run migrate

# Run the migration (skip confirmation)
npm run migrate -- --yes

# Rollback to a backup
npm run migrate:rollback <backup-file>

# Alternative commands using ts-node directly
ts-node scripts/migrate-events.ts verify
ts-node scripts/migrate-events.ts migrate
ts-node scripts/rollback-migration.ts <backup-file>
```

## Infrastructure Updates

The migration also requires infrastructure updates to add Global Secondary Indexes (GSIs):

- `organizerId-index`: For querying all events by organizer
- `organizerId-status-index`: For querying events by organizer and status

These indexes are defined in `infrastructure/lib/live-quiz-event-stack.ts` and will be created when you deploy the infrastructure.
