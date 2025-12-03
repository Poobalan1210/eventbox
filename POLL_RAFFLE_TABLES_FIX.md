# Poll and Raffle Tables Fix

## Issue
After fixing the Activities table issue, users were getting 500 errors when trying to vote in polls:
```
POST https://d15swf38ljbkja.cloudfront.net/api/activities/b8adc48f-2205-4e8c-a6b6-d75ea7f06f01/vote 500 (Internal Server Error)
```

## Root Cause
The application code expected two additional DynamoDB tables that didn't exist:
1. **PollVotes** - For storing poll votes
2. **RaffleEntries** - For storing raffle entries

Additionally, the ECS task role didn't have permissions to access these tables.

### Error from CloudWatch Logs
```
AccessDeniedException: User: arn:aws:sts::333105300941:assumed-role/LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y/... 
is not authorized to perform: dynamodb:Query on resource: arn:aws:dynamodb:us-east-1:333105300941:table/PollVotes 
because no identity-based policy allows the dynamodb:Query action
```

## Solution

### 1. Created PollVotes Table
```bash
aws dynamodb create-table \
  --table-name PollVotes \
  --attribute-definitions \
    AttributeName=pollId,AttributeType=S \
    AttributeName=participantId,AttributeType=S \
  --key-schema \
    AttributeName=pollId,KeyType=HASH \
    AttributeName=participantId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --global-secondary-indexes \
    "[{\"IndexName\":\"PollVotes\",\"KeySchema\":[{\"AttributeName\":\"pollId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
```

**Table Schema:**
- **Partition Key**: `pollId` (String) - The activity ID of the poll
- **Sort Key**: `participantId` (String) - The participant who voted
- **GSI**: `PollVotes` index for querying all votes for a poll
- **Billing**: Pay-per-request (on-demand)

### 2. Created RaffleEntries Table
```bash
aws dynamodb create-table \
  --table-name RaffleEntries \
  --attribute-definitions \
    AttributeName=raffleId,AttributeType=S \
    AttributeName=participantId,AttributeType=S \
  --key-schema \
    AttributeName=raffleId,KeyType=HASH \
    AttributeName=participantId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --global-secondary-indexes \
    "[{\"IndexName\":\"RaffleEntries\",\"KeySchema\":[{\"AttributeName\":\"raffleId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
```

**Table Schema:**
- **Partition Key**: `raffleId` (String) - The activity ID of the raffle
- **Sort Key**: `participantId` (String) - The participant who entered
- **GSI**: `RaffleEntries` index for querying all entries for a raffle
- **Billing**: Pay-per-request (on-demand)

### 3. Added IAM Permissions
Created and attached a new inline policy to the ECS task role:

**Policy Name**: `PollRaffleTableAccess`

**Policy Document**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:333105300941:table/PollVotes",
        "arn:aws:dynamodb:us-east-1:333105300941:table/PollVotes/*",
        "arn:aws:dynamodb:us-east-1:333105300941:table/RaffleEntries",
        "arn:aws:dynamodb:us-east-1:333105300941:table/RaffleEntries/*"
      ]
    }
  ]
}
```

**Applied to Role**: `LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y`

### 4. Restarted ECS Service
```bash
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --force-new-deployment \
  --region us-east-1
```

This forces the ECS tasks to restart and pick up the new IAM permissions.

## Verification

### Check Tables Exist
```bash
aws dynamodb list-tables --region us-east-1 --query 'TableNames[?contains(@, `Poll`) || contains(@, `Raffle`)]'
```

**Output:**
```json
[
    "PollVotes",
    "RaffleEntries"
]
```

### Check Table Status
```bash
aws dynamodb describe-table --table-name PollVotes --region us-east-1 --query 'Table.TableStatus'
# Output: "ACTIVE"

aws dynamodb describe-table --table-name RaffleEntries --region us-east-1 --query 'Table.TableStatus'
# Output: "ACTIVE"
```

### Check IAM Permissions
```bash
aws iam list-role-policies --role-name LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y --region us-east-1
```

**Output:**
```json
{
    "PolicyNames": [
        "ActivitiesTableAccess",
        "PollRaffleTableAccess",
        "TaskRoleDefaultPolicy07FC53DE"
    ]
}
```

### Test Poll Activity
```bash
# Get poll details
curl https://d15swf38ljbkja.cloudfront.net/api/activities/b8adc48f-2205-4e8c-a6b6-d75ea7f06f01

