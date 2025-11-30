# Final Integration and Deployment Guide

This guide walks you through the complete process of testing and deploying the Live Quiz Event system.

## Overview

This document covers:
1. Local integration testing
2. AWS deployment process
3. Post-deployment verification
4. Mobile device testing
5. Production readiness checklist

## Quick Start

### Test Locally

```bash
# Start all services
npm run dev

# In a new terminal, run integration tests
./scripts/test-local-flow.sh
```

### Deploy to AWS

```bash
# Deploy everything
npm run deploy:all production

# Verify deployment
./scripts/test-aws-deployment.sh production
```

## Detailed Steps

### Phase 1: Local Integration Testing

#### 1.1 Start Local Environment

```bash
# Start DynamoDB, backend, and frontend
npm run dev
```

This command will:
- Start DynamoDB Local in Docker (port 8000)
- Create all required tables
- Start backend server (port 3001)
- Start frontend dev server (port 5173)

#### 1.2 Run Automated Tests

```bash
./scripts/test-local-flow.sh
```

This script verifies:
- ✓ Prerequisites (Docker, Node.js)
- ✓ Services running
- ✓ Backend API endpoints
- ✓ DynamoDB tables
- ✓ Event and question creation

#### 1.3 Manual Testing

Follow the interactive prompts in the test script to verify:

1. **Organizer Flow**
   - Create event with name
   - Add multiple questions
   - Generate QR code and join link

2. **Participant Flow**
   - Join event via link
   - Enter display name
   - See waiting screen

3. **Quiz Execution**
   - Start quiz
   - Display questions with timer
   - Submit answers
   - View leaderboard after each question
   - End quiz with final results

4. **Real-Time Features**
   - WebSocket connection
   - Live participant list updates
   - Real-time question display
   - Live leaderboard updates

5. **Mobile Responsiveness**
   - Test in browser DevTools
   - iPhone SE (375px)
   - iPad (768px)
   - Portrait and landscape

#### 1.4 Verify Data Persistence

```bash
# Open DynamoDB Admin UI
npm run db:admin
```

Check that data is stored correctly in:
- LiveQuizEvents table
- LiveQuizQuestions table
- LiveQuizParticipants table
- LiveQuizAnswers table

### Phase 2: AWS Deployment

#### 2.1 Pre-Deployment Checklist

- [ ] AWS CLI configured: `aws sts get-caller-identity`
- [ ] Docker running: `docker ps`
- [ ] All local tests passed
- [ ] Code committed to version control
- [ ] Environment variables configured

#### 2.2 Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap
```

#### 2.3 Deploy Infrastructure

```bash
cd infrastructure
npm run build
cdk deploy
```

**Expected Output:**
```
✅  LiveQuizEventStack

Outputs:
LiveQuizEventStack.CloudFrontURL = https://d1234567890.cloudfront.net
LiveQuizEventStack.WebSocketALBURL = http://live-quiz-alb-1234567890.us-east-1.elb.amazonaws.com
LiveQuizEventStack.FrontendBucketName = live-quiz-frontend-123456789012
LiveQuizEventStack.CloudFrontDistributionId = E1234567890ABC
```

**Save these outputs!** You'll need them for verification.

#### 2.4 Deploy Backend

```bash
npm run deploy:backend production
```

This will:
1. Create ECR repository
2. Build Docker image
3. Push to ECR
4. Update ECS service

**Monitor deployment:**
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --query "services[0].deployments"
```

**Check logs:**
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

#### 2.5 Deploy Frontend

```bash
npm run deploy:frontend production
```

This will:
1. Build React application
2. Upload to S3
3. Invalidate CloudFront cache

**Wait for invalidation** (1-2 minutes):
```bash
aws cloudfront wait invalidation-completed \
  --distribution-id <your-distribution-id> \
  --id <invalidation-id>
```

### Phase 3: AWS Verification

#### 3.1 Run Automated Tests

```bash
./scripts/test-aws-deployment.sh production
```

This script verifies:
- ✓ Stack outputs retrieved
- ✓ DynamoDB tables exist
- ✓ S3 bucket has files
- ✓ CloudFront distribution deployed
- ✓ ECS service running
- ✓ Backend health endpoint
- ✓ Event creation works
- ✓ Frontend loads

#### 3.2 Manual Verification

1. **Open Frontend**
   ```
   https://<your-cloudfront-url>
   ```
   - Verify home page loads
   - Check browser console (F12) for errors
   - Verify no CORS errors

2. **Test Backend**
   ```bash
   curl http://<your-alb-url>/health
   ```
   - Should return: `{"status":"ok"}`

3. **Complete Quiz Flow**
   - Create event
   - Add questions
   - Join as multiple participants
   - Start quiz
   - Answer questions
   - Verify leaderboard
   - End quiz

4. **WebSocket Verification**
   - Open DevTools → Network → WS
   - Join event
   - Verify WebSocket connection
   - Check for real-time messages

### Phase 4: Mobile Device Testing

#### 4.1 QR Code Testing

1. **Create Event on Desktop**
   - Open CloudFront URL
   - Create event
   - Display QR code

2. **Scan with Mobile**
   - Use iPhone camera app
   - Scan QR code
   - Verify link opens in Safari
   - Join event successfully

3. **Test on Android**
   - Use Android camera app
   - Scan QR code
   - Verify link opens in Chrome
   - Join event successfully

#### 4.2 Mobile Browser Testing

**iOS Safari:**
- [ ] Open CloudFront URL on iPhone
- [ ] Join event as participant
- [ ] Verify responsive layout
- [ ] Verify text is readable
- [ ] Verify buttons are tappable (44px min)
- [ ] Complete full quiz
- [ ] Test portrait mode
- [ ] Test landscape mode
- [ ] Verify no horizontal scrolling

