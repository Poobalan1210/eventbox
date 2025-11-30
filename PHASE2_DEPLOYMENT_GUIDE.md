# Phase 2 Deployment Guide

This guide covers the deployment and testing of all Phase 2 Kahoot-style enhancements.

## Phase 2 Features

1. **Game PIN System** - 6-digit numeric codes for easy event joining
2. **Colorful Answer Buttons** - Geometric shapes with vibrant colors
3. **Speed-Based Scoring** - Points based on answer speed (500-1000 points)
4. **Answer Statistics** - Bar charts showing answer distribution
5. **Answer Result Reveal** - Immediate feedback with correct answer
6. **Podium Display** - Celebratory top 3 visualization
7. **Question Images** - Upload and display images in questions
8. **Answer Streak Tracking** - Track consecutive correct answers
9. **Nickname Generator** - Fun adjective+noun name suggestions
10. **Visual Feedback & Animations** - Smooth Framer Motion animations

## Prerequisites

Before deploying Phase 2 features, ensure you have:

- [x] AWS CLI configured with appropriate credentials
- [x] AWS CDK installed (`npm install -g aws-cdk`)
- [x] Docker installed and running
- [x] Node.js 18+ installed
- [x] Phase 1 infrastructure deployed (or fresh deployment)

## Infrastructure Changes

Phase 2 adds the following AWS resources:

### New DynamoDB Table
- **GamePins Table** - Stores 6-digit PINs with TTL for automatic cleanup

### New S3 Bucket
- **Question Images Bucket** - Stores uploaded question images
- Includes lifecycle policy (30-day retention)
- CORS configuration for uploads

### New CloudFront Distribution
- **Images CloudFront** - CDN for question images
- Optimized caching for image delivery

### Updated IAM Permissions
- S3 read/write access for ECS tasks
- DynamoDB access for GamePins table

## Deployment Steps

### Step 1: Verify Current Infrastructure

```bash
# Check if stack exists
aws cloudformation describe-stacks --stack-name LiveQuizEventStack

# If stack doesn't exist, you'll need to deploy from scratch
```

### Step 2: Update Infrastructure

The CDK stack already includes all Phase 2 resources. Deploy or update:

```bash
cd infrastructure

# Install dependencies
npm install

# Build CDK project
npm run build

# Preview changes (optional)
cdk diff

# Deploy infrastructure
cdk deploy --require-approval never
```

This will create/update:
- GamePins DynamoDB table with TTL
- Question Images S3 bucket with lifecycle policy
- CloudFront distribution for images
- Updated IAM roles with S3 permissions

### Step 3: Deploy Backend

The backend includes all Phase 2 features:

```bash
cd infrastructure/scripts

# Deploy backend (builds Docker image and updates ECS)
./deploy-backend.sh production
```

This will:
1. Build Docker image with Phase 2 code
2. Push to ECR
3. Update ECS service with new image
4. Wait for deployment to complete

**Monitor deployment:**
```bash
# Watch ECS service status
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service \
  --query "services[0].deployments"

# View logs
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### Step 4: Deploy Frontend

The frontend includes all Phase 2 UI components:

```bash
cd infrastructure/scripts

# Deploy frontend (builds and uploads to S3)
./deploy-frontend.sh production
```

This will:
1. Build React app with Phase 2 components
2. Upload to S3 bucket
3. Invalidate CloudFront cache
4. Wait for invalidation to complete

**Monitor invalidation:**
```bash
# Get distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# Check invalidation status
aws cloudfront list-invalidations --distribution-id $DIST_ID
```

### Step 5: Verify Deployment

Run the automated verification script:

```bash
cd scripts

