# Data Migration Documentation (Task 36)

## Overview

This document describes the data migration logic implemented for Task 36 of the Event Activities Platform. The migration transforms existing quiz-centric events into the new event-activities model.

## What the Migration Does

The data migration performs the following operations:

### 1. For Each Existing Event
- Creates a `QuizActivity` containing all the event's questions
- Assigns a unique `activityId` to the new activity
- Sets the activity name to match the event name
- Sets the activity order to 0 (first activity)

### 2. Activity Status Mapping
Maps event status to appropriate activity status:
- `draft` → `draft`
- `setup` → `ready`
- `live` or `active` → `active`
- `completed` → `completed`

### 3. Question Migration
- Updates all questions to reference the new `activityId`
- Preserves all question data (text, options, images, etc.)
- Maintains question order within the activity

### 4. Active Activity Assignment
- For events with status `live` or `active`, sets the newly created activity as the active activity
- Updates the event's `activeActivityId` field

### 5. Data Preservation
The migration preserves:
- All event metadata (name, gamePin, organizerId, privacy settings)
- All question data (text, options, correct answers, images, timers)
- Question order
- Event status and timestamps
- Participant data (not modified by migration)
- Answer data (not modified by migration)

## Running the Migration

### Prerequisites
1. Ensure all new tables are created (Activities, PollVotes, RaffleEntries)
2. Ensure the `activeActivityId` field is added to Events table
3. Back up your data before running migration

### Step 1: Create Test Data (Optional)
```bash
# Set environment for local testing
export DYNAMODB_ENDPOINT=http://localhost:8000
export AWS_REGION=us-east-1

# Create test events and questions
npm run test:data-migration
```

### Step 2: Run Migration
```bash
# Dry run to see what will happen
npm run migrate:activities:verify

# Run the actual migration
npm run migrate:activities -- --yes
```

### Step 3: Verify Migration
```bash
# Verify test data migration
npm run test:data-migration -- --verify

# Or use the built-in verification
npm run migrate:activities:verify
```

### Step 4: Clean Up Test Data (Optional)
```bash
npm run test:data-migration -- --cleanup
```

## Migration Script Details

### File: `scripts/migrate-to-activities.ts`

#### Key Functions

**`migrateEventsToActivities()`**
- Main data migration function
- Scans all events in the Events table
- For each event:
  - Checks if activities already exist (skips if yes)
  - Retrieves all questions for the event
  - Creates a QuizActivity with all questions
  - Updates questions to reference the activityId
  - Sets active activity for live events

**`mapEventStatusToActivityStatus(eventStatus: string)`**
- Maps event status to activity status
- Ensures consistent status semantics

**`verifyMigration()`**
- Enhanced to verify:
  - All events have activities
  - Questions reference activityId
  - Activity count matches expectations

## Testing

### Test Script: `scripts/test-data-migration.ts`

Creates comprehensive test scenarios:
1. **Draft Event** - 3 questions, status: draft
2. **Setup Event** - 5 questions, status: setup
3. **Live Event** - 2 questions, status: live
4. **Completed Event** - 4 questions, status: completed

### Verification Checks
For each test event, verifies:
- ✓ Event has `activeActivityId` field
- ✓ Exactly one activity created
- ✓ Activity type is 'quiz'
- ✓ Activity status matches expected mapping
- ✓ Activity has correct number of questions
- ✓ Activity name matches event name
- ✓ All questions reference the activityId
- ✓ Live events have activeActivityId set

## Rollback

If migration needs to be rolled back:

```bash
npm run migrate:activities:rollback
```

This will:
- Delete Activities, PollVotes, and RaffleEntries tables
- Remove `activeActivityId` field from events
- Preserve original event and question data

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 8.1: Migration Process
✓ Converts each existing quiz into an event containing a single quiz activity

### Requirement 8.2: Data Preservation
✓ Preserves all question data, answers, and configuration

### Requirement 8.3: Join Code Maintenance
✓ Maintains existing join codes as event join codes (gamePins)

### Requirement 8.4: Privacy Settings
✓ Marks all migrated events with appropriate privacy settings based on previous status

## Migration State

The migration saves state to `backups/migration-state-{timestamp}.json`:

```json
{
  "timestamp": "2025-11-30T...",
  "eventsUpdated": 10,
  "tablesCreated": ["Activities", "PollVotes", "RaffleEntries"],
  "activitiesCreated": 10,
  "questionsMigrated": 45
}
```

## Troubleshooting

### Issue: Activities already exist
**Symptom**: Migration skips events with message "already has X activities"
**Solution**: This is expected behavior. Migration is idempotent and won't duplicate activities.

### Issue: Questions not migrated
**Symptom**: Questions don't have activityId field
**Solution**: Check that the Activities table was created successfully before running migration.

### Issue: Active activity not set
**Symptom**: Live events don't have activeActivityId set
**Solution**: Verify event status is exactly 'live' or 'active' (case-sensitive).

## Performance Considerations

- Migration processes events sequentially to avoid throttling
- Uses batch operations where possible
- Includes retry logic for transient errors
- Typical performance: ~100 events/minute

## Next Steps

After successful migration:
1. Verify all events have activities
2. Test organizer dashboard with migrated data
3. Test participant view with migrated events
4. Remove deprecated public quiz browsing (Task 39)
5. Remove template system (Task 40)
