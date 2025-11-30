# Migration Quick Start Guide

Quick reference for running the event schema migration.

## Prerequisites

```bash
# Set environment variables
export AWS_REGION=us-east-1
export EVENTS_TABLE=LiveQuizEvents
export PARTICIPANTS_TABLE=LiveQuizParticipants

# For local DynamoDB
export DYNAMODB_ENDPOINT=http://localhost:8000
```

## Quick Commands

### Preview Changes (Recommended First)
```bash
npm run migrate:verify
```

### Run Migration
```bash
# With confirmation prompt
npm run migrate

# Skip confirmation (for automation)
npm run migrate -- --yes
```

### Rollback if Needed
```bash
npm run migrate:rollback backups/events-backup-<timestamp>.json
```

## Local Testing

```bash
# 1. Start local DynamoDB
docker-compose up -d

# 2. Create test data
npm run migrate:test

# 3. Preview migration
npm run migrate:verify

# 4. Run migration
npm run migrate

# 5. Verify results
npm run migrate:test:verify

# 6. Test rollback (optional)
npm run migrate:rollback backups/events-backup-<timestamp>.json
```

## What Gets Migrated

- ✅ `visibility`: 'private' (default)
- ✅ `isTemplate`: false (default)
- ✅ `lastModified`: timestamp
- ✅ `participantCount`: calculated from data
- ✅ `startedAt`: for live/completed events
- ✅ `completedAt`: for completed events
- ✅ Status mapping: waiting→setup, active→live

## Safety Features

- 🔒 Automatic backup before changes
- 👀 Dry run mode to preview
- ✅ Data integrity verification
- ↩️ Easy rollback from backup
- 📊 Detailed migration report

## Troubleshooting

### Can't connect to DynamoDB
```bash
# Check endpoint
echo $DYNAMODB_ENDPOINT

# For local: http://localhost:8000
# For AWS: unset DYNAMODB_ENDPOINT
```

### Migration fails
```bash
# Check the error message
# Rollback if needed
npm run migrate:rollback backups/events-backup-<timestamp>.json
```

### Need to see what would change
```bash
# Run dry run first
npm run migrate:verify
```

## Production Checklist

- [ ] Test on staging first
- [ ] Run `npm run migrate:verify`
- [ ] Schedule during low-traffic period
- [ ] Have rollback plan ready
- [ ] Monitor during migration
- [ ] Verify sample events after

## More Information

See `scripts/MIGRATION_README.md` for detailed documentation.
