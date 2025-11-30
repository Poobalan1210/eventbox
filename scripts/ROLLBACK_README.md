# Activity Migration Rollback Script

This document describes the rollback script for the Event Activities Platform migration.

## Overview

The `rollback-activity-migration.ts` script reverses the changes made by the activity migration, restoring the database to its pre-migration state. This is useful if issues are discovered after migration or if you need to revert to the original quiz-centric model.

## What the Rollback Does

The rollback script performs the following operations:

1. **Deletes New Tables**
   - Removes the `Activities` table
   - Removes the `PollVotes` table
   - Removes the `RaffleEntries` table

2. **Removes New Fields from Events**
   - Removes the `activeActivityId` field from all events in the `Events` table

3. **Removes New Fields from Questions**
   - Removes the `activityId` field from all questions in the `Questions` table

4. **Optionally Restores from Backup** (if backup file provided)
   - Restores event data from a backup file created during migration
   - Overwrites current event data with pre-migration state

## Usage

### Basic Rollback (Schema Only)

To rollback schema changes without restoring from backup:

```bash
npm run migrate:activities:rollback
```

This will:
- Delete the new tables
- Remove new fields from existing tables
- Preserve current event data (but remove activity-related fields)

### Rollback with Backup Restoration

To rollback and restore events from a backup file:

```bash
npm run migrate:activities:rollback backups/migration-state-2024-01-15T10-30-00-000Z.json
```

This will:
- Delete the new tables
- Remove new fields from existing tables
- Restore events from the specified backup file

### Dry Run (Verify Before Rollback)

To see what would be done without making changes:

```bash
npm run migrate:activities:rollback verify
```

Or with a backup file:

```bash
npm run migrate:activities:rollback verify backups/migration-state-2024-01-15.json
```

### Skip Confirmation Prompt

For automated environments, skip the confirmation prompt:

```bash
npm run migrate:activities:rollback -- --yes
```

Or:

```bash
npm run migrate:activities:rollback backups/migration-state.json --yes
```

## Backup Files

The migration script creates backup files in the `backups/` directory with names like:
- `migration-state-2024-01-15T10-30-00-000Z.json`

These files contain:
- Migration timestamp
- Number of events updated
- Number of activities created
- Number of questions migrated
- List of tables created

To find available backups:

```bash
ls -la backups/migration-state-*.json
```

## Verification

After rollback, the script automatically verifies:

1. **Tables Deleted**: Confirms new tables no longer exist
2. **Fields Removed**: Checks that `activeActivityId` is removed from events
3. **Questions Updated**: Verifies `activityId` is removed from questions

If verification fails, the script will report errors and exit with a non-zero status code.

## Safety Features

### Confirmation Prompt

The script includes a 10-second confirmation prompt before making changes:

```
⚠️  WARNING: This will delete tables and remove fields from existing data.
⚠️  This operation cannot be undone without a backup.

Press Ctrl+C to cancel, or wait 10 seconds to continue...
```

### Dry Run Mode

Always run in dry-run mode first to see what will be changed:

```bash
npm run migrate:activities:rollback verify
```

### Backup Validation

If a backup file is provided, the script validates:
- File exists
- File format is correct
- File contains event data

## Error Handling

The script handles various error scenarios:

### Table Doesn't Exist
If a table to be deleted doesn't exist, the script logs a message and continues:
```
✓ Table Activities does not exist (already deleted)
```

### Field Doesn't Exist
If a field to be removed doesn't exist, the script skips that item:
```
✓ Updated 5 events, skipped 3 (no activeActivityId field)
```

### Backup File Not Found
If the specified backup file doesn't exist, the script lists available backups:
```
✗ Backup file not found: backups/missing.json

Available backups:
  backups/migration-state-2024-01-15T10-30-00-000Z.json
  backups/migration-state-2024-01-14T15-20-00-000Z.json
```

### Partial Failures
If some operations fail, the script continues with remaining operations and reports errors at the end:
```
⚠️  Completed with 2 error(s)
```

## Rollback Report

After completion, the script generates a detailed report:

```
=== Rollback Report ===
Tables deleted: 3
Events updated: 15
Questions updated: 45
Events restored from backup: 15

Changes reverted:
  - Deleted Activities table
  - Deleted PollVotes table
  - Deleted RaffleEntries table
  - Removed activeActivityId from Events
  - Removed activityId from Questions
  - Restored events from backup
```

## Environment Variables

The script respects the following environment variables:

- `AWS_REGION`: AWS region (default: `us-east-1`)
- `DYNAMODB_ENDPOINT`: DynamoDB endpoint for local development
- `EVENTS_TABLE`: Events table name (default: `Events`)
- `QUESTIONS_TABLE`: Questions table name (default: `Questions`)
- `ACTIVITIES_TABLE`: Activities table name (default: `Activities`)
- `POLL_VOTES_TABLE`: Poll votes table name (default: `PollVotes`)
- `RAFFLE_ENTRIES_TABLE`: Raffle entries table name (default: `RaffleEntries`)

## Examples

### Local Development Rollback

```bash
# Set local DynamoDB endpoint
export DYNAMODB_ENDPOINT=http://localhost:8000

# Run rollback
npm run migrate:activities:rollback
```

### Production Rollback with Backup

```bash
# Set production region
export AWS_REGION=us-east-1

# Verify first
npm run migrate:activities:rollback verify backups/migration-state-2024-01-15.json

# Execute rollback
npm run migrate:activities:rollback backups/migration-state-2024-01-15.json
```

### Automated Rollback

```bash
# Skip confirmation for CI/CD
npm run migrate:activities:rollback backups/migration-state.json --yes
```

## Troubleshooting

### "Table does not exist" errors
This is normal if tables were already deleted. The script will continue.

### "Failed to update event" errors
Check DynamoDB permissions and table configuration. The script will report which events failed.

### "Backup file not found" errors
Verify the backup file path is correct. Use absolute paths or paths relative to the project root.

### Verification failures
If verification fails, check:
1. DynamoDB connection is working
2. Tables have correct permissions
3. No concurrent modifications are happening

## Data Integrity

The rollback script preserves data integrity by:

1. **Atomic Operations**: Each table/field operation is independent
2. **Error Reporting**: All errors are logged with details
3. **Verification**: Automatic verification after rollback
4. **Backup Support**: Optional restoration from backup files

## When to Use Rollback

Use the rollback script when:

- Migration caused unexpected issues
- Need to revert to the quiz-centric model
- Testing migration in development/staging
- Discovered data inconsistencies after migration
- Need to re-run migration with fixes

## When NOT to Use Rollback

Do not use rollback if:

- New activities (polls, raffles) have been created
- Users are actively using the new activity features
- Production data has been modified post-migration
- No backup file exists and event data is critical

## Related Scripts

- `migrate-to-activities.ts`: Main migration script
- `verify-migration.ts`: Verification script
- `test-activities-migration.ts`: Migration testing script
- `test-data-migration.ts`: Data migration testing script

## Support

For issues or questions:
1. Check the verification output for specific errors
2. Review the rollback report for operation details
3. Examine DynamoDB logs for permission or connection issues
4. Consult the main migration documentation

## Requirements Validation

This rollback script satisfies **Requirement 8.1**:
- Implements reverse migration capability
- Restores original event structure
- Preserves data integrity during rollback
- Provides verification and error handling
