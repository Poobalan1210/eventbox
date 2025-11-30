# Quick Deployment Commands Reference

## Prerequisites

```bash
# Install dependencies
npm install

# Configure AWS credentials
aws configure

# Bootstrap CDK (only once per account/region)
cd infrastructure
cdk bootstrap
```

## Full Stack Deployment

```bash
# Production
npm run deploy:prod

# Staging
npm run deploy:staging

# Development
npm run deploy:dev
```

## Component Deployments

### Backend Only
```bash
npm run deploy:backend production
npm run deploy:backend staging
npm run deploy:backend development
```

### Frontend Only
```bash
npm run deploy:frontend production
npm run deploy:frontend staging
npm run deploy:frontend development
```

### Infrastructure Only
```bash
cd infrastructure
npm run deploy
```

## Docker Operations

### Build and Push to ECR
```bash
# With version tag
npm run build:push production v1.0.0

# Latest tag
npm run build:push production latest
```

### Build Locally
```bash
cd backend
npm run build
docker build -t live-quiz-backend:latest .
```

## CloudFront Operations

### Invalidate Cache
```bash
# All paths
npm run invalidate:cloudfront production "/*"

# Specific paths
./infrastructure/scripts/invalidate-cloudfront.sh production "/index.html /assets/*"
```

## ECS Operations

### Force New Deployment
```bash
./infrastructure/scripts/update-ecs-service.sh production
```

### View Logs
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow --region us-east-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --region us-east-1
```

## Monitoring

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs" \
  --region us-east-1
```

### Check CloudFront Distribution
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Live Quiz Frontend'].{Id:Id,Status:Status,DomainName:DomainName}"
```

### View Recent ECS Events
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --query 'services[0].events[0:5]' \
  --region us-east-1
```

## Local Development

### Start Local Environment
```bash
npm run dev
```

### Start Individual Services
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Database only
npm run db:start
```

### Stop Local Database
```bash
npm run db:stop
```

## Troubleshooting

### View Backend Logs
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow --region us-east-1
```

### Check ECR Images
```bash
aws ecr describe-images \
  --repository-name live-quiz-backend \
  --region us-east-1
```

### Test Health Endpoint
```bash
# Get ALB URL from stack outputs
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
  --output text)

# Test health endpoint
curl ${ALB_URL}/health
```

## Cleanup

### Delete Stack
```bash
cd infrastructure
cdk destroy LiveQuizEventStack
```

### Delete ECR Images
```bash
aws ecr batch-delete-image \
  --repository-name live-quiz-backend \
  --image-ids imageTag=latest \
  --region us-east-1
```

### Empty S3 Bucket
```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 rm s3://${BUCKET_NAME}/ --recursive
```
