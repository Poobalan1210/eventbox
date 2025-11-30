# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Live Quiz Event System.

## Pre-Deployment Checklist

### 1. Prerequisites
- [ ] AWS CLI installed and configured (`aws --version`)
- [ ] Docker installed and running (`docker ps`)
- [ ] Node.js and npm installed (`node --version`)
- [ ] AWS CDK installed (`cdk --version`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)

### 2. AWS Permissions
Verify your AWS user/role has permissions for:
- [ ] CloudFormation (create/update/delete stacks)
- [ ] S3 (create buckets, upload objects)
- [ ] CloudFront (create distributions, invalidations)
- [ ] ECR (create repositories, push images)
- [ ] ECS (create clusters, services, tasks)
- [ ] DynamoDB (create tables)
- [ ] IAM (create roles, policies)
- [ ] VPC (create VPCs, subnets, security groups)
- [ ] Application Load Balancer (create ALBs, target groups)
- [ ] CloudWatch Logs (create log groups)

### 3. Environment Configuration
- [ ] Review `backend/.env.production` and update values
- [ ] Review `frontend/.env.production` and update values
- [ ] Verify table names match CDK configuration
- [ ] Set appropriate CORS origins

### 4. Code Review
- [ ] All tests passing locally
- [ ] Frontend builds successfully (`npm run build:frontend`)
- [ ] Backend builds successfully (`npm run build:backend`)
- [ ] No TypeScript errors
- [ ] No linting errors

## Initial Deployment (First Time)

### Step 1: Bootstrap CDK
```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```
- [ ] CDK bootstrap completed successfully

### Step 2: Deploy Infrastructure
```bash
cd infrastructure
npm run build
cdk deploy
```
- [ ] Stack deployed successfully
- [ ] Note down stack outputs (S3 bucket, CloudFront URL, ALB URL)

### Step 3: Update Environment Variables
- [ ] Update `backend/.env.production` with CloudFront URL for CORS
- [ ] Update `frontend/.env.production` with ALB URL
- [ ] Commit environment file templates (not actual values)

### Step 4: Deploy Backend
```bash
npm run deploy:backend production
```
- [ ] Docker image built successfully
- [ ] Image pushed to ECR
- [ ] ECS service updated
- [ ] Health check passing

### Step 5: Deploy Frontend
```bash
npm run deploy:frontend production
```
- [ ] Frontend built successfully
- [ ] Files uploaded to S3
- [ ] CloudFront cache invalidated

### Step 6: Verify Deployment
- [ ] Access CloudFront URL in browser
- [ ] Create a test event
- [ ] Join event as participant
- [ ] Test quiz flow
- [ ] Check WebSocket connection
- [ ] Verify leaderboard updates

## Subsequent Deployments

### Backend Updates
```bash
npm run deploy:backend production
```
- [ ] Code changes committed
- [ ] Tests passing
- [ ] Docker image built and pushed
- [ ] ECS service updated
- [ ] Health check passing
- [ ] Logs reviewed for errors

### Frontend Updates
```bash
npm run deploy:frontend production
```
- [ ] Code changes committed
- [ ] Tests passing
- [ ] Build successful
- [ ] Files uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Changes visible in browser

### Full Stack Updates
```bash
npm run deploy:all production
```
- [ ] Infrastructure changes reviewed
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] End-to-end testing completed

## Post-Deployment Checklist

### 1. Verify Services
- [ ] Frontend loads at CloudFront URL
- [ ] Backend health endpoint responds (`curl ALB_URL/health`)
- [ ] WebSocket connection establishes
- [ ] DynamoDB tables accessible

### 2. Test Core Functionality
- [ ] Create event
- [ ] Generate QR code
- [ ] Join event as participant
- [ ] Add questions
- [ ] Start quiz
- [ ] Submit answers
- [ ] View leaderboard
- [ ] End quiz

### 3. Monitor Logs
- [ ] Check CloudWatch logs for errors
- [ ] Review ECS task logs
- [ ] Check CloudFront access logs (if enabled)
- [ ] Monitor DynamoDB metrics