# Run Phase 2 feature tests
./test-phase2-features.sh production
```

This script will:
- ✓ Test Game PIN generation and lookup
- ✓ Verify GamePins DynamoDB table
- ✓ Test question creation with color-shape assignments
- ✓ Verify question images bucket and CloudFront
- ✓ Test image upload endpoint
- ✓ Check infrastructure components (TTL, lifecycle, CORS)
- ✓ Provide manual testing checklist

## Manual Testing Checklist

After automated tests pass, perform these manual tests:

### 1. Game PIN System
- [ ] Create an event and note the 6-digit PIN
- [ ] Open app in new window and enter PIN
- [ ] Verify it navigates to correct event
- [ ] Test invalid PIN shows error

### 2. Colorful Answer Buttons
- [ ] Create question with 4 options
- [ ] Verify colors: Red Triangle, Blue Diamond, Yellow Circle, Green Square
- [ ] Test hover animations (desktop)
- [ ] Test tap animations (mobile)

### 3. Speed-Based Scoring
- [ ] Answer quickly (first 25% of time) → expect 1000 points
- [ ] Answer slowly (near end) → expect 500-999 points
- [ ] Answer incorrectly → expect 0 points
- [ ] Verify points display correctly

### 4. Answer Statistics
- [ ] Complete question with multiple participants
- [ ] Verify bar chart shows distribution
- [ ] Verify correct answer is highlighted
- [ ] Verify percentages add to 100%

### 5. Answer Result Reveal
- [ ] Submit correct answer → see celebration animation
- [ ] Submit incorrect answer → see shake animation
- [ ] Verify correct answer is revealed
- [ ] Verify points earned are shown

### 6. Podium Display
- [ ] Complete quiz with 3+ participants
- [ ] Verify podium shows top 3
- [ ] Verify positions: 1st center, 2nd left, 3rd right
- [ ] Check staggered entrance animation
- [ ] Check confetti effect

### 7. Question Images
- [ ] Upload JPEG image → verify it displays
- [ ] Upload PNG image → verify it displays
- [ ] Test on mobile → verify responsive sizing
- [ ] Verify aspect ratio maintained

### 8. Answer Streak Tracking
- [ ] Answer 3 correctly in a row → see streak 3
- [ ] Verify fire emoji appears (3+ streak)
- [ ] Answer incorrectly → verify reset to 0
- [ ] Check streak indicator updates in real-time

### 9. Nickname Generator
- [ ] Join event → see 3 suggestions
- [ ] Click refresh → see new suggestions
- [ ] Select suggestion → verify it's used
- [ ] Test custom name input

### 10. Visual Feedback & Animations
- [ ] Test all button animations
- [ ] Test question transitions
- [ ] Test leaderboard rank changes
- [ ] Verify animations complete within 500ms
- [ ] Test on mobile for performance

### 11. Mobile Responsiveness
- [ ] Test all features on actual mobile device
- [ ] Verify touch targets are adequate (44px+)
- [ ] Test portrait and landscape modes
- [ ] Verify no horizontal scrolling
- [ ] Check animation performance

### 12. Performance Testing
- [ ] Test with 5-10 concurrent participants
- [ ] Verify real-time updates work smoothly
- [ ] Check browser console for errors
- [ ] Monitor WebSocket messages
- [ ] Verify no memory leaks

## Troubleshooting

### Game PIN Not Working

**Symptom:** PIN lookup returns 404

**Solutions:**
1. Check GamePins table exists:
   ```bash
   aws dynamodb describe-table --table-name LiveQuizGamePins
   ```

2. Verify PIN is stored:
   ```bash
   aws dynamodb scan --table-name LiveQuizGamePins --max-items 5
   ```

3. Check backend logs:
   ```bash
   aws logs tail /ecs/live-quiz-websocket-server --follow
   ```

### Images Not Loading

**Symptom:** Uploaded images return 403 or 404

**Solutions:**
1. Check S3 bucket exists:
   ```bash
   aws s3 ls | grep question-images
   ```

2. Verify CloudFront distribution:
   ```bash
   DIST_ID=$(aws cloudformation describe-stacks \
     --stack-name LiveQuizEventStack \
     --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesDistributionId'].OutputValue" \
     --output text)
   
   aws cloudfront get-distribution --id $DIST_ID
   ```

3. Check IAM permissions:
   ```bash
   # Verify ECS task role has S3 permissions
   aws iam get-role --role-name LiveQuizEventStack-TaskRole*
   ```

4. Test direct S3 access:
   ```bash
   BUCKET=$(aws cloudformation describe-stacks \
     --stack-name LiveQuizEventStack \
     --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesBucketName'].OutputValue" \
     --output text)
   
   aws s3 ls s3://$BUCKET/
   ```

### Animations Not Smooth

**Symptom:** Animations lag or stutter

**Solutions:**
1. Check browser console for errors
2. Verify Framer Motion is loaded:
   ```javascript
   // In browser console
   console.log(window.FramerMotion)
   ```

3. Test on different device/browser
4. Check network throttling isn't enabled
5. Verify CSS transforms are used (not position changes)

### WebSocket Connection Issues

**Symptom:** Real-time features not working

**Solutions:**
1. Check ECS service is running:
   ```bash
   aws ecs describe-services \
     --cluster live-quiz-cluster \
     --services websocket-service
   ```

2. Verify ALB health checks:
   ```bash
   # Get ALB ARN from CloudFormation outputs
   # Check target group health
   ```

3. Test WebSocket endpoint:
   ```bash
   # Get WebSocket URL
   WS_URL=$(aws cloudformation describe-stacks \
     --stack-name LiveQuizEventStack \
     --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
     --output text)
   
   curl $WS_URL/health
   ```

4. Check CORS configuration:
   ```bash
   # Verify CORS_ORIGIN environment variable
   aws ecs describe-task-definition \
     --task-definition websocket-task-def \
     --query "taskDefinition.containerDefinitions[0].environment"
   ```

## Rollback Procedure

If Phase 2 deployment fails, you can rollback:

### Option 1: Rollback Infrastructure Only

```bash
cd infrastructure

# Rollback to previous stack version
aws cloudformation cancel-update-stack --stack-name LiveQuizEventStack

# Or delete new resources manually
aws dynamodb delete-table --table-name LiveQuizGamePins
aws s3 rb s3://live-quiz-question-images-* --force
```

### Option 2: Rollback Backend Only

```bash
# Deploy previous Docker image
cd infrastructure/scripts

# Find previous image tag
aws ecr describe-images \
  --repository-name live-quiz-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-2].imageTags[0]' \
  --output text

# Update ECS service with previous image
# (Manual process - update task definition)
```

### Option 3: Rollback Frontend Only

```bash
# Redeploy previous frontend build
cd frontend

# Checkout previous commit
git checkout <previous-commit>

# Rebuild and deploy
npm run build
cd ../infrastructure/scripts
./deploy-frontend.sh production
```

### Option 4: Full Rollback

```bash
# Destroy entire stack and redeploy Phase 1
cd infrastructure
cdk destroy

# Then redeploy Phase 1 from backup/previous version
```

## Post-Deployment

After successful deployment:

1. **Update Documentation**
   - Update README with Phase 2 features
   - Document new API endpoints
   - Update user guides

2. **Monitor Performance**
   ```bash
   # Set up CloudWatch alarms
   # Monitor ECS CPU/Memory
   # Monitor DynamoDB read/write capacity
   # Monitor S3 storage costs
   ```

3. **Set Up Alerts**
   - ECS service health
   - ALB 5xx errors
   - DynamoDB throttling
   - S3 upload failures

4. **Backup Configuration**
   ```bash
   # Export stack template
   aws cloudformation get-template \
     --stack-name LiveQuizEventStack \
     --query TemplateBody \
     > backup-template.json
   
   # Backup DynamoDB tables
   aws dynamodb create-backup \
     --table-name LiveQuizGamePins \
     --backup-name phase2-initial-backup
   ```

5. **Performance Baseline**
   - Document response times
   - Note concurrent user capacity
   - Record animation frame rates
   - Measure WebSocket latency

## Success Criteria

Phase 2 deployment is successful when:

- [x] All automated tests pass
- [x] All manual tests pass
- [x] No errors in CloudWatch logs
- [x] ECS service is healthy (running tasks = desired tasks)
- [x] CloudFront distributions are deployed
- [x] All Phase 2 features work on desktop
- [x] All Phase 2 features work on mobile
- [x] Animations are smooth (60fps)
- [x] WebSocket connections are stable
- [x] Images load within 2 seconds
- [x] Game PINs work reliably
- [x] No console errors in browser

## Next Steps

After Phase 2 deployment:

1. **Gather User Feedback**
   - Test with real users
   - Collect feedback on new features
   - Monitor usage patterns

2. **Optimize Performance**
   - Analyze CloudWatch metrics
   - Optimize slow queries
   - Reduce bundle size if needed

3. **Plan Phase 3** (if applicable)
   - Additional features
   - Performance improvements
   - Scalability enhancements

4. **Documentation**
   - Create user guides
   - Record demo videos
   - Update API documentation

## Support

For issues or questions:

1. Check CloudWatch logs: `aws logs tail /ecs/live-quiz-websocket-server --follow`
2. Review troubleshooting section above
3. Check GitHub issues (if applicable)
4. Contact development team

## Appendix

### Useful Commands

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs"

# View ECS logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Check ECS service status
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service

# List S3 buckets
aws s3 ls | grep live-quiz

# Check DynamoDB tables
aws dynamodb list-tables | grep LiveQuiz

# View CloudFront distributions
aws cloudfront list-distributions \
  --query "DistributionList.Items[*].[Id,DomainName,Status]"

# Check ECR images
aws ecr describe-images \
  --repository-name live-quiz-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'
```

### Environment Variables

**Backend (.env.production):**
```bash
AWS_REGION=us-east-1
EVENTS_TABLE=LiveQuizEvents
QUESTIONS_TABLE=LiveQuizQuestions
PARTICIPANTS_TABLE=LiveQuizParticipants
ANSWERS_TABLE=LiveQuizAnswers
GAME_PINS_TABLE=LiveQuizGamePins
QUESTION_IMAGES_BUCKET=live-quiz-question-images-*
CLOUDFRONT_IMAGES_URL=https://*.cloudfront.net
PORT=3000
NODE_ENV=production
```

**Frontend (.env.production):**
```bash
VITE_WS_URL=http://*.elb.amazonaws.com
VITE_API_URL=http://*.elb.amazonaws.com
```

### Cost Estimates

Phase 2 adds these AWS costs:

- **DynamoDB (GamePins):** ~$0.25/month (on-demand, low usage)
- **S3 (Images):** ~$0.023/GB/month + $0.005/1000 PUT requests
- **CloudFront (Images):** ~$0.085/GB data transfer
- **No additional ECS costs** (same container)

Estimated total: **$5-20/month** depending on usage

### Security Considerations

1. **S3 Bucket Security**
   - Block public access enabled
   - Access via CloudFront only
   - Encryption at rest enabled

2. **DynamoDB Security**
   - Encryption at rest enabled
   - IAM-based access control
   - TTL for automatic cleanup

3. **Image Upload Security**
   - File type validation
   - File size limits (5MB)
   - Virus scanning (recommended for production)

4. **Game PIN Security**
   - 6-digit codes (1 million combinations)
   - TTL expiration (24 hours)
   - Rate limiting recommended