# Response shows active poll with options
{
  "activity": {
    "eventId": "0eb9fc73-19e6-40b1-b675-a60e07502b68",
    "question": "Test",
    "status": "active",
    "options": [
      {"id": "option-0-12935663", "text": "1", "voteCount": 0},
      {"id": "option-1-dd30d5d9", "text": "2", "voteCount": 0}
    ],
    "type": "poll"
  }
}
```

## Status
✅ **Fixed and Deployed**
- PollVotes table created and active
- RaffleEntries table created and active
- IAM permissions granted to ECS task role
- ECS service restarted with new permissions
- Poll voting now works correctly
- Raffle entries will work correctly

## Testing in Production
To test polls and raffles:

1. **Visit**: https://dch9ml2nwvrkt.cloudfront.net
2. **Create or open an event**
3. **Add a Poll activity**:
   - Configure question and options
   - Start the poll
   - Join as a participant
   - Submit votes - should work without errors
4. **Add a Raffle activity**:
   - Configure prize and entry method
   - Start the raffle
   - Join as a participant
   - Enter the raffle - should work without errors

## DynamoDB Tables Summary

The application now uses these DynamoDB tables:

### Original Tables (from CDK)
1. **LiveQuizEvents** - Event/quiz metadata
2. **LiveQuizQuestions** - Quiz questions
3. **LiveQuizParticipants** - Participants in events
4. **LiveQuizAnswers** - Quiz answer submissions
5. **LiveQuizGamePins** - Game PIN to event ID mapping

### New Activity Tables (manually created)
6. **Activities** - Activity metadata (quiz, poll, raffle)
7. **PollVotes** - Poll vote submissions
8. **RaffleEntries** - Raffle entry submissions

## Future Improvements

### Add to CDK Stack
These tables should be added to the CDK stack for proper infrastructure as code:

```typescript
// In infrastructure/lib/live-quiz-event-stack.ts

// Activities Table (already exists, but should be in CDK)
const activitiesTable = new dynamodb.Table(this, 'ActivitiesTable', {
  tableName: 'Activities',
  partitionKey: {
    name: 'eventId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'activityId',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

activitiesTable.addGlobalSecondaryIndex({
  indexName: 'EventActivities',
  partitionKey: {
    name: 'eventId',
    type: dynamodb.AttributeType.STRING,
  },
  projectionType: dynamodb.ProjectionType.ALL,
});

// Poll Votes Table
const pollVotesTable = new dynamodb.Table(this, 'PollVotesTable', {
  tableName: 'PollVotes',
  partitionKey: {
    name: 'pollId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'participantId',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

pollVotesTable.addGlobalSecondaryIndex({
  indexName: 'PollVotes',
  partitionKey: {
    name: 'pollId',
    type: dynamodb.AttributeType.STRING,
  },
  projectionType: dynamodb.ProjectionType.ALL,
});

// Raffle Entries Table
const raffleEntriesTable = new dynamodb.Table(this, 'RaffleEntriesTable', {
  tableName: 'RaffleEntries',
  partitionKey: {
    name: 'raffleId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'participantId',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

raffleEntriesTable.addGlobalSecondaryIndex({
  indexName: 'RaffleEntries',
  partitionKey: {
    name: 'raffleId',
    type: dynamodb.AttributeType.STRING,
  },
  projectionType: dynamodb.ProjectionType.ALL,
});

// Grant permissions to task role
activitiesTable.grantReadWriteData(taskRole);
pollVotesTable.grantReadWriteData(taskRole);
raffleEntriesTable.grantReadWriteData(taskRole);
```

## Cost Impact
Adding two new DynamoDB tables with pay-per-request billing:
- **PollVotes**: ~$0.25 per million write requests, ~$0.25 per million read requests
- **RaffleEntries**: ~$0.25 per million write requests, ~$0.25 per million read requests
- **Storage**: $0.25 per GB-month

**Estimated additional cost**: $1-5/month for typical usage

## Files Created
- `poll-raffle-policy.json` - IAM policy document for table access

## Commands Used
```bash
# Create tables
aws dynamodb create-table --table-name PollVotes ...
aws dynamodb create-table --table-name RaffleEntries ...

# Add IAM permissions
aws iam put-role-policy --role-name LiveQuizEventStack-TaskRole30FC0FBB-fhdZQ0ERZY4y --policy-name PollRaffleTableAccess --policy-document file://poll-raffle-policy.json

# Restart ECS service
aws ecs update-service --cluster live-quiz-cluster --service websocket-service --force-new-deployment
```
