# Task 35: Quick Reference Guide

## Quick Start

### One-Command Deployment
```bash
./scripts/deploy-task35.sh production
```

### Phase 2 Specific Deployment
```bash
./scripts/deploy-phase2.sh production
```

## Prerequisites Check

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check Docker
docker info

# Check CDK
npx cdk --version

# Check Node.js
node -v  # Should be 18+
```

## Deployment Commands

### Infrastructure Only
```bash
cd infrastructure
npm install
npm run build
npx cdk deploy LiveQuizEventStack --require-approval never
```

### Backend Only
```bash
cd infrastructure/scripts
./deploy-backend.sh production
```

### Frontend Only
```bash
cd infrastructure/scripts
./deploy-frontend.sh production
```

## Testing Commands

### Automated Tests
```bash
./scripts/test-phase2-features.sh production
```

### Integration Tests
```bash
cd backend
npm test
```

## Get Deployment URLs

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs" \
  --output table

# Get frontend URL only
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text

# Get backend URL only
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
  --output text
```

## Monitoring Commands

### View Logs
```bash
# Real-time logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Last 100 lines
aws logs tail /ecs/live-quiz-websocket-server --since 10m

# Filter errors
aws logs tail /ecs/live-quiz-websocket-server --follow --filter-pattern "ERROR"
```

### Check ECS Service
```bash
# Service status
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service

# Running tasks
aws ecs list-tasks \
  --cluster live-quiz-cluster \
  --service-name websocket-service

# Task details
aws ecs describe-tasks \
  --cluster live-quiz-cluster \
  --tasks <task-arn>
```

### Check DynamoDB
```bash
# List tables
aws dynamodb list-tables

# Scan GamePins table
aws dynamodb scan --table-name LiveQuizGamePins --max-items 5

# Get item count
aws dynamodb describe-table \
  --table-name LiveQuizGamePins \
  --query "Table.ItemCount"
```

### Check S3
```bash
# List buckets
aws s3 ls

# List question images
aws s3 ls s3://live-quiz-question-images-<account-id>/

# Get bucket size
aws s3 ls s3://live-quiz-question-images-<account-id>/ \
  --recursive --summarize --human-readable
```

### Check CloudFront
```bash
# List distributions
aws cloudfront list-distributions \
  --query "DistributionList.Items[*].[Id,DomainName,Status]" \
  --output table

# Get distribution details
aws cloudfront get-distribution \
  --id <distribution-id>
```

## Troubleshooting

### ECS Task Not Starting
```bash
# Check task definition
aws ecs describe-task-definition \
  --task-definition <task-definition-name>

# Check stopped tasks
aws ecs list-tasks \
  --cluster live-quiz-cluster \
  --desired-status STOPPED

# Get stopped task details
aws ecs describe-tasks \
  --cluster live-quiz-cluster \
  --tasks <stopped-task-arn>
```

### WebSocket Connection Issues
```bash
# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check security groups
aws ec2 describe-security-groups \
  --group-ids <security-group-id>
```

### Frontend Not Loading
```bash
# Check CloudFront distribution
aws cloudfront get-distribution \
  --id <distribution-id>

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Check S3 bucket
aws s3 ls s3://live-quiz-frontend-<account-id>/
```

### Image Upload Issues
```bash
# Check S3 bucket CORS
aws s3api get-bucket-cors \
  --bucket live-quiz-question-images-<account-id>

# Check bucket policy
aws s3api get-bucket-policy \
  --bucket live-quiz-question-images-<account-id>

# Test image upload
aws s3 cp test-image.jpg \
  s3://live-quiz-question-images-<account-id>/test/
```

## Rollback Procedures

### Rollback ECS Service
```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix websocket-task

# Update service to previous task definition
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --task-definition <previous-task-definition>
```

### Rollback Frontend
```bash
# List S3 versions (if versioning enabled)
aws s3api list-object-versions \
  --bucket live-quiz-frontend-<account-id>

# Restore previous version
aws s3 sync s3://live-quiz-frontend-<account-id>-backup/ \
  s3://live-quiz-frontend-<account-id>/

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### Rollback Infrastructure
```bash
# List stack events
aws cloudformation describe-stack-events \
  --stack-name LiveQuizEventStack

# Rollback to previous version
npx cdk deploy LiveQuizEventStack --rollback
```

## Performance Optimization

### Scale ECS Service
```bash
# Update desired count
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --desired-count 3
```

### Enable Auto-Scaling
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/live-quiz-cluster/websocket-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/live-quiz-cluster/websocket-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Cost Monitoring

### Check Current Costs
```bash
# Get cost and usage
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

### Set Budget Alert
```bash
# Create budget
aws budgets create-budget \
  --account-id <account-id> \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## Security Checks

### Check IAM Roles
```bash
# List roles
aws iam list-roles --query "Roles[?contains(RoleName, 'LiveQuiz')]"

# Get role policy
aws iam get-role-policy \
  --role-name <role-name> \
  --policy-name <policy-name>
```

### Check Security Groups
```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*LiveQuiz*"

# Check inbound rules
aws ec2 describe-security-groups \
  --group-ids <security-group-id> \
  --query "SecurityGroups[0].IpPermissions"
```

### Check S3 Bucket Security
```bash
# Check public access block
aws s3api get-public-access-block \
  --bucket live-quiz-frontend-<account-id>

# Check bucket encryption
aws s3api get-bucket-encryption \
  --bucket live-quiz-frontend-<account-id>
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Live Quiz aliases
alias lq-logs='aws logs tail /ecs/live-quiz-websocket-server --follow'
alias lq-ecs='aws ecs describe-services --cluster live-quiz-cluster --services websocket-service'
alias lq-tasks='aws ecs list-tasks --cluster live-quiz-cluster --service-name websocket-service'
alias lq-url='aws cloudformation describe-stacks --stack-name LiveQuizEventStack --query "Stacks[0].Outputs[?OutputKey=='\''CloudFrontURL'\''].OutputValue" --output text'
alias lq-deploy='cd ~/path/to/project && ./scripts/deploy-task35.sh production'
```

## Documentation Links

- **Deployment Verification**: `TASK_35_DEPLOYMENT_VERIFICATION.md`
- **Manual Testing Guide**: `TASK_35_MANUAL_TESTING_GUIDE.md`
- **Completion Summary**: `TASK_35_COMPLETION_SUMMARY.md`
- **Phase 2 Guide**: `PHASE2_DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

## Support

### AWS Support
- AWS Console: https://console.aws.amazon.com/
- AWS Support: https://console.aws.amazon.com/support/

### Project Documentation
- README: `README.md`
- Getting Started: `GETTING_STARTED.md`
- Local Development: `LOCAL_DEVELOPMENT.md`

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-11-28
**Task:** 35. Final deployment and testing of Phase 2 features
