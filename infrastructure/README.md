# Live Quiz Event - AWS Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Live Quiz Event system.

## Architecture Overview

The infrastructure includes:

- **DynamoDB Tables**: Events, Questions, Participants, and Answers with appropriate indexes
- **S3 + CloudFront**: Static frontend hosting with HTTPS
- **ECS Fargate**: WebSocket server for real-time communication
- **Application Load Balancer**: Routes traffic to ECS tasks
- **VPC**: Network isolation with public and private subnets
- **IAM Roles**: Secure access to AWS services
- **CloudWatch Logs**: Centralized logging

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

2. **Node.js** (v18 or later) and npm installed

3. **AWS CDK CLI** installed globally
   ```bash
   npm install -g aws-cdk
   ```

4. **Docker** installed (for building container images)

## Installation

Install dependencies:

```bash
cd infrastructure
npm install
```

## Bootstrap CDK (First Time Only)

If this is your first time using CDK in your AWS account/region:

```bash
cdk bootstrap
```

## Deployment

### 1. Review the Infrastructure

Generate and review the CloudFormation template:

```bash
npm run synth
```

### 2. Preview Changes

See what changes will be made:

```bash
npm run diff
```

### 3. Deploy the Stack

Deploy all infrastructure:

```bash
npm run deploy
```

Or use CDK directly:

```bash
cdk deploy
```

The deployment will output important values like:
- CloudFront URL for the frontend
- ALB URL for the WebSocket server
- DynamoDB table names
- S3 bucket name

### 4. Build and Deploy Backend Container

After the infrastructure is deployed, you need to build and push the backend Docker image:

1. Create an ECR repository (if not exists):
   ```bash
   aws ecr create-repository --repository-name live-quiz-backend
   ```

2. Build the Docker image (from project root):
   ```bash
   cd ../backend
   docker build -t live-quiz-backend .
   ```

3. Tag and push to ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag live-quiz-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/live-quiz-backend:latest
   
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/live-quiz-backend:latest
   ```

4. Update the task definition in `lib/live-quiz-event-stack.ts` to use your ECR image:
   ```typescript
   image: ecs.ContainerImage.fromRegistry('<account-id>.dkr.ecr.us-east-1.amazonaws.com/live-quiz-backend:latest'),
   ```

5. Redeploy the stack:
   ```bash
   cdk deploy
   ```

### 5. Deploy Frontend to S3

Build and deploy the frontend:

```bash
cd ../frontend
npm run build

# Upload to S3 (replace bucket name from CDK output)
aws s3 sync dist/ s3://live-quiz-frontend-<account-id>/ --delete

# Invalidate CloudFront cache (replace distribution ID from CDK output)
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

## Environment Variables

The ECS task is configured with the following environment variables:

- `NODE_ENV`: production
- `AWS_REGION`: Deployment region
- `EVENTS_TABLE_NAME`: DynamoDB Events table name
- `QUESTIONS_TABLE_NAME`: DynamoDB Questions table name
- `PARTICIPANTS_TABLE_NAME`: DynamoDB Participants table name
- `ANSWERS_TABLE_NAME`: DynamoDB Answers table name
- `PORT`: 3000

## DynamoDB Table Structure

### Events Table
- **Partition Key**: `eventId` (String)
- **Attributes**: name, organizerId, status, currentQuestionIndex, createdAt, joinLink

### Questions Table
- **Partition Key**: `eventId` (String)
- **Sort Key**: `questionId` (String)
- **GSI**: `eventId-order-index` (for ordered retrieval)
- **Attributes**: text, options, correctOptionId, timerSeconds, order

### Participants Table
- **Partition Key**: `eventId` (String)
- **Sort Key**: `participantId` (String)
- **Attributes**: name, score, totalAnswerTime, joinedAt

### Answers Table
- **Partition Key**: `participantId` (String)
- **Sort Key**: `questionId` (String)
- **GSI**: `eventId-questionId-index` (for aggregation)
- **Attributes**: eventId, selectedOptionId, responseTime, isCorrect, submittedAt

## Security Features

- **HTTPS Only**: CloudFront enforces HTTPS
- **Encryption**: DynamoDB tables use AWS-managed encryption
- **Private Subnets**: ECS tasks run in private subnets
- **Security Groups**: Restrict traffic between components
- **IAM Roles**: Least privilege access to AWS services
- **VPC**: Network isolation

## Monitoring

- **CloudWatch Logs**: ECS task logs are sent to `/ecs/live-quiz-websocket-server`
- **Container Insights**: Enabled on ECS cluster for metrics
- **ALB Health Checks**: Monitor service health at `/health` endpoint

## Cost Optimization

For development/testing:
- Uses 1 NAT Gateway (consider 0 for dev with public subnets)
- Single ECS task (scale up for production)
- On-demand DynamoDB billing
- CloudFront PriceClass 100 (North America and Europe)

For production:
- Increase NAT Gateways to 2 for high availability
- Scale ECS tasks based on load
- Consider Reserved Capacity for DynamoDB
- Add CloudFront custom domain with ACM certificate

## Cleanup

To destroy all resources:

```bash
npm run destroy
```

Or:

```bash
cdk destroy
```

**Warning**: This will delete all data in DynamoDB tables and S3 buckets.

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch Logs:
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### WebSocket Connection Issues

1. Verify ALB health checks are passing
2. Check security group rules
3. Ensure ECS tasks are running
4. Test ALB endpoint directly

### Frontend Not Loading

1. Verify S3 bucket has files
2. Check CloudFront distribution status
3. Invalidate CloudFront cache
4. Check browser console for errors

## Production Considerations

Before going to production:

1. **Change Removal Policies**: Set to `RETAIN` for data persistence
2. **Enable HTTPS on ALB**: Add ACM certificate
3. **Custom Domain**: Configure Route 53 and ACM
4. **Auto Scaling**: Configure ECS service auto-scaling
5. **Monitoring**: Set up CloudWatch alarms
6. **Backup**: Enable DynamoDB backups
7. **WAF**: Add AWS WAF for DDoS protection
8. **Secrets**: Use AWS Secrets Manager for sensitive data
9. **CI/CD**: Implement automated deployment pipeline
10. **Multi-AZ**: Increase NAT Gateways and ECS tasks

## Support

For issues or questions, refer to:
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
