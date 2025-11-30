# Organizer UX Improvements - Migration Guide

## Overview

This guide provides detailed procedures for migrating existing quiz data to support the new Organizer UX features. The migration adds new fields to the Event model and ensures backward compatibility with existing functionality.

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Database Schema Changes](#database-schema-changes)
4. [Migration Procedures](#migration-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Verification Steps](#verification-steps)
7. [Troubleshooting](#troubleshooting)
8. [Post-Migration Tasks](#post-migration-tasks)

---

## Migration Overview

### What's Being Migrated

The migration adds the following fields to existing Event records:

- `status`: Quiz lifecycle state (draft, setup, live, completed)
- `visibility`: Privacy setting (private, public)
- `isTemplate`: Template flag
- `lastModified`: Last modification timestamp
- `participantCount`: Cached participant count
- `topic`: Quiz category/subject
- `description`: Quiz description

### Migration Strategy

- **Zero Downtime**: Migration runs while system is operational
- **Backward Compatible**: Existing functionality continues to work
- **Incremental**: Events migrated in batches
- **Reversible**: Rollback script available if needed

### Estimated Duration

- **Small datasets** (<100 events): 1-2 minutes
- **Medium datasets** (100-1000 events): 5-10 minutes
- **Large datasets** (>1000 events): 15-30 minutes

---

## Pre-Migration Checklist

### Before You Begin

- [ ] **Backup Database**: Create full backup of DynamoDB tables
- [ ] **Review Changes**: Understand schema modifications
- [ ] **Test Environment**: Run migration in staging first
- [ ] **Verify Scripts**: Ensure migration scripts are available
- [ ] **Check Dependencies**: Verify Node.js and AWS CLI installed
- [ ] **Access Credentials**: Confirm AWS credentials configured
- [ ] **Notify Users**: Inform organizers of upcoming changes (optional)
- [ ] **Schedule Maintenance**: Choose low-traffic time window

### Required Tools

```bash
# Node.js (v18 or higher)
node --version

# AWS CLI (configured with credentials)
aws --version
aws sts get-caller-identity

# TypeScript (for running migration scripts)
npm install -g typescript ts-node
```

### Environment Variables

Ensure these are set in your environment:

```bash
# Required
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=live-quiz-events

# Optional (for testing)
DRY_RUN=true
BATCH_SIZE=25
```

---

## Database Schema Changes

### Event Model - Before Migration

```typescript
interface Event {
  eventId: string;
  name: string;
  organizerId: string;
  gamePin: string;
  createdAt: string;
  questions: Question[];
}
```

### Event Model - After Migration

```typescript
interface Event {
  // Existing fields (unchanged)
  eventId: string;
  name: string;
  organizerId: string;
  gamePin: string;
  createdAt: string;
  questions: Question[];
  
  // New fields
  status: 'draft' | 'setup' | 'live' | 'completed';
  visibility: 'private' | 'public';
  isTemplate: boolean;
  lastModified: string;
  participantCount: number;
  topic?: string;
  description?: string;
  startedAt?: string;
  completedAt?: string;
}
```

### Default Values for Existing Events

| Field | Default Value | Logic |
|-------|---------------|-------|
| `status` | `'completed'` | Assume old events are finished |
| `visibility` | `'private'` | Maintain privacy for existing quizzes |
| `isTemplate` | `false` | Existing quizzes are not templates |
| `lastModified` | `createdAt` value | Use creation date |
| `participantCount` | `0` | Will be calculated from participants table |
| `topic` | `undefined` | No default topic |
| `description` | `undefined` | No default description |

---

## Migration Procedures

### Step 1: Backup Database

Create a backup before starting migration:

```bash
# Using AWS CLI
aws dynamodb create-backup \
  --table-name live-quiz-events \
  --backup-name "pre-organizer-ux-migration-$(date +%Y%m%d-%H%M%S)"

# Verify backup created
aws dynamodb list-backups --table-name live-quiz-events
```

### Step 2: Run Migration Script (Dry Run)

Test the migration without making changes:

```bash
cd scripts
DRY_RUN=true ts-node migrate-events.ts
```

**Expected Output**:
```
🔍 Starting migration (DRY RUN)...
📊 Found 150 events to migrate
✓ Would migrate event: evt_123456
✓ Would migrate event: evt_234567
...
✅ Dry run complete. 150 events would be migrated.
```

### Step 3: Run Migration Script (Production)

Execute the actual migration:

```bash
cd scripts
ts-node migrate-events.ts
```

**Expected Output**:
```
🚀 Starting migration...
📊 Found 150 events to migrate
✓ Migrated event: evt_123456 (1/150)
✓ Migrated event: evt_234567 (2/150)
...
✅ Migration complete! 150 events migrated successfully.
⏱️  Duration: 2m 15s
```

### Step 4: Verify Migration

Run verification checks:

```bash
cd scripts
ts-node test-migration.ts
```

**Verification Checks**:
- All events have required new fields
- No events lost during migration
- Field values are valid
- Indexes are functioning
- Queries return expected results

### Migration Script Details

The migration script (`scripts/migrate-events.ts`) performs these operations:

```typescript
async function migrateEvents() {
  // 1. Scan all events
  const events = await scanAllEvents();
  
  // 2. Process in batches
  for (const batch of chunk(events, BATCH_SIZE)) {
    await Promise.all(batch.map(async (event) => {
      // 3. Add new fields with defaults
      const migrated = {
        ...event,
        status: determineStatus(event),
        visibility: 'private',
        isTemplate: false,
        lastModified: event.createdAt,
        participantCount: await getParticipantCount(event.eventId),
        topic: undefined,
        description: undefined
      };
      
      // 4. Update in DynamoDB
      await updateEvent(migrated);
    }));
  }
}
```

### Status Determination Logic

```typescript
function determineStatus(event: Event): EventStatus {
  // If event has participants and was created recently (< 24h ago)
  if (hasParticipants(event) && isRecent(event, 24)) {
    return 'live';
  }
  
  // If event has questions but no participants
  if (hasQuestions(event) && !hasParticipants(event)) {
    return 'setup';
  }
  
  // Default: assume completed
  return 'completed';
}
```

---

## Rollback Procedures

If issues occur during migration, use the rollback script to restore previous state.

### Step 1: Stop Migration

If migration is in progress:

```bash
# Press Ctrl+C to stop the migration script
# Note the last successfully migrated event ID
```

### Step 2: Run Rollback Script

```bash
cd scripts
ts-node rollback-migration.ts
```

**Expected Output**:
```
🔄 Starting rollback...
📊 Found 150 migrated events
✓ Rolled back event: evt_123456 (1/150)
✓ Rolled back event: evt_234567 (2/150)
...
✅ Rollback complete! 150 events restored.
```

### Step 3: Restore from Backup (If Needed)

If rollback script fails, restore from backup:

```bash
# List available backups
aws dynamodb list-backups --table-name live-quiz-events

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name live-quiz-events \
  --backup-arn arn:aws:dynamodb:region:account:table/live-quiz-events/backup/01234567890123-abcdef12
```

### Rollback Script Details

The rollback script removes new fields:

```typescript
async function rollbackMigration() {
  const events = await scanAllEvents();
  
  for (const event of events) {
    // Remove new fields
    const {
      status,
      visibility,
      isTemplate,
      lastModified,
      participantCount,
      topic,
      description,
      startedAt,
      completedAt,
      ...original
    } = event;
    
    // Update with original fields only
    await updateEvent(original);
  }
}
```

---

## Verification Steps

### Automated Verification

Run the test script to verify migration success:

```bash
cd scripts
ts-node test-migration.ts
```

**Tests Performed**:
1. ✓ All events have `status` field
2. ✓ All events have `visibility` field
3. ✓ All events have `isTemplate` field
4. ✓ All events have `lastModified` field
5. ✓ All events have `participantCount` field
6. ✓ Status values are valid
7. ✓ Visibility values are valid
8. ✓ No events were lost
9. ✓ Queries work correctly
10. ✓ Indexes are functional

### Manual Verification

#### Check Event Count

```bash
# Before migration
aws dynamodb scan --table-name live-quiz-events --select COUNT

# After migration (should be same)
aws dynamodb scan --table-name live-quiz-events --select COUNT
```

#### Inspect Sample Events

```bash
# Get a sample event
aws dynamodb get-item \
  --table-name live-quiz-events \
  --key '{"eventId": {"S": "evt_123456"}}'
```

**Verify**:
- New fields are present
- Values are appropriate
- Existing fields unchanged

#### Test API Endpoints

```bash
# Test organizer quizzes endpoint
curl http://localhost:3001/api/events/organizer/org_123456

# Test public quizzes endpoint
curl http://localhost:3001/api/events/public

# Test status update
curl -X PATCH http://localhost:3001/api/events/evt_123456/status \
  -H "Content-Type: application/json" \
  -d '{"status": "live"}'
```

### Performance Verification

Check query performance after migration:

```bash
# Time organizer query
time curl http://localhost:3001/api/events/organizer/org_123456

# Should complete in < 2 seconds
```

---

## Troubleshooting

### Common Issues

#### Issue: Migration Script Fails Midway

**Symptoms**:
- Script exits with error
- Some events migrated, others not

**Solution**:
```bash
# Check error message
# Identify last successful event ID
# Resume from that point:
RESUME_FROM=evt_123456 ts-node migrate-events.ts
```

#### Issue: Participant Count Incorrect

**Symptoms**:
- `participantCount` shows 0 for events with participants

**Solution**:
```bash
# Recalculate participant counts
ts-node scripts/recalculate-participant-counts.ts
```

#### Issue: Status Determination Wrong

**Symptoms**:
- Live quizzes marked as completed
- Completed quizzes marked as live

**Solution**:
```typescript
// Manually update specific events
await updateEventStatus('evt_123456', 'completed');
```

#### Issue: DynamoDB Throttling

**Symptoms**:
- `ProvisionedThroughputExceededException` errors
- Migration very slow

**Solution**:
```bash
# Reduce batch size
BATCH_SIZE=10 ts-node migrate-events.ts

# Or increase table capacity temporarily
aws dynamodb update-table \
  --table-name live-quiz-events \
  --provisioned-throughput ReadCapacityUnits=50,WriteCapacityUnits=50
```

#### Issue: Rollback Fails

**Symptoms**:
- Rollback script errors
- Events in inconsistent state

**Solution**:
```bash
# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name live-quiz-events \
  --backup-arn <backup-arn>
```

### Getting Help

If you encounter issues not covered here:

1. Check logs: `tail -f migration.log`
2. Review error messages carefully
3. Consult API documentation
4. Contact support with:
   - Error messages
   - Migration logs
   - Event IDs affected
   - Environment details

---

## Post-Migration Tasks

### Step 1: Monitor System

Monitor for 24-48 hours after migration:

```bash
# Watch error logs
tail -f /var/log/app/error.log

# Monitor API response times
# Check CloudWatch metrics
# Review user reports
```

### Step 2: Update Documentation

- [ ] Update API documentation with new fields
- [ ] Update user guides
- [ ] Notify organizers of new features
- [ ] Update internal documentation

### Step 3: Enable New Features

If features were disabled during migration:

```bash
# Enable feature flags
aws ssm put-parameter \
  --name /app/features/organizer-ux \
  --value "enabled" \
  --overwrite
```

### Step 4: Clean Up

```bash
# Remove old backups (after 30 days)
aws dynamodb delete-backup --backup-arn <old-backup-arn>

# Archive migration logs
mv migration.log archive/migration-$(date +%Y%m%d).log
```

### Step 5: Performance Optimization

After migration, optimize for new query patterns:

```bash
# Add indexes for common queries
# Adjust table capacity based on usage
# Enable auto-scaling if needed
```

---

## Migration Checklist

Use this checklist to track migration progress:

### Pre-Migration
- [ ] Database backup created
- [ ] Migration scripts tested in staging
- [ ] Dry run completed successfully
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Rollback plan reviewed

### During Migration
- [ ] Migration script started
- [ ] Progress monitored
- [ ] No errors encountered
- [ ] Completion confirmed

### Post-Migration
- [ ] Verification tests passed
- [ ] API endpoints tested
- [ ] Sample events inspected
- [ ] Performance verified
- [ ] Monitoring enabled
- [ ] Documentation updated
- [ ] Users notified
- [ ] Cleanup completed

---

## Migration Timeline

### Recommended Schedule

**Day 1: Preparation**
- Review migration guide
- Test in staging environment
- Create backups
- Schedule maintenance window

**Day 2: Migration**
- Execute migration during low-traffic period
- Monitor progress
- Run verification tests
- Confirm success

**Day 3-4: Monitoring**
- Watch for issues
- Respond to user feedback
- Fine-tune performance
- Document lessons learned

**Day 5: Completion**
- Final verification
- Update documentation
- Announce new features
- Archive migration artifacts

---

## Support

For migration support:

- **Documentation**: Review this guide and API docs
- **Staging Environment**: Test thoroughly before production
- **Backup Strategy**: Always have a rollback plan
- **Monitoring**: Watch system closely post-migration
- **Communication**: Keep stakeholders informed

---

## Appendix

### Migration Script Reference

**Location**: `scripts/migrate-events.ts`

**Usage**:
```bash
# Dry run
DRY_RUN=true ts-node migrate-events.ts

# Production run
ts-node migrate-events.ts

# Resume from specific event
RESUME_FROM=evt_123456 ts-node migrate-events.ts

# Custom batch size
BATCH_SIZE=10 ts-node migrate-events.ts
```

### Rollback Script Reference

**Location**: `scripts/rollback-migration.ts`

**Usage**:
```bash
# Full rollback
ts-node rollback-migration.ts

# Rollback specific events
EVENT_IDS=evt_123,evt_456 ts-node rollback-migration.ts
```

### Test Script Reference

**Location**: `scripts/test-migration.ts`

**Usage**:
```bash
# Run all tests
ts-node test-migration.ts

# Run specific test
TEST=status-validation ts-node test-migration.ts
```

---

**Migration Guide Version**: 1.0  
**Last Updated**: November 28, 2025  
**Compatibility**: Live Quiz Event System v2.0+
