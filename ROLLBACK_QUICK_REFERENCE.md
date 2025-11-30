# Rollback Quick Reference

Quick reference guide for rolling back the Event Activities Platform migration.

## Quick Commands

### Preview Rollback (Dry Run)
```bash
npm run migrate:activities:rollback verify
```

### Rollback Schema Only
```bash
npm run migrate:activities:rollback
```

### Rollback with Backup Restoration
```bash
npm run migrate:activities:rollback backups/migration-state-2024-01-15.json
```

### Skip Confirmation (Automated)
```bash
npm run migrate:activities:rollback -- --yes
```

### Test Rollback
```bash
npm run test:rollback
```

## What Gets Rolled Back

| Operation | Description |
|-----------|-------------|
| Delete Activities table | Removes all quiz, poll, and raffle activities |
| Delete PollVotes table | Removes all poll voting data |
| Delete RaffleEntries table | Removes all raffle entry data |
| Remove activeActivityId | Removes field from all Events |
| Remove activityId | Removes field from all Questions |
| Restore from backup | (Optional) Restores events from backup file |

## Safety Checklist

Before running rollback:

- [ ] Verify you have a backup file (if needed)
- [ ] Run dry-run mode first: `npm run migrate:activities:rollback verify`
- [ ] Ensure no users are actively using the system
- [ ] Check that no new activities (polls, raffles) have been created
- [ ] Confirm you have database access permissions
- [ ] Review the rollback report from dry-run

## Common Scenarios

### Scenario 1: Testing Migration in Development
```bash
# Run migration
npm run migrate:activities

# Test the new features
# ...

# Rollback to test again
npm run migrate:activities:rollback -- --yes
```

### Scenario 2: Production Rollback with Backup
```bash
# Find the backup file
ls -la backups/migration-state-*.json

# Preview the rollback
npm run migrate:activities:rollback verify backups/migration-state-2024-01-15.json

# Execute rollback
npm run migrate:activities:rollback backups/migration-state-2024-01-15.json
```

### Scenario 3: Emergency Rollback
```bash
# Quick rollback without backup (preserves current event data)
npm run migrate:activities:rollback -- --yes
```

## Verification

After rollback, verify:

```bash
# Check tables are deleted
aws dynamodb describe-table --table-name Activities
# Should return: ResourceNotFoundException

# Check events don't have activeActivityId
aws dynamodb scan --table-name Events --limit 5
# Should not see activeActivityId field

# Check questions don't have activityId
aws dynamodb scan --table-name Questions --limit 5
# Should not see activityId field
```

## Troubleshooting

### "Table does not exist" errors
✅ **Normal** - Table was already deleted or never created

### "Failed to update event" errors
❌ **Check**: DynamoDB permissions, table configuration

### "Backup file not found" errors
❌ **Check**: File path is correct, file exists in backups/ directory

### Verification failures
❌ **Check**: DynamoDB connection, permissions, no concurrent modifications

## Environment Configuration

### Local Development
```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
export AWS_REGION=us-east-1
```

### Production
```bash
export AWS_REGION=us-east-1
# No DYNAMODB_ENDPOINT needed
```

### Custom Table Names
```bash
export EVENTS_TABLE=MyEventsTable
export QUESTIONS_TABLE=MyQuestionsTable
export ACTIVITIES_TABLE=MyActivitiesTable
```

## Rollback Report Example

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

## When to Use Rollback

✅ **Use rollback when:**
- Migration caused unexpected issues
- Testing migration in development/staging
- Need to revert to quiz-centric model
- Discovered data inconsistencies
- Need to re-run migration with fixes

❌ **Don't use rollback when:**
- New activities (polls, raffles) have been created
- Users are actively using new features
- Production data has been modified post-migration
- No backup exists and event data is critical

## Getting Help

1. Check the rollback report for specific errors
2. Review verification output
3. Examine DynamoDB logs
4. Consult `scripts/ROLLBACK_README.md` for detailed documentation
5. Check `TASK_38_ROLLBACK_SCRIPT_IMPLEMENTATION.md` for implementation details

## Related Commands

```bash
# Migration
npm run migrate:activities              # Run migration
npm run migrate:activities:verify       # Verify migration

# Rollback
npm run migrate:activities:rollback     # Rollback migration
npm run test:rollback                   # Test rollback

# Verification
npm run verify:migration                # Verify migration state
```

## Files Reference

- `scripts/rollback-activity-migration.ts` - Main rollback script
- `scripts/ROLLBACK_README.md` - Detailed documentation
- `scripts/test-rollback.ts` - Test script
- `TASK_38_ROLLBACK_SCRIPT_IMPLEMENTATION.md` - Implementation summary
- `backups/migration-state-*.json` - Migration backup files

## Support

For issues or questions:
1. Run dry-run mode to see what would happen
2. Check verification output for specific errors
3. Review the detailed documentation in `scripts/ROLLBACK_README.md`
4. Examine the implementation details in `TASK_38_ROLLBACK_SCRIPT_IMPLEMENTATION.md`
