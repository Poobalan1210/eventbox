# Deployment Configuration Guide

This document describes the deployment configuration and scripts for the Live Quiz Event System.

## Environment Configuration

The application supports three environments:
- **development**: Development environment for testing
- **staging**: Pre-production environment for final testing
- **production**: Production environment for live users

## Environment Variables

### Backend Environment Variables

Environment-specific configuration files are located in `backend/`:
- `.env.local` - Local development with DynamoDB Local
- `.env.development` - AWS development environment
- `.env.staging` - AWS staging environment
- `.env.production` - AWS production environment

Key variables:
```bash
AWS_REGION=us-east-1
EVENTS_TABLE=LiveQuizEvents
QUESTIONS_TABLE=LiveQuizQuestions
PARTICIPANTS_TABLE=LiveQuizParticipants
ANSWERS_TABLE=LiveQuizAnswers
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

### Frontend Environment Variables

Environment-specific configuration files are located in `frontend/`:
- `.env` - Local development
- `.env.development` - AWS development environment
- `.env.staging` - AWS staging environment
- `.env.production` - AWS production environment

Key variables:
```bash
VITE_WS_URL=https://api.your-domain.com
VITE_API_URL=https://api.your-domain.com
```

## Deployment Scripts

All deployment scripts are located in `infrastructure/scripts/`:

### 1. Complete Deployment

Deploy the entire stack (infrastructure + backend + frontend):

```bash
# Deploy to production
npm run deploy:prod
# or
./infrastructure/scripts/deploy-all.sh production

# Deploy to staging
npm run deploy:staging
# or
./infrastructure/scripts/deploy-all.sh staging

# Deploy to development
npm run deploy:dev
# or
./infrastructure/scripts/deploy-all.sh development
```

### 2. Backend Deployment Only

Deploy only the backend (build Docker image, push to ECR, update ECS):

```bash
# Deploy backend to production
npm run deploy:backend production
# or
./infrastructure/scripts/deploy-backend.sh production

# Deploy backend to staging
./infrastructure/scripts/deploy-backend.sh staging
```

### 3. Frontend Deployment Only

Deploy only the frontend (build and upload to S3, invalidate CloudFront):

```bash
# Deploy frontend to production
npm run deploy:frontend production
# or
./infrastructure/scripts/deploy-frontend.sh production

# Deploy frontend to staging
./infrastructure/scripts/deploy-frontend.sh staging
```

### 4. Build and Push Docker Image

Build and push Docker image to ECR without deploying:

```bash
# Build and push with custom tag
npm run build:push production v1.0.0
# or
./infrastructure/scripts/build-and-push.sh production v1.0.0

# Build and push with latest tag
./infrastructure/scripts/build-and-push.sh production latest
```

### 5. Update ECS Service

Force a new deployment of the ECS service:

```bash
./infrastructure/scripts/update-ecs-service.sh production
```

### 6. Invalidate CloudFront Cache

Invalidate CloudFront cache for specific paths:

```bash
# Invalidate all paths
npm run invalidate:cloudfront production "/*"
# or
./infrastructure/scripts/invalidate-cloudfront.sh production "/*"

# Invalidate specific paths
./infrastructure/scripts/invalidate-cloudfront.sh production "/index.html /assets/*"
```

## Deployment Workflow

### Initial Deployment

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Update environment variables**:
   - Edit `backend/.env.production` with your configuration
   - Edit `frontend/.env.production` with your API URLs

3. **Deploy infrastructure**:
   ```bash
   cd infrastructure
   npm run build
   cdk bootstrap  # Only needed once per AWS account/region
   cdk deploy
   ```

4. **Get stack outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name LiveQuizEventStack \
     --query "Stacks[0].Outputs"
   ```

5. **Update environment variables with actual URLs**:
   - Update `backend/.env.production` with CloudFront URL for CORS
   - Update `frontend/.env.production` with ALB URL

6. **Deploy backend**:
   ```bash
   npm run deploy:backend production
   ```

7. **Deploy frontend**:
   ```bash
   npm run deploy:frontend production
   ```

### Subsequent Deployments

For code changes only:

```bash
# Backend changes
npm run deploy:backend production

# Frontend changes
npm run deploy:frontend production

# Both
npm run deploy:all production
```

## Build Scripts

### Frontend Build

The frontend build script is defined in `frontend/package.json`:

```bash
npm run build:frontend
```

This runs:
1. TypeScript compilation (`tsc`)
2. Vite build (outputs to `frontend/dist/`)

### Backend Build

The backend build script is defined in `backend/package.json`:

