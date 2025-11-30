# Live Quiz Event - Deployment Guide

This guide walks you through deploying the Live Quiz Event system to AWS.

## Prerequisites Checklist

- [ ] AWS Account with appropriate permissions
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js v18+ and npm installed
- [ ] Docker installed and running
- [ ] AWS CDK CLI installed (`npm install -g aws-cdk`)
- [ ] Git repository cloned locally

## Deployment Steps

### Step 1: Install Dependencies

```bash
# Install infrastructure dependencies
cd infrastructure
npm install

# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Bootstrap AWS CDK (First Time Only)

If this is your first time using CDK in your AWS account/region:

```bash
cd infrastructure
cdk bootstrap
```

This creates the necessary S3 bucket and IAM roles for CDK deployments.

### Step 3: Review Infrastructure

Preview the CloudFormation template:

```bash
npm run synth
```

Review the generated template in `cdk.out/LiveQuizEventStack.template.json`.

### Step 4: Deploy Infrastructure

Deploy all AWS resources:

```bash
npm run deploy
```

This will create:
- 4 DynamoDB tables (Events, Questions, Participants, Answers)
- S3 bucket for frontend hosting
- CloudFront distribution with HTTPS
- VPC with public and private subnets
- ECS Fargate cluster
- Application Load Balancer
- Security groups and IAM roles
- CloudWatch log groups

**Important**: Save the output values displayed after deployment. You'll need:
- `FrontendBucketName`
- `CloudFrontURL`
- `CloudFrontDistributionId`
- `WebSocketALBURL`
- DynamoDB table names

### Step 5: Update Backend Configuration

Before deploying the backend container, update the image reference in the CDK stack.

1. Note your AWS account ID:
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

2. Edit `infrastructure/lib/live-quiz-event-stack.ts` and update the container image:
   ```typescript
   image: ecs.ContainerImage.fromRegistry(
     '<account-id>.dkr.ecr.us-east-1.amazonaws.com/live-quiz-backend:latest'
   ),
   ```

3. Redeploy the infrastructure:
   ```bash
   npm run deploy
   ```

### Step 6: Deploy Backend Container

Use the provided script to build and deploy the backend:

```bash
cd infrastructure/scripts
./deploy-backend.sh
```

This script will:
1. Create ECR repository (if needed)
2. Build Docker image from backend code
3. Push image to ECR
4. Update ECS service with new image

Monitor the deployment:
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --query "services[0].deployments"
```

Check logs:
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### Step 7: Configure Frontend Environment

Update the frontend to use the deployed backend:

1. Get the WebSocket ALB URL from CDK outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name LiveQuizEventStack \
     --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
     --output text
   ```

2. Update `frontend/.env` or `frontend/src/config.ts` with the backend URL:
   ```
   VITE_WEBSOCKET_URL=http://<alb-dns-name>
   VITE_API_URL=http://<alb-dns-name>/api
   ```

### Step 8: Deploy Frontend

Use the provided script to build and deploy the frontend:

```bash
cd infrastructure/scripts
./deploy-frontend.sh
```

This script will:
1. Build the React application
2. Upload files to S3
3. Invalidate CloudFront cache

Wait for CloudFront invalidation to complete (usually 1-2 minutes):
```bash
aws cloudfront wait invalidation-completed \
  --distribution-id <distribution-id> \
  --id <invalidation-id>
