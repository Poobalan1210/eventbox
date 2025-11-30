# Deployment Scripts

This directory contains all deployment scripts for the Live Quiz Event System.

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-all.sh` | Deploy complete stack (infrastructure + backend + frontend) | `./deploy-all.sh [environment]` |
| `deploy-backend.sh` | Deploy backend only (build, push, update ECS) | `./deploy-backend.sh [environment]` |
| `deploy-frontend.sh` | Deploy frontend only (build, upload to S3, invalidate cache) | `./deploy-frontend.sh [environment]` |
| `build-and-push.sh` | Build and push Docker image to ECR | `./build-and-push.sh [environment] [tag]` |
| `update-ecs-service.sh` | Force new ECS deployment | `./update-ecs-service.sh [environment]` |
| `invalidate-cloudfront.sh` | Invalidate CloudFront cache | `./invalidate-cloudfront.sh [environment] [paths]` |

## Environments

All scripts support three environments:
- `development` - Development environment
- `staging` - Staging environment
- `production` - Production environment (default)

## Prerequisites

1. **AWS CLI**: Install and configure AWS CLI
   ```bash
   aws configure
   ```

2. **Docker**: Required for building backend images
   ```bash
   docker --version
   ```

3. **Node.js**: Required for building frontend and infrastructure
   ```bash
   node --version
   npm --version
   ```

4. **AWS CDK**: Required for infrastructure deployment
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

5. **AWS Permissions**: Ensure your AWS credentials have permissions for:
   - CloudFormation
   - S3
   - CloudFront
   - ECR
   - ECS
   - DynamoDB
   - IAM
   - VPC
   - Application Load Balancer
   - CloudWatch Logs

## Usage Examples

### Complete Deployment

Deploy everything (infrastructure, backend, and frontend):

```bash
# Production
./deploy-all.sh production

# Staging
./deploy-all.sh staging

# Development
./deploy-all.sh development
```

### Backend Deployment

Deploy only the backend service:

```bash
# Production
./deploy-backend.sh production

# Staging
./deploy-backend.sh staging
```

This script will:
1. Create ECR repository if it doesn't exist
2. Login to ECR
3. Build Docker image with environment-specific configuration
4. Tag and push image to ECR
5. Force new ECS deployment

### Frontend Deployment

Deploy only the frontend:

```bash
# Production
./deploy-frontend.sh production

# Staging
./deploy-frontend.sh staging
```

This script will:
1. Fetch stack outputs (S3 bucket, CloudFront distribution)
2. Build frontend with environment-specific configuration
3. Upload build files to S3
4. Invalidate CloudFront cache

### Build and Push Docker Image

Build and push Docker image without deploying:

```bash
# With version tag
./build-and-push.sh production v1.0.0

# With latest tag
./build-and-push.sh production latest

# Staging with custom tag
./build-and-push.sh staging feature-xyz
```

### Update ECS Service

Force a new deployment of the ECS service (useful after pushing a new image):

```bash
./update-ecs-service.sh production
```

### Invalidate CloudFront Cache

Invalidate CloudFront cache for specific paths:

```bash
# Invalidate all paths
./invalidate-cloudfront.sh production "/*"

# Invalidate specific paths
./invalidate-cloudfront.sh production "/index.html /assets/*"

