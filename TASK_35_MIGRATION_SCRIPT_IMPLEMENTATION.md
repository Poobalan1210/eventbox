# Task 35: Database Migration Script Implementation

## Summary

Successfully implemented the database migration script for the Event Activities Platform. The migration adds support for the new event-activities model by creating necessary tables and updating the Events table schema.

## What Was Implemented

### 1. Migration Script (`scripts/migrate-to-activities.ts`)

A comprehensive migration script that:
- **Adds `activeActivityId` field** to all existing events (set to `null` initially)
- **Creates Activities table** with `eventId-order-index` GSI for querying activities by event
- **Creates PollVotes table** with `pollId-participantId-index` GSI for querying votes
- **Creates RaffleEntries table** with `raffleId-participantId-index` GSI for querying entries

### 2. Key Features

#### Idempotent Design
- Can be run multiple times safely
- Skips tables that already exist
- Skips events that already have `activeActivityId` field

#### Safety Features
- **Dry run mode**: Shows what would be done without making changes
- **Confirmation prompt**: 5-second delay before executing (can be skipped with `--yes`)
- **Migration state tracking**: Saves state to `backups/migration-state-{timestamp}.json`
- **Automatic verification**: Checks data integrity after migration
- **Rollback capability**: Can undo all changes if needed

#### Environment-Aware
- Respects environment variables for table names
- Works with both local DynamoDB and AWS
- Defaults to simple names for local development

### 3. Table Structures

#### Activities Table
```
Partition Key: activityId (String)
Attributes: eventId, type, name, status, order, config, createdAt, lastModified
GSI: eventId-order-index
  - Partition Key: eventId
  - Sort Key: order
```

#### PollVotes Table
```
Partition Key: voteId (String)
Attributes: pollId, participantId, selectedOptionIds, submittedAt
GSI: pollId-participantId-index
  - Partition Key: pollId
  - Sort Key: participantId
```

#### RaffleEntries Table
```
Partition Key: entryId (String)
Attributes: raffleId, participantId, participantName, enteredAt
GSI: raffleId-participantId-index
  - Partition Key: raffleId
  - Sort Key: participantId
```

### 4. NPM Scripts

Added convenient npm scripts:
```bash
npm run migrate:activities              # Run migration
npm run migrate:activities:verify       # Dry run (show what would be done)
npm run migrate:activities:rollback     # Rollback migration
npm run test:activities-migration       # Test migration with sample data
```

### 5. Documentation

Created comprehensive documentation:
- **`scripts/ACTIVITIES_MIGRATION_README.md`**: Complete migration guide
  - Overview of changes
  - Running instructions
  - Safety features
  - Troubleshooting
  - Rollback procedures
  - Environment variables
  - Local and production deployment

### 6. Testing

Created test script (`scripts/test-activities-migration.ts`):
- Creates test events
- Verifies migration adds `activeActivityId` field
- Validates data integrity
- Reports cleanup information

## Testing Results

### Local Testing (DynamoDB Local)

✅ **Dry Run Test**
- Successfully showed current state
- Correctly identified tables to create
- Counted events needing updates

✅ **Migration Test**
- Created Activities table with GSI
- Created PollVotes table with GSI
- Created RaffleEntries table with GSI
- Added `activeActivityId` field to 3 test events
- Verification passed

✅ **Rollback Test**
- Successfully deleted all new tables
- Removed `activeActivityId` field from events
- System returned to pre-migration state

✅ **Re-migration Test**
- Successfully re-ran migration after rollback
- All tables recreated correctly
- All GSIs configured properly

✅ **Data Integrity Test**
- Created 3 test events
- Ran migration
- Verified all events have `activeActivityId: null`
- All tests passed

## Files Created/Modified