```

### Step 9: Verify Deployment

1. **Test Frontend**: Open the CloudFront URL in your browser
   ```
   https://<distribution-id>.cloudfront.net
   ```

2. **Test Backend Health**: Check the ALB health endpoint
   ```bash
   curl http://<alb-dns-name>/health
   ```

3. **Test WebSocket**: Create an event and verify real-time updates work

4. **Check ECS Tasks**: Ensure tasks are running
   ```bash
   aws ecs list-tasks --cluster live-quiz-cluster
   ```

5. **Monitor Logs**: Watch for any errors
   ```bash
   aws logs tail /ecs/live-quiz-websocket-server --follow
   ```

## Post-Deployment Configuration

### Enable HTTPS for Backend (Recommended)

For production, add an ACM certificate to the ALB:

1. Request a certificate in ACM for your domain
2. Update the CDK stack to add HTTPS listener:
   ```typescript
   const httpsListener = alb.addListener('HTTPSListener', {
     port: 443,
     protocol: elbv2.ApplicationProtocol.HTTPS,
     certificates: [certificate],
   });
   ```
3. Redeploy: `npm run deploy`

### Configure Custom Domain

1. Create a Route 53 hosted zone for your domain
2. Add CloudFront alias record
3. Update frontend environment variables
4. Redeploy frontend

### Enable Auto Scaling

Add auto-scaling to the ECS service:

```typescript
const scaling = service.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 10,
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
});
```

### Set Up Monitoring

1. Create CloudWatch alarms for:
   - ECS CPU/Memory utilization
   - ALB target health
   - DynamoDB throttling
   - CloudFront 5xx errors

2. Configure SNS topic for alerts

3. Enable AWS X-Ray for distributed tracing

## Updating the Application

### Update Backend

```bash
cd infrastructure/scripts
./deploy-backend.sh
```

### Update Frontend

```bash
cd infrastructure/scripts
./deploy-frontend.sh
```

### Update Infrastructure

```bash
cd infrastructure
npm run deploy
```

## Rollback Procedures

### Rollback Backend

Deploy a previous image version:

```bash
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --task-definition <previous-task-definition-arn> \
  --force-new-deployment
```

### Rollback Frontend

Restore previous S3 version or redeploy from git:

```bash
git checkout <previous-commit>
cd infrastructure/scripts
./deploy-frontend.sh
```

### Rollback Infrastructure

```bash
cd infrastructure
cdk deploy --rollback
```

## Troubleshooting

### ECS Tasks Failing to Start

1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/live-quiz-websocket-server --follow
   ```

2. Verify IAM permissions for task role

3. Check security group rules

4. Ensure ECR image exists and is accessible

### WebSocket Connection Failures

1. Verify ALB health checks are passing:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn>
   ```

2. Check ECS task logs for errors

3. Verify security group allows traffic from ALB to ECS

4. Test ALB endpoint directly:
   ```bash
   curl http://<alb-dns-name>/health
   ```

### Frontend Not Loading

1. Check S3 bucket contents:
   ```bash
   aws s3 ls s3://<bucket-name>/
   ```

2. Verify CloudFront distribution is deployed:
   ```bash
   aws cloudfront get-distribution --id <distribution-id>
   ```

3. Check browser console for errors

4. Verify CORS settings on backend

### DynamoDB Throttling

1. Check CloudWatch metrics for throttled requests

2. Consider switching to provisioned capacity

3. Review access patterns and optimize queries

## Cost Estimation

Approximate monthly costs (us-east-1):

- **DynamoDB**: $1-5 (on-demand, low traffic)
- **ECS Fargate**: $15-30 (1 task, 0.25 vCPU, 0.5 GB)
- **ALB**: $16-20 (base cost + data processing)
- **NAT Gateway**: $32-45 (1 gateway + data transfer)
- **CloudFront**: $1-10 (depends on traffic)
- **S3**: $1-2 (storage + requests)
- **CloudWatch Logs**: $1-5 (depends on log volume)

**Total**: ~$67-117/month for low-traffic development environment

Production costs will scale with:
- Number of ECS tasks
- Data transfer volume
- DynamoDB read/write capacity
- CloudFront data transfer

## Security Best Practices

- [ ] Enable AWS CloudTrail for audit logging
- [ ] Configure AWS Config for compliance monitoring
- [ ] Enable GuardDuty for threat detection
- [ ] Use AWS Secrets Manager for sensitive configuration
- [ ] Implement AWS WAF rules for DDoS protection
- [ ] Enable VPC Flow Logs
- [ ] Rotate IAM credentials regularly
- [ ] Use least privilege IAM policies
- [ ] Enable MFA for AWS console access
- [ ] Regular security patching of container images

## Cleanup

To delete all resources and avoid charges:

```bash
cd infrastructure
npm run destroy
```

**Warning**: This will permanently delete:
- All DynamoDB data
- S3 bucket contents
- CloudWatch logs
- All infrastructure resources

## Support Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