**Android Chrome:**
- [ ] Open CloudFront URL on Android
- [ ] Join event as participant
- [ ] Verify responsive layout
- [ ] Complete full quiz
- [ ] Test both orientations

#### 4.3 Mobile-Specific Checks

- [ ] Touch targets ≥ 44px height
- [ ] Font sizes ≥ 16px
- [ ] No pinch-to-zoom required
- [ ] Keyboard doesn't obscure inputs
- [ ] Smooth scrolling
- [ ] Fast page load (< 3s on 4G)

### Phase 5: Performance Testing

#### 5.1 Response Time

Test API response times:

```bash
# Test health endpoint
time curl http://<alb-url>/health

# Test event creation
time curl -X POST http://<alb-url>/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Performance Test"}'
```

**Targets:**
- Health endpoint: < 500ms
- Event creation: < 1s
- Question display: < 2s
- Leaderboard update: < 2s

#### 5.2 Multi-User Testing

1. Open 10+ participant windows
2. Join with different names
3. Start quiz
4. All participants answer simultaneously
5. Verify:
   - No lag or delays
   - All participants see updates
   - Leaderboard accuracy
   - No connection drops

#### 5.3 Resource Monitoring

```bash
# Check ECS metrics
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=websocket-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Phase 6: Security Verification

#### 6.1 HTTPS

- [ ] CloudFront serves over HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

#### 6.2 CORS

- [ ] CORS headers configured
- [ ] Only allowed origins can access
- [ ] No CORS errors in console

#### 6.3 Input Validation

Test with malicious inputs:

```bash
# Test XSS prevention
curl -X POST http://<alb-url>/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>"}'

# Should sanitize or reject
```

#### 6.4 AWS Security

- [ ] DynamoDB encryption enabled
- [ ] ECS tasks in private subnets
- [ ] Security groups configured
- [ ] IAM roles least privilege
- [ ] CloudWatch logs enabled

### Phase 7: Production Readiness

#### 7.1 Monitoring Setup

```bash
# Set up CloudWatch alarms (example)
aws cloudwatch put-metric-alarm \
  --alarm-name live-quiz-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

#### 7.2 Backup Configuration

```bash
# Enable DynamoDB point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name LiveQuizEvents \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

#### 7.3 Documentation

- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document monitoring procedures

#### 7.4 Team Training

- [ ] Train team on deployment process
- [ ] Share CloudWatch dashboard
- [ ] Document escalation procedures
- [ ] Conduct dry-run deployment

## Troubleshooting

### Common Issues

#### Frontend Not Loading

**Problem:** CloudFront URL returns error

**Solution:**
```bash
# Check S3 bucket
aws s3 ls s3://<bucket-name>/

# Redeploy frontend
npm run deploy:frontend production

# Invalidate cache
npm run invalidate:cloudfront production "/*"
```

#### Backend Not Responding

**Problem:** API calls fail

**Solution:**
```bash
# Check ECS service
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service

# Check logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Redeploy backend
npm run deploy:backend production
```

#### WebSocket Connection Fails

**Problem:** Real-time updates don't work

**Solution:**
1. Check browser console for errors
2. Verify WebSocket URL in frontend config
3. Check ALB listener configuration
4. Verify security groups allow WebSocket traffic

#### DynamoDB Throttling

**Problem:** Slow responses or errors

**Solution:**
```bash
# Check for throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=LiveQuizEvents \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Consider increasing capacity or switching to provisioned
```

## Rollback Procedures

### Rollback Backend

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix websocket-task

# Update to previous version
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --task-definition websocket-task:PREVIOUS_REVISION
```

### Rollback Frontend

```bash
# Checkout previous version
git checkout <previous-commit>

# Redeploy
npm run deploy:frontend production
```

### Rollback Infrastructure

```bash
cd infrastructure
cdk deploy --rollback
```

## Success Criteria

Deployment is successful when:

- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] Frontend accessible via CloudFront
- [ ] Backend API responds correctly
- [ ] WebSocket connections work
- [ ] Complete quiz flow works end-to-end
- [ ] Mobile devices work correctly
- [ ] QR code scanning works
- [ ] Performance meets requirements
- [ ] No errors in CloudWatch logs
- [ ] Security controls verified

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (Optional)
   - Request ACM certificate
   - Update CloudFront distribution
   - Configure Route 53

2. **Enable Auto Scaling**
   - Configure ECS service auto-scaling
   - Set CPU/memory thresholds

3. **Set Up CI/CD**
   - GitHub Actions or AWS CodePipeline
   - Automated testing
   - Automated deployment

4. **Monitoring and Alerts**
   - CloudWatch dashboards
   - SNS notifications
   - PagerDuty integration

5. **Performance Optimization**
   - Enable CloudFront compression
   - Optimize DynamoDB indexes
   - Review ECS task sizing

6. **Disaster Recovery**
   - Document backup procedures
   - Test restore procedures
   - Create disaster recovery plan

## Support Resources

- **Deployment Guide:** [infrastructure/DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md)
- **Deployment Checklist:** [infrastructure/DEPLOYMENT_CHECKLIST.md](./infrastructure/DEPLOYMENT_CHECKLIST.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Verification Guide:** [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md)

## Conclusion

You have now completed the final integration and deployment of the Live Quiz Event system. The application is:

- ✅ Tested locally
- ✅ Deployed to AWS
- ✅ Verified on desktop and mobile
- ✅ Performance tested
- ✅ Security verified
- ✅ Production ready

For ongoing maintenance and updates, refer to the deployment scripts and documentation in the `infrastructure/` directory.

