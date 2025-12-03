# Infrastructure Quick Start

## Current Production Setup

**Status**: ✅ Working perfectly

The infrastructure imports existing DynamoDB tables and manages permissions.

```bash
# Optional: Deploy CDK update to manage IAM via CDK
cd infrastructure
npx cdk diff
npx cdk deploy
```

## Fresh Deployment (New Environment)

### Step 1: Configure for Table Creation
Edit `lib/live-quiz-event-stack.ts`:
- **Line ~153-173**: Comment out table imports
- **Line ~175-270**: Uncomment table creation

### Step 2: Deploy Infrastructure
```bash
cd infrastructure

# First time only
npx cdk bootstrap

# Deploy stack
npx cdk deploy
```

### Step 3: Deploy Backend
```bash
cd ..
./deploy-backend.sh
```

### Step 4: Deploy Frontend
```bash
cd frontend
npm run build:prod

# Get bucket name from CDK outputs
aws s3 sync dist/ s3://live-quiz-frontend-<account-id>/

# Get distribution ID from CDK outputs
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

## Table Configuration Modes

### Import Mode (Current Production)
```typescript
const activitiesTable = dynamodb.Table.fromTableName(
  this,
  'ActivitiesTable',
  'Activities'
);
```
- ✅ Safe for production
- ✅ Preserves existing data
- ✅ No risk of deletion

### Create Mode (Fresh Deployments)
```typescript
const activitiesTable = new dynamodb.Table(this, 'ActivitiesTable', {
  tableName: 'Activities',
  // ... full configuration
});
```
- ✅ Automatic table creation
- ✅ Full IaC management
- ⚠️ Would delete existing tables if used in production

## Quick Commands

### Check Stack Status
```bash
cd infrastructure
npx cdk diff
```

### Deploy Updates
```bash
cd infrastructure
npx cdk deploy
```

### View Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Verify Tables
```bash
aws dynamodb list-tables --region us-east-1 | \
  grep -E "Activities|PollVotes|RaffleEntries"
```

## Documentation

- **ACTIVITY_TABLES_README.md** - Detailed table configuration guide
- **../INFRASTRUCTURE_UPDATE_GUIDE.md** - Full deployment guide
- **../CDK_UPDATE_COMPLETE.md** - Summary of CDK changes

## Support

For issues:
1. Check `ACTIVITY_TABLES_README.md` for troubleshooting
2. Review CloudWatch logs: `/ecs/live-quiz-websocket-server`
3. Verify IAM permissions
4. Check DynamoDB table status