```bash
npm run build:backend
```

This runs:
1. TypeScript compilation (`tsc`)
2. Outputs to `backend/dist/`

### Infrastructure Build

The infrastructure build script is defined in `infrastructure/package.json`:

```bash
npm run build:infrastructure
```

This compiles the CDK TypeScript code.

## Docker Configuration

### Dockerfile

The backend Dockerfile is located at `backend/Dockerfile` and uses a multi-stage build:

1. **Builder stage**: Installs dependencies and compiles TypeScript
2. **Production stage**: Copies compiled code and production dependencies only

Key features:
- Uses Node.js 20 Alpine for small image size
- Runs as non-root user for security
- Includes health check endpoint
- Exposes port 3000

### Building Docker Image Locally

```bash
cd backend
docker build -t live-quiz-backend:latest .
```

### Running Docker Image Locally

```bash
docker run -p 3000:3000 \
  -e AWS_REGION=us-east-1 \
  -e EVENTS_TABLE=LiveQuizEvents \
  -e QUESTIONS_TABLE=LiveQuizQuestions \
  -e PARTICIPANTS_TABLE=LiveQuizParticipants \
  -e ANSWERS_TABLE=LiveQuizAnswers \
  live-quiz-backend:latest
```

## Environment-Specific Stack Names

The CDK stack names follow this pattern:

- **Production**: `LiveQuizEventStack`
- **Staging**: `LiveQuizEventStack-staging`
- **Development**: `LiveQuizEventStack-development`

This allows multiple environments to coexist in the same AWS account.

## Monitoring Deployment

### Check ECS Service Status

```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --region us-east-1
```

### View ECS Logs

```bash
aws logs tail /ecs/live-quiz-websocket-server --follow --region us-east-1
```

### Check CloudFront Invalidation Status

```bash
aws cloudfront get-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --id YOUR_INVALIDATION_ID
```

### View Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs" \
  --region us-east-1
```

## Rollback Procedures

### Rollback Backend

1. Find previous task definition:
   ```bash
   aws ecs list-task-definitions \
     --family-prefix websocket-task \
     --sort DESC
   ```

2. Update service to use previous task definition:
   ```bash
   aws ecs update-service \
     --cluster live-quiz-cluster \
     --service websocket-service \
     --task-definition websocket-task:PREVIOUS_REVISION
   ```

### Rollback Frontend

1. Restore previous S3 version (if versioning enabled)
2. Or redeploy previous frontend build
3. Invalidate CloudFront cache

### Rollback Infrastructure

```bash
cd infrastructure
cdk deploy --rollback
```

## Troubleshooting

### Docker Build Fails

- Check that all dependencies are in `package.json`
- Verify TypeScript compiles without errors: `npm run build`
- Check Docker daemon is running

### ECS Task Fails to Start

- Check CloudWatch logs: `aws logs tail /ecs/live-quiz-websocket-server --follow`
- Verify environment variables are set correctly
- Check IAM role has DynamoDB permissions
- Verify security groups allow traffic

### Frontend Not Loading

- Check CloudFront distribution status
- Verify S3 bucket has files: `aws s3 ls s3://your-bucket-name/`
- Check browser console for errors
- Verify environment variables are set correctly

### WebSocket Connection Fails

- Check ALB health checks are passing
- Verify security groups allow traffic on port 80/443
- Check CORS configuration in backend
- Verify WebSocket URL in frontend environment variables

## Security Best Practices

1. **Use HTTPS**: Configure SSL certificate for CloudFront and ALB
2. **Restrict CORS**: Set specific origins in `CORS_ORIGIN` environment variable
3. **Enable encryption**: DynamoDB encryption at rest is enabled by default
4. **Use IAM roles**: Never hardcode AWS credentials
5. **Enable CloudWatch**: Monitor logs and metrics
6. **Use secrets manager**: For sensitive configuration (future enhancement)
7. **Enable WAF**: Add AWS WAF for CloudFront (future enhancement)

## Cost Optimization

1. **Use appropriate instance sizes**: Start with small ECS tasks and scale as needed
2. **Enable auto-scaling**: Configure ECS auto-scaling based on CPU/memory
3. **Use CloudFront caching**: Reduce origin requests
4. **DynamoDB on-demand**: Pay only for what you use
5. **Clean up old resources**: Delete unused ECR images, CloudWatch logs

## Next Steps

1. Configure custom domain name
2. Set up SSL certificates with AWS Certificate Manager
3. Configure Route 53 for DNS
4. Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
5. Enable monitoring and alerting
6. Configure auto-scaling policies
7. Set up backup and disaster recovery
