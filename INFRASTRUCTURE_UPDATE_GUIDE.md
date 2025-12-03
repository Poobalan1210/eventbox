# Infrastructure Update Guide - Activity Tables

## Overview
The CDK infrastructure has been updated to include the three new DynamoDB tables required for the activities system (polls, raffles, and quizzes).

## Changes Made

### 1. Added Three New DynamoDB Tables

#### Activities Table
- **Table Name**: `Activities`
- **Partition Key**: `eventId` (String)
- **Sort Key**: `activityId` (String)
- **GSI**: `EventActivities` - for querying all activities for an event
- **Purpose**: Stores metadata for all activity types (quiz, poll, raffle)

#### PollVotes Table
- **Table Name**: `PollVotes`
- **Partition Key**: `pollId` (String)
- **Sort Key**: `participantId` (String)
- **GSI**: `PollVotes` - for querying all votes for a poll
- **Purpose**: Stores vote submissions for poll activities

#### RaffleEntries Table
- **Table Name**: `RaffleEntries`
- **Partition Key**: `raffleId` (String)
- **Sort Key**: `participantId` (String)
- **GSI**: `RaffleEntries` - for querying all entries for a raffle
- **Purpose**: Stores entry submissions for raffle activities

### 2. Updated IAM Permissions
The ECS task role now has read/write permissions for all three new tables:
```typescript
activitiesTable.grantReadWriteData(taskRole);
pollVotesTable.grantReadWriteData(taskRole);
raffleEntriesTable.grantReadWriteData(taskRole);
```

### 3. Added Environment Variables
The ECS task definition now includes environment variables for the new tables:
```typescript
ACTIVITIES_TABLE: activitiesTable.tableName,
POLL_VOTES_TABLE: pollVotesTable.tableName,
RAFFLE_ENTRIES_TABLE: raffleEntriesTable.tableName,
```

### 4. Added CloudFormation Outputs
New stack outputs for easy reference:
- `ActivitiesTableName`
- `PollVotesTableName`
- `RaffleEntriesTableName`

## Current State vs. Desired State

### Current Production Environment
The tables were created manually using AWS CLI:
- ✅ Tables exist and are active
- ✅ IAM permissions added manually via inline policy
- ❌ Not managed by CloudFormation/CDK
- ❌ Will not be recreated if stack is destroyed and redeployed

### After CDK Update (Not Yet Deployed)
- ✅ Tables defined in CDK stack
- ✅ IAM permissions managed by CDK
- ✅ Environment variables configured
- ✅ Will be recreated automatically on fresh deployments

## Deployment Options

### Option 1: Import Existing Tables (Recommended)
Since the tables already exist in production, you should import them into the CDK stack rather than trying to create new ones.

**Steps:**
1. Update the CDK stack to use `fromTableName` instead of creating new tables
2. This allows CDK to manage the tables without recreating them

**Modified CDK Code:**
```typescript
// Import existing tables instead of creating new ones
const activitiesTable = dynamodb.Table.fromTableName(
  this,
  'ActivitiesTable',
  'Activities'
);

const pollVotesTable = dynamodb.Table.fromTableName(
  this,
  'PollVotesTable',
  'PollVotes'
);

const raffleEntriesTable = dynamodb.Table.fromTableName(
  this,
  'RaffleEntriesTable',
  'RaffleEntries'
);
```

**Pros:**
- No downtime
- Preserves existing data
- No risk of table deletion

**Cons:**
- CDK won't manage table configuration (billing mode, encryption, etc.)
- Can't modify table settings through CDK

### Option 2: Keep Manual Tables (Current State)
Leave the tables as manually created and don't update the CDK stack.

**Pros:**
- No changes needed
- No deployment risk

**Cons:**
- Tables not in infrastructure as code
- Manual recreation needed if starting fresh
- Inconsistent with other infrastructure

### Option 3: Recreate Tables (Not Recommended for Production)
Delete existing tables and let CDK create new ones.

**⚠️ WARNING: This will delete all data!**

**Steps:**
1. Export data from existing tables
2. Delete existing tables
3. Deploy CDK stack
4. Import data back

**Only use this for:**
- Development/test environments
- Fresh deployments
- When data loss is acceptable

## ✅ COMPLETED - CDK Updated to Import Existing Tables

