# Database Migration Quick Reference

## Event Activities Platform Migration

### Quick Commands

```bash
# Verify what will be done (dry run)
npm run migrate:activities:verify

# Run migration
npm run migrate:activities

# Run migration without confirmation
npm run migrate:activities -- --yes

# Rollback migration
npm run migrate:activities:rollback

# Test migration with sample data
npm run test:activities-migration
npm run test:activities-migration -- --verify
```

### What Gets Created

1. **Activities Table**
   - Stores quiz, poll, and raffle activities
   - GSI: `eventId-order-index` for querying by event

2. **PollVotes Table**
   - Stores participant votes in polls
   - GSI: `pollId-participantId-index` for querying votes

3. **RaffleEntries Table**
   - Stores participant entries in raffles
   - GSI: `raffleId-participantId-index` for querying entries

4. **Events Table Update**
   - Adds `activeActivityId` field (initially `null`)

### Local Development

```bash
# Start DynamoDB Local
npm run db:start

# Set endpoint
export DYNAMODB_ENDPOINT=http://localhost:8000

# Run migration
npm run migrate:activities -- --yes
```

### Production

```bash
# Configure AWS credentials
aws configure

# Set region
export AWS_REGION=us-east-1

# Verify first
npm run migrate:activities:verify

# Run migration
npm run migrate:activities
```

### Rollback

```bash
# Undo all changes
npm run migrate:activities:rollback
```

This will:
- Delete Activities, PollVotes, RaffleEntries tables
- Remove `activeActivityId` field from events

### Environment Variables

```bash
DYNAMODB_ENDPOINT=http://localhost:8000  # For local DynamoDB
AWS_REGION=us-east-1                     # AWS region
EVENTS_TABLE=Events                      # Events table name
ACTIVITIES_TABLE=Activities              # Activities table name
POLL_VOTES_TABLE=PollVotes               # Poll votes table name
RAFFLE_ENTRIES_TABLE=RaffleEntries       # Raffle entries table name
```

### Troubleshooting

**Table already exists error**
- This is normal and safe - migration is idempotent

**Permission errors**
- Ensure AWS credentials have DynamoDB permissions

**Timeout errors**
- Check AWS service health
- Increase `maxWaitTime` in script if needed

### Documentation

- Full guide: `scripts/ACTIVITIES_MIGRATION_README.md`
- Implementation details: `TASK_35_MIGRATION_SCRIPT_IMPLEMENTATION.md`