# Invalidate staging
./invalidate-cloudfront.sh staging "/*"
```

## Environment Variables

### Backend Environment Variables

Each environment uses a specific `.env` file from the `backend/` directory:
- `backend/.env.local` - Local development
- `backend/.env.development` - AWS development
- `backend/.env.staging` - AWS staging
- `backend/.env.production` - AWS production

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

Each environment uses a specific `.env` file from the `frontend/` directory:
- `frontend/.env` - Local development
- `frontend/.env.development` - AWS development
- `frontend/.env.staging` - AWS staging
- `frontend/.env.production` - AWS production

Key variables:
```bash
VITE_WS_URL=https://api.your-domain.com
VITE_API_URL=https://api.your-domain.com
```

## Script Details

### deploy-all.sh

**Purpose**: Deploy the complete stack in the correct order.

**Steps**:
1. Deploy infrastructure (CDK)
2. Deploy backend (Docker + ECS)
3. Deploy frontend (S3 + CloudFront)

**Output**: URLs for frontend and backend

**Example**:
```bash
./deploy-all.sh production
```

### deploy-backend.sh

**Purpose**: Build and deploy the backend WebSocket server.

**Steps**:
1. Create ECR repository (if needed)
2. Login to ECR
3. Copy environment-specific .env file
4. Build Docker image
5. Tag image with latest and timestamp
6. Push to ECR
7. Update ECS service

**Example**:
```bash
./deploy-backend.sh production
```

### deploy-frontend.sh

**Purpose**: Build and deploy the frontend React application.

**Steps**:
1. Fetch stack outputs (bucket name, distribution ID)
2. Build frontend with environment-specific configuration
3. Update environment variables with actual backend URL
4. Upload to S3 with appropriate cache headers
5. Invalidate CloudFront cache

**Example**:
```bash
./deploy-frontend.sh production
```

### build-and-push.sh

**Purpose**: Build and push Docker image without deploying.

**Parameters**:
- `environment`: development, staging, or production
- `tag`: Image tag (default: latest)

**Example**:
```bash
./build-and-push.sh production v1.2.3
```

### update-ecs-service.sh

**Purpose**: Force a new deployment of the ECS service.

**Use case**: After pushing a new Docker image with the same tag.

**Example**:
```bash
./update-ecs-service.sh production
```

### invalidate-cloudfront.sh

**Purpose**: Invalidate CloudFront cache for specific paths.

**Parameters**:
- `environment`: development, staging, or production
- `paths`: Space-separated paths to invalidate (default: /*)

**Example**:
```bash
./invalidate-cloudfront.sh production "/index.html /assets/*"
```

## Monitoring Deployments

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

### Check CloudFront Invalidation

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

## Troubleshooting

### Script Fails with "Permission Denied"

Make scripts executable:
```bash
chmod +x infrastructure/scripts/*.sh
```

### Docker Build Fails

1. Check Docker is running: `docker ps`
2. Verify backend builds: `cd backend && npm run build`
3. Check Dockerfile syntax

### ECR Login Fails

1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify region: `echo $AWS_REGION`
3. Check ECR permissions in IAM

### ECS Task Fails to Start

1. Check CloudWatch logs: `aws logs tail /ecs/live-quiz-websocket-server --follow`
2. Verify environment variables in task definition
3. Check IAM role permissions
4. Verify security groups

### Frontend Not Loading

1. Check S3 bucket contents: `aws s3 ls s3://your-bucket-name/`
2. Verify CloudFront distribution status
3. Check browser console for errors
4. Verify environment variables

### CloudFront Invalidation Takes Too Long

CloudFront invalidations can take 10-15 minutes. Monitor status:
```bash
aws cloudfront get-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --id YOUR_INVALIDATION_ID
```

## Best Practices

1. **Test in development first**: Always test deployments in development before staging/production
2. **Use version tags**: Tag Docker images with version numbers for easy rollback
3. **Monitor logs**: Watch CloudWatch logs during deployment
4. **Backup data**: Ensure DynamoDB backups are enabled
5. **Use CI/CD**: Automate deployments with GitHub Actions or AWS CodePipeline
6. **Document changes**: Keep a changelog of deployments
7. **Test rollback**: Practice rollback procedures in development

## Security Notes

1. **Never commit .env files**: Environment files contain sensitive information
2. **Use IAM roles**: Don't hardcode AWS credentials in production
3. **Enable HTTPS**: Always use HTTPS for production
4. **Restrict CORS**: Set specific origins, not wildcards
5. **Review IAM permissions**: Follow principle of least privilege
6. **Enable encryption**: Use encryption at rest and in transit
7. **Monitor access**: Enable CloudTrail and review logs regularly

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain and SSL
3. Enable auto-scaling
4. Set up monitoring and alerting
5. Configure backup and disaster recovery
6. Implement blue-green deployments
7. Add performance monitoring