The CDK stack has been updated to import the existing tables instead of trying to create new ones.

### What Was Done
Modified `infrastructure/lib/live-quiz-event-stack.ts`:

```typescript
// Import existing tables (CURRENT CONFIGURATION)
const activitiesTable = dynamodb.Table.fromTableName(
  this,
  'ActivitiesTable',
  'Activities'
);

const pollVotesTable = dynamodb.Table.fromTableName(
  this,
  'PollVotesTable',
  'PollVotes'
);

const raffleEntriesTable = dynamodb.Table.fromTableName(
  this,
  'RaffleEntriesTable',
  'RaffleEntries'
);

// Permissions and environment variables configured
activitiesTable.grantReadWriteData(taskRole);
pollVotesTable.grantReadWriteData(taskRole);
raffleEntriesTable.grantReadWriteData(taskRole);
```

### To Deploy This Update (Optional)
```bash
cd infrastructure
npx cdk diff  # Review changes - should show IAM policy updates
npx cdk deploy  # Deploy if you want CDK to manage the permissions
```

**Note**: This is optional since the manual IAM policies are already working. Deploying will replace the manual policies with CDK-managed ones.

### Verification
```bash
# Test the application (should work regardless)
curl https://d15swf38ljbkja.cloudfront.net/api/events/0eb9fc73-19e6-40b1-b675-a60e07502b68/activities
```

## For Fresh Deployments

If deploying to a new AWS account or region, the current CDK code (with table creation) will work perfectly:

```bash
cd infrastructure

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy stack
npx cdk deploy

# Build and push backend
cd ../
./deploy-backend.sh

# Deploy frontend
cd frontend
npm run build:prod
aws s3 sync dist/ s3://live-quiz-frontend-<account-id>/
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

## Verification Commands

### Check Tables Exist
```bash
aws dynamodb list-tables --region us-east-1 | grep -E "Activities|PollVotes|RaffleEntries"
```

### Check Table Schemas
```bash
aws dynamodb describe-table --table-name Activities --region us-east-1
aws dynamodb describe-table --table-name PollVotes --region us-east-1
aws dynamodb describe-table --table-name RaffleEntries --region us-east-1
```

### Check IAM Permissions
```bash
aws iam list-role-policies \
  --role-name LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y \
  --region us-east-1
```

### Check ECS Environment Variables
```bash
aws ecs describe-task-definition \
  --task-definition LiveQuizEventStackWebSocketTaskDef692791D8 \
  --region us-east-1 \
  --query 'taskDefinition.containerDefinitions[0].environment'
```

## Rollback Plan

If something goes wrong after CDK deployment:

### 1. Revert CDK Changes
```bash
cd infrastructure
git checkout HEAD~1 lib/live-quiz-event-stack.ts
npx cdk deploy
```

### 2. Restore Manual IAM Policy
```bash
aws iam put-role-policy \
  --role-name LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y \
  --policy-name PollRaffleTableAccess \
  --policy-document file://poll-raffle-policy.json
```

### 3. Restart ECS Service
```bash
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --force-new-deployment \
  --region us-east-1
```

## Files Modified
- `infrastructure/lib/live-quiz-event-stack.ts` - Added three new DynamoDB tables, permissions, and environment variables

## Files to Keep
- `poll-raffle-policy.json` - Backup of manual IAM policy (for rollback)

## Next Steps

1. **For Current Production**: Consider importing existing tables into CDK (Option 1)
2. **For Future Deployments**: The updated CDK stack will create all tables automatically
3. **Documentation**: Update deployment guides to reference the new tables
4. **Monitoring**: Add CloudWatch alarms for the new tables if needed

## Cost Impact
No change - tables already exist and are using pay-per-request billing.

## Testing Checklist

After any infrastructure changes:
- [ ] Activities load correctly
- [ ] Can create new activities (quiz, poll, raffle)
- [ ] Poll voting works
- [ ] Raffle entries work
- [ ] Quiz questions work
- [ ] No permission errors in CloudWatch logs
- [ ] All environment variables are set correctly

## Support

If you encounter issues:
1. Check CloudWatch logs: `/ecs/live-quiz-websocket-server`
2. Verify IAM permissions
3. Check DynamoDB table status
4. Review ECS task definition environment variables
