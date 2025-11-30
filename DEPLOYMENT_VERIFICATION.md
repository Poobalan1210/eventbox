# Deployment Verification Guide

This document provides a comprehensive checklist for verifying the Live Quiz Event system deployment.

## Table of Contents

1. [Local Testing](#local-testing)
2. [AWS Deployment](#aws-deployment)
3. [Mobile Testing](#mobile-testing)
4. [Performance Verification](#performance-verification)
5. [Security Verification](#security-verification)
6. [Troubleshooting](#troubleshooting)

## Local Testing

### Prerequisites Check

- [ ] Docker installed and running
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] DynamoDB Local running (`npm run db:start`)
- [ ] Tables created (`npm run setup:local-db`)

### Automated Local Tests

Run the automated test script:

```bash
chmod +x scripts/test-local-flow.sh
./scripts/test-local-flow.sh
```

This script will verify:
- ✓ Prerequisites are installed
- ✓ Services are running
- ✓ Backend API endpoints work
- ✓ DynamoDB tables exist
- ✓ Event creation works
- ✓ Question creation works

### Manual Local Tests

#### 1. Organizer Flow

- [ ] Open http://localhost:5173
- [ ] Click "Create Event"
- [ ] Enter event name: "Local Test Event"
- [ ] Add Question 1:
  - Text: "What is 2+2?"
  - Options: "3", "4", "5"
  - Correct: "4"
  - Timer: 30 seconds
- [ ] Add Question 2:
  - Text: "What is the capital of France?"
  - Options: "London", "Paris", "Berlin"
  - Correct: "Paris"
  - Timer: 20 seconds
- [ ] Click "Create Event"
- [ ] Verify join link is displayed
- [ ] Verify QR code is displayed
- [ ] Copy join link

#### 2. Participant Flow

- [ ] Open join link in new browser window
- [ ] Enter name: "Test Participant 1"
- [ ] Click "Join Event"
- [ ] Verify waiting screen appears
- [ ] Open another window with join link
- [ ] Enter name: "Test Participant 2"
- [ ] Verify both participants appear in organizer dashboard

#### 3. Quiz Execution

- [ ] In organizer dashboard, click "Start Quiz"
- [ ] Verify quiz starts in all participant windows
- [ ] Verify first question appears
- [ ] Verify timer counts down
- [ ] In participant 1 window, select correct answer and submit
- [ ] In participant 2 window, select wrong answer and submit
- [ ] Verify submission confirmation appears
- [ ] In organizer dashboard, click "Next Question"
- [ ] Verify leaderboard appears showing correct rankings
- [ ] Verify second question appears
- [ ] Complete second question in both participant windows
- [ ] Click "End Quiz" in organizer dashboard
- [ ] Verify final leaderboard appears
- [ ] Verify rankings are correct based on:
  - Score (correct answers)
  - Total answer time (tie-breaker)
  - Name (alphabetical, second tie-breaker)

#### 4. Real-Time Synchronization

- [ ] Open browser DevTools (F12) → Network tab
- [ ] Filter by "WS" (WebSocket)
- [ ] Join event as participant
- [ ] Verify WebSocket connection established
- [ ] Start quiz in organizer dashboard
- [ ] Verify "quiz-started" message received
- [ ] Display question in organizer dashboard
- [ ] Verify "question-displayed" message received
- [ ] Verify timer updates via "timer-tick" messages
- [ ] Submit answer
- [ ] Verify "answer-submitted" confirmation
- [ ] Verify leaderboard updates without page refresh

#### 5. Error Handling

- [ ] Try to join non-existent event
- [ ] Verify "Event not found" error page
- [ ] Try to create event with empty name
- [ ] Verify validation error
- [ ] Try to add question with only 1 option
- [ ] Verify validation error
- [ ] Disconnect internet during quiz
- [ ] Verify reconnection banner appears
- [ ] Reconnect internet
- [ ] Verify reconnection works

#### 6. Mobile Responsiveness (Browser DevTools)

- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
- [ ] Test iPhone SE (375px width):
  - [ ] Home page loads correctly
  - [ ] Create event form is usable
  - [ ] Questions are readable
  - [ ] Answer buttons are tappable (min 44px height)
  - [ ] Leaderboard displays correctly
  - [ ] No horizontal scrolling
- [ ] Test iPad (768px width):
  - [ ] Layout adapts appropriately
  - [ ] All features accessible
- [ ] Test landscape orientation
- [ ] Test portrait orientation

### Local Testing Results

Document your results:

```
Date: ___________
Tester: ___________
All tests passed: [ ] Yes [ ] No
Issues found: ___________
```

## AWS Deployment

### Pre-Deployment Checklist

- [ ] AWS CLI installed and configured
- [ ] AWS credentials have necessary permissions
- [ ] CDK bootstrapped (`cdk bootstrap`)
- [ ] Environment variables configured
- [ ] Code committed to version control
- [ ] All local tests passed

### Deployment Steps

#### 1. Deploy Infrastructure

```bash
cd infrastructure
npm run build
cdk deploy
```

- [ ] Stack deployed successfully
- [ ] Note CloudFront URL: ___________
- [ ] Note WebSocket ALB URL: ___________
- [ ] Note S3 bucket name: ___________
- [ ] Note CloudFront distribution ID: ___________

#### 2. Deploy Backend

```bash
npm run deploy:backend production
```

- [ ] Docker image built successfully
- [ ] Image pushed to ECR
- [ ] ECS service updated
- [ ] ECS tasks running (check: `aws ecs describe-services --cluster live-quiz-cluster --services websocket-service`)

#### 3. Deploy Frontend

```bash
npm run deploy:frontend production
```

- [ ] Frontend built successfully
- [ ] Files uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Invalidation completed (wait 1-2 minutes)

### Automated AWS Tests

Run the automated test script:

```bash
chmod +x scripts/test-aws-deployment.sh
./scripts/test-aws-deployment.sh production
```

This script will verify:
- ✓ AWS credentials configured
- ✓ Stack outputs retrieved
- ✓ DynamoDB tables exist
- ✓ S3 bucket has files
- ✓ CloudFront distribution deployed
- ✓ ECS service running
- ✓ Backend health endpoint responds
- ✓ Event creation works
- ✓ Frontend loads

### Manual AWS Tests

#### 1. Frontend Verification

- [ ] Open CloudFront URL in browser
- [ ] Verify home page loads
- [ ] Check browser console for errors (F12)
- [ ] Verify no CORS errors
- [ ] Verify assets load (images, CSS, JS)

#### 2. Backend Verification

- [ ] Test health endpoint: `curl <ALB_URL>/health`
- [ ] Verify response: `{"status":"ok"}`
- [ ] Check ECS logs: `aws logs tail /ecs/live-quiz-websocket-server --follow`
- [ ] Verify no errors in logs

#### 3. Complete Quiz Flow on AWS

Repeat all manual local tests using the CloudFront URL:

- [ ] Create event
- [ ] Verify QR code generates
- [ ] Join as multiple participants
- [ ] Start quiz
- [ ] Answer questions
- [ ] Verify real-time updates
- [ ] Check leaderboard
- [ ] End quiz
- [ ] Verify final results

#### 4. WebSocket Connection on AWS

- [ ] Open browser DevTools → Network tab
- [ ] Filter by "WS"
- [ ] Join event
- [ ] Verify WebSocket connects to ALB URL
- [ ] Verify messages flow correctly
- [ ] Check for connection errors

#### 5. Multi-User Testing

- [ ] Open 5+ participant windows
- [ ] Join with different names
- [ ] Start quiz
- [ ] Have all participants answer
- [ ] Verify no lag or delays
- [ ] Verify all participants see updates
- [ ] Check leaderboard accuracy

## Mobile Testing

### QR Code Testing

- [ ] Create event on desktop
- [ ] Display QR code on screen
- [ ] Scan with iPhone camera
- [ ] Verify link opens in Safari
- [ ] Join event successfully
- [ ] Scan with Android camera
- [ ] Verify link opens in Chrome
- [ ] Join event successfully

### Mobile Browser Testing

#### iOS Safari

- [ ] Open CloudFront URL on iPhone
- [ ] Create event (if testing organizer view)
- [ ] Join event as participant
- [ ] Verify layout is responsive
- [ ] Verify text is readable without zooming
- [ ] Verify buttons are easily tappable
- [ ] Answer questions
- [ ] Verify timer displays correctly
- [ ] Verify leaderboard displays correctly
- [ ] Test in portrait mode
- [ ] Test in landscape mode
- [ ] Verify no horizontal scrolling

#### Android Chrome

- [ ] Open CloudFront URL on Android
- [ ] Join event as participant
- [ ] Verify layout is responsive
- [ ] Verify text is readable
- [ ] Verify buttons are tappable
- [ ] Complete full quiz
- [ ] Test in portrait mode
- [ ] Test in landscape mode

#### Mobile-Specific Features

- [ ] Touch targets are minimum 44px height
- [ ] Font sizes are readable (minimum 16px)
- [ ] Spacing between elements is adequate
- [ ] Forms are easy to fill on mobile
- [ ] Keyboard doesn't obscure inputs
- [ ] Scrolling is smooth
- [ ] No elements overflow viewport

### Mobile Performance

- [ ] Page loads in < 3 seconds on 4G
- [ ] WebSocket connects quickly
- [ ] Real-time updates are smooth
- [ ] No lag when answering questions
- [ ] Leaderboard updates quickly

## Performance Verification

### Response Time

- [ ] Frontend loads in < 2 seconds
- [ ] API health endpoint responds in < 500ms
- [ ] Event creation takes < 1 second
- [ ] Question display latency < 2 seconds
- [ ] Leaderboard updates in < 2 seconds

### Load Testing

Test with multiple concurrent users:

- [ ] 10 participants: All updates smooth
- [ ] 25 participants: No noticeable lag
- [ ] 50 participants: System remains responsive
- [ ] 100 participants: (Optional) Stress test

### Resource Usage

- [ ] ECS CPU usage < 70% under normal load
- [ ] ECS memory usage < 80%
- [ ] DynamoDB read/write capacity adequate
- [ ] No throttling errors in CloudWatch

## Security Verification

### HTTPS

- [ ] CloudFront serves over HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

### CORS

- [ ] CORS headers configured correctly
- [ ] Only allowed origins can access API
- [ ] No CORS errors in browser console

### Input Validation

- [ ] Event names are sanitized
- [ ] Participant names are sanitized
- [ ] Question text is sanitized
- [ ] No XSS vulnerabilities

### Access Control

- [ ] Participants can't access organizer functions
- [ ] Invalid event IDs return 404
- [ ] WebSocket connections are validated

### AWS Security

- [ ] DynamoDB encryption at rest enabled
- [ ] ECS tasks in private subnets
- [ ] Security groups properly configured
- [ ] IAM roles follow least privilege
- [ ] CloudWatch logs enabled

## Troubleshooting

### Frontend Not Loading

**Symptoms**: CloudFront URL returns error or blank page

**Checks**:
1. Verify S3 bucket has files: `aws s3 ls s3://<bucket-name>/`
2. Check CloudFront distribution status: `aws cloudfront get-distribution --id <dist-id>`
3. Check browser console for errors
4. Verify CloudFront invalidation completed
5. Try hard refresh (Ctrl+Shift+R)

**Solutions**:
- Redeploy frontend: `npm run deploy:frontend production`
- Invalidate cache: `npm run invalidate:cloudfront production "/*"`
- Check S3 bucket permissions

### Backend Not Responding

**Symptoms**: API calls fail or timeout

**Checks**:
1. Check ECS service: `aws ecs describe-services --cluster live-quiz-cluster --services websocket-service`
2. Check ECS tasks: `aws ecs list-tasks --cluster live-quiz-cluster`
3. Check logs: `aws logs tail /ecs/live-quiz-websocket-server --follow`
4. Check ALB health: `aws elbv2 describe-target-health --target-group-arn <arn>`

**Solutions**:
- Redeploy backend: `npm run deploy:backend production`
- Check environment variables in task definition
- Verify security groups allow traffic
- Check IAM role permissions

### WebSocket Connection Fails

**Symptoms**: Real-time updates don't work

**Checks**:
1. Check browser console for WebSocket errors
2. Verify WebSocket URL in frontend config
3. Check ALB supports WebSocket
4. Check security groups

**Solutions**:
- Verify ALB listener configuration
- Check CORS settings
- Ensure sticky sessions enabled on ALB
- Check backend WebSocket server logs

### DynamoDB Errors

**Symptoms**: Data not saving or loading

**Checks**:
1. Verify tables exist: `aws dynamodb list-tables`
2. Check CloudWatch logs for throttling
3. Verify IAM permissions
4. Check table capacity

**Solutions**:
- Increase DynamoDB capacity
- Check IAM role has DynamoDB permissions
- Verify table names in environment variables

### Mobile Issues

**Symptoms**: Layout broken on mobile

**Checks**:
1. Test in browser DevTools mobile view
2. Check viewport meta tag in index.html
3. Verify Tailwind responsive classes
4. Check for fixed widths in CSS

**Solutions**:
- Review mobile responsiveness checklist
- Test on actual devices
- Check CSS for mobile-specific issues

## Sign-Off

### Local Testing

- [ ] All automated tests passed
- [ ] All manual tests passed
- [ ] Mobile responsiveness verified
- [ ] No critical issues found

Signed: ___________ Date: ___________

### AWS Deployment

- [ ] Infrastructure deployed successfully
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] All automated tests passed
- [ ] All manual tests passed
- [ ] WebSocket connections working
- [ ] Multi-user testing successful

Signed: ___________ Date: ___________

### Mobile Testing

- [ ] QR code scanning works
- [ ] iOS testing complete
- [ ] Android testing complete
- [ ] Mobile responsiveness verified
- [ ] No critical mobile issues

Signed: ___________ Date: ___________

### Production Ready

- [ ] All testing complete
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained

Signed: ___________ Date: ___________

## Next Steps

After successful verification:

1. [ ] Configure custom domain (optional)
2. [ ] Set up CloudWatch alarms
3. [ ] Enable auto-scaling
4. [ ] Configure backups
5. [ ] Set up CI/CD pipeline
6. [ ] Document any issues or improvements
7. [ ] Plan for production launch

## Support

For issues during verification:

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [infrastructure/DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md)
- Check CloudWatch logs
- Review AWS service health dashboard