### 4. Performance Testing
- [ ] Test with multiple participants
- [ ] Verify real-time synchronization
- [ ] Check response times
- [ ] Monitor resource usage

### 5. Security Review
- [ ] HTTPS enabled on CloudFront
- [ ] CORS configured correctly
- [ ] Security groups properly configured
- [ ] IAM roles follow least privilege
- [ ] DynamoDB encryption enabled

## Rollback Procedures

### Rollback Backend
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix websocket-task --sort DESC

# Update to previous version
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --task-definition websocket-task:PREVIOUS_REVISION
```
- [ ] Previous task definition identified
- [ ] Service updated to previous version
- [ ] Health check passing
- [ ] Functionality verified

### Rollback Frontend
```bash
# Redeploy previous version
npm run deploy:frontend production
```
- [ ] Previous build available
- [ ] Files uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Changes verified

### Rollback Infrastructure
```bash
cd infrastructure
cdk deploy --rollback
```
- [ ] Stack rolled back successfully
- [ ] Services still operational
- [ ] Data preserved

## Troubleshooting

### Docker Build Fails
- [ ] Check Docker daemon is running
- [ ] Verify Dockerfile syntax
- [ ] Check backend builds: `npm run build:backend`
- [ ] Review build logs for errors

### ECR Push Fails
- [ ] Verify AWS credentials
- [ ] Check ECR repository exists
- [ ] Verify IAM permissions
- [ ] Check network connectivity

### ECS Task Fails
- [ ] Check CloudWatch logs
- [ ] Verify environment variables
- [ ] Check IAM role permissions
- [ ] Verify security groups
- [ ] Check health endpoint

### Frontend Not Loading
- [ ] Verify S3 bucket has files
- [ ] Check CloudFront distribution status
- [ ] Review browser console errors
- [ ] Verify environment variables
- [ ] Check CORS configuration

### WebSocket Connection Fails
- [ ] Verify ALB health checks
- [ ] Check security groups
- [ ] Review CORS configuration
- [ ] Verify WebSocket URL in frontend
- [ ] Check backend logs

## Monitoring and Maintenance

### Daily
- [ ] Review CloudWatch alarms
- [ ] Check error rates in logs
- [ ] Monitor ECS service health

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check DynamoDB capacity
- [ ] Review CloudFront cache hit ratio
- [ ] Check for security updates

### Monthly
- [ ] Review AWS costs
- [ ] Update dependencies
- [ ] Review and rotate credentials
- [ ] Test backup and restore procedures
- [ ] Review and update documentation

## Environment-Specific Notes

### Development
- [ ] Use development environment variables
- [ ] Deploy to development stack
- [ ] Test new features thoroughly
- [ ] Document any issues

### Staging
- [ ] Mirror production configuration
- [ ] Test with production-like data
- [ ] Perform load testing
- [ ] Verify monitoring and alerting

### Production
- [ ] Use production environment variables
- [ ] Deploy during maintenance window
- [ ] Monitor closely after deployment
- [ ] Have rollback plan ready
- [ ] Notify stakeholders of deployment

## Success Criteria

Deployment is successful when:
- [ ] All services are running and healthy
- [ ] Frontend is accessible via CloudFront URL
- [ ] Backend API responds correctly
- [ ] WebSocket connections work
- [ ] Complete quiz flow works end-to-end
- [ ] No errors in CloudWatch logs
- [ ] Performance meets requirements
- [ ] Security controls are in place

## Contact and Support

- **AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support/)
- **Documentation**: See `infrastructure/DEPLOYMENT_CONFIG.md`
- **Quick Commands**: See `infrastructure/DEPLOYMENT_COMMANDS.md`
- **Script Details**: See `infrastructure/scripts/README.md`

## Notes

Use this space to document deployment-specific notes:

```
Date: ___________
Deployed by: ___________
Environment: ___________
Version/Tag: ___________
Issues encountered: ___________
Resolution: ___________
```