### Created Files
1. `scripts/migrate-to-activities.ts` - Main migration script
2. `scripts/ACTIVITIES_MIGRATION_README.md` - Comprehensive documentation
3. `scripts/test-activities-migration.ts` - Test script
4. `scripts/tsconfig.json` - TypeScript configuration for scripts
5. `TASK_35_MIGRATION_SCRIPT_IMPLEMENTATION.md` - This summary

### Modified Files
1. `package.json` - Added migration npm scripts

## Migration Process

### Phase 1: Table Creation
1. Check if Activities table exists, create if not
2. Check if PollVotes table exists, create if not
3. Check if RaffleEntries table exists, create if not
4. Wait for all tables to become active

### Phase 2: Data Update
1. Scan all events in Events table
2. For each event without `activeActivityId`:
   - Add `activeActivityId: null` field
   - Log success/failure

### Phase 3: Verification
1. Verify all tables exist
2. Sample events to check `activeActivityId` field
3. Report any errors

### Phase 4: State Saving
1. Save migration state to backup file
2. Include timestamp, tables created, events updated

## Usage Examples

### Local Development
```bash
# Start DynamoDB Local
npm run db:start

# Set endpoint
export DYNAMODB_ENDPOINT=http://localhost:8000

# Verify what will be done
npm run migrate:activities:verify

# Run migration
npm run migrate:activities

# Or skip confirmation
npm run migrate:activities -- --yes
```

### Production Deployment
```bash
# Ensure AWS credentials configured
aws configure

# Set region
export AWS_REGION=us-east-1

# Verify
npm run migrate:activities:verify

# Run migration
npm run migrate:activities
```

### Rollback
```bash
# If something goes wrong
npm run migrate:activities:rollback
```

## Environment Variables

The migration respects these environment variables:

```bash
AWS_REGION=us-east-1                    # AWS region
DYNAMODB_ENDPOINT=http://localhost:8000 # For local DynamoDB
EVENTS_TABLE=Events                     # Events table name
ACTIVITIES_TABLE=Activities             # Activities table name
POLL_VOTES_TABLE=PollVotes              # Poll votes table name
RAFFLE_ENTRIES_TABLE=RaffleEntries      # Raffle entries table name
```

## Migration State File

Example migration state saved to `backups/migration-state-{timestamp}.json`:

```json
{
  "timestamp": "2025-11-29T18-41-02-233Z",
  "eventsUpdated": 3,
  "tablesCreated": [
    "Activities",
    "PollVotes",
    "RaffleEntries"
  ]
}
```

## Next Steps

After this migration:

1. **Task 36**: Implement data migration logic to convert existing quizzes to activities
2. **Task 37**: Create migration verification script
3. **Task 38**: Create rollback script for data migration

## Requirements Validated

✅ **Requirement 8.1**: Migration process converts existing data to new schema
- Added `activeActivityId` field to Events table
- Created Activities, PollVotes, RaffleEntries tables
- Created GSIs for efficient querying

## Notes

- The migration is **idempotent** - can be run multiple times safely
- The migration is **reversible** - rollback removes all changes
- The migration is **verified** - automatic checks ensure data integrity
- The migration is **documented** - comprehensive README provided
- The migration is **tested** - test script validates functionality

## Performance Considerations

- Uses DynamoDB's PAY_PER_REQUEST billing mode (no provisioned capacity needed)
- GSIs created with same billing mode for automatic scaling
- Batch operations not needed for schema changes (DynamoDB is schemaless)
- Migration time scales linearly with number of events

## Security Considerations

- Migration requires DynamoDB permissions:
  - CreateTable
  - DescribeTable
  - DeleteTable (for rollback)
  - Scan and UpdateItem (for Events table)
- No sensitive data exposed in logs
- Migration state files stored locally in `backups/` directory

## Conclusion

Task 35 is complete. The database migration script successfully:
- Creates all required tables with proper GSIs
- Adds `activeActivityId` field to existing events
- Provides comprehensive safety features
- Includes thorough documentation
- Has been tested and verified

The migration is ready for use in both local development and production environments.
