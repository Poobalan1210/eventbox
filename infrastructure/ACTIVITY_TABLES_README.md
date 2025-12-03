# Activity Tables Configuration

## Current Configuration (Production)

The CDK stack is currently configured to **import existing tables** rather than create new ones. This is because the tables were created manually in production and contain live data.

### Imported Tables
- `Activities` - Activity metadata (quiz, poll, raffle)
- `PollVotes` - Poll vote submissions
- `RaffleEntries` - Raffle entry submissions

## For Production Deployments

**Current setup is correct** - The stack imports existing tables and manages permissions.

To deploy updates:
```bash
cd infrastructure
npx cdk diff    # Review changes
npx cdk deploy  # Deploy if safe
```

## For Fresh Deployments (New Environment)

If deploying to a **new AWS account or region**, you need to create the tables:

### Step 1: Update CDK Stack
Edit `lib/live-quiz-event-stack.ts`:

1. **Comment out** the import section (lines ~153-173):
```typescript
// const activitiesTable = dynamodb.Table.fromTableName(
//   this,
//   'ActivitiesTable',
//   'Activities'
// );
// ... etc
```

2. **Uncomment** the table creation section (lines ~175-270):
```typescript
const activitiesTable = new dynamodb.Table(this, 'ActivitiesTable', {
  tableName: 'Activities',
  // ... etc
});
```

### Step 2: Deploy
```bash
cd infrastructure
npx cdk bootstrap  # First time only
npx cdk deploy
```

This will create all 8 DynamoDB tables automatically.

## Table Schemas

### Activities Table
```
Partition Key: eventId (String)
Sort Key: activityId (String)
GSI: EventActivities (eventId)
```

### PollVotes Table
```
Partition Key: pollId (String)
Sort Key: participantId (String)
GSI: PollVotes (pollId)
```

### RaffleEntries Table
```
Partition Key: raffleId (String)
Sort Key: participantId (String)
GSI: RaffleEntries (raffleId)
```

## Switching Between Modes

### Production → Fresh Deployment
1. Comment out imports
2. Uncomment table creation
3. Deploy to new environment

### Fresh Deployment → Production
1. Comment out table creation
2. Uncomment imports
3. Deploy update

## Why This Approach?

### Import Existing (Current)
✅ No risk of data loss
✅ No downtime
✅ Preserves existing data
✅ CDK manages permissions
❌ Can't modify table settings via CDK

### Create New (Fresh Deployments)
✅ Full CDK management
✅ Infrastructure as code
✅ Easy to recreate
❌ Would delete existing data if used in production

## Verification

After deployment, verify tables are accessible:

```bash
# Check tables exist
aws dynamodb list-tables --region us-east-1 | grep -E "Activities|PollVotes|RaffleEntries"

# Check permissions
aws iam list-role-policies --role-name LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y

# Test API
curl https://d15swf38ljbkja.cloudfront.net/api/events/<event-id>/activities
```

## Troubleshooting

### Error: Table already exists
- You're trying to create tables that already exist
- Switch to import mode (comment out creation, uncomment imports)

### Error: Table not found
- You're trying to import tables that don't exist
- Switch to creation mode (comment out imports, uncomment creation)

### Permission denied
- Check IAM role has permissions
- Verify task role is correct
- Check CloudWatch logs for details

## Related Files
- `lib/live-quiz-event-stack.ts` - Main CDK stack
- `../backend/src/db/client.ts` - Table name configuration
- `../POLL_RAFFLE_TABLES_FIX.md` - Manual table creation details
- `../INFRASTRUCTURE_UPDATE_GUIDE.md` - Detailed deployment guide
