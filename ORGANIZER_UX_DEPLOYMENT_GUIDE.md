# Organizer UX Improvements - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Organizer UX Improvements feature to production. Follow these procedures to ensure a smooth, zero-downtime deployment.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Verification Procedures](#verification-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Tasks](#post-deployment-tasks)

---

## Deployment Overview

### What's Being Deployed

**Backend Changes**:
- New API endpoints for templates and quiz management
- Extended Event model with new fields
- Access control middleware
- WebSocket event handlers for real-time updates

**Frontend Changes**:
- OrganizerDashboard component
- SetupMode and LiveMode components
- PrivacySelector and TemplateSelector components
- PublicQuizBrowser component
- Enhanced navigation and state management

**Database Changes**:
- New fields in Event table
- Template table creation
- Additional indexes for queries

### Deployment Strategy

- **Phase 1**: Backend deployment (API and database)
- **Phase 2**: Database migration
- **Phase 3**: Frontend deployment
- **Phase 4**: Feature enablement and verification

### Estimated Duration

- **Total deployment time**: 30-45 minutes
- **Downtime**: None (zero-downtime deployment)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing (unit, integration, property-based)
- [ ] Code reviewed and approved
- [ ] Version tagged in Git
- [ ] Changelog updated
- [ ] Documentation complete

### Environment Preparation

- [ ] Staging deployment successful
- [ ] Database backups created
- [ ] AWS credentials configured
- [ ] Environment variables set
- [ ] CDK dependencies installed
- [ ] Docker images built

### Communication

- [ ] Deployment scheduled
- [ ] Team notified
- [ ] Users informed (if applicable)
- [ ] Support team briefed
- [ ] Rollback plan reviewed

---

## Deployment Steps

### Phase 1: Backend Deployment

#### Step 1.1: Build Backend

```bash
cd backend
npm install
npm run build
```

**Verify**:
```bash
# Check build output
ls -la dist/

# Should see compiled JavaScript files
```

#### Step 1.2: Build and Push Docker Image

```bash
cd infrastructure
./scripts/build-and-push.sh backend
```

**Expected Output**:
```
🐳 Building backend Docker image...
✓ Image built successfully
📤 Pushing to ECR...
✓ Image pushed: <account>.dkr.ecr.us-east-1.amazonaws.com/live-quiz-backend:latest
```

#### Step 1.3: Deploy Backend Infrastructure

```bash
cd infrastructure
npm run cdk deploy LiveQuizEventStack -- --require-approval never
```

**Expected Output**:
```
✨ Synthesis time: 5.2s
LiveQuizEventStack: deploying...
✅ LiveQuizEventStack

Outputs:
LiveQuizEventStack.BackendServiceURL = https://api.your-domain.com
LiveQuizEventStack.WebSocketURL = wss://ws.your-domain.com

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/LiveQuizEventStack/...
```

#### Step 1.4: Update ECS Service

```bash
cd infrastructure
./scripts/update-ecs-service.sh
```

**Expected Output**:
```
🔄 Updating ECS service...
✓ Service updated successfully
⏳ Waiting for deployment to complete...
✓ Deployment complete (2/2 tasks running)
```

#### Step 1.5: Verify Backend Deployment

```bash
# Check service health
curl https://api.your-domain.com/health

# Expected response:
# {"status": "healthy", "version": "2.0.0"}

# Test new endpoints
curl https://api.your-domain.com/api/events/organizer/test-org-id
curl https://api.your-domain.com/api/templates/public
```

### Phase 2: Database Migration

#### Step 2.1: Create Database Backup

```bash
aws dynamodb create-backup \
  --table-name live-quiz-events \
  --backup-name "pre-organizer-ux-deployment-$(date +%Y%m%d-%H%M%S)"
```

#### Step 2.2: Run Migration (Dry Run)

```bash
cd scripts
DRY_RUN=true ts-node migrate-events.ts
```

**Verify output shows no errors**

#### Step 2.3: Run Migration (Production)

```bash
cd scripts
ts-node migrate-events.ts
```

**Monitor progress**:
```
🚀 Starting migration...
📊 Found 150 events to migrate
✓ Migrated event: evt_123456 (1/150)
...
✅ Migration complete! 150 events migrated successfully.
```

#### Step 2.4: Verify Migration

```bash
cd scripts
ts-node test-migration.ts
```

**All tests should pass**

### Phase 3: Frontend Deployment

#### Step 3.1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

**Verify**:
```bash
# Check build output
ls -la dist/

# Should see index.html and assets/
```

#### Step 3.2: Deploy to S3

```bash
cd infrastructure
./scripts/deploy-frontend.sh
```

**Expected Output**:
```
📦 Building frontend...
✓ Build complete
☁️  Uploading to S3...
✓ Files uploaded to s3://live-quiz-frontend-bucket
🔄 Invalidating CloudFront cache...
✓ Cache invalidated
```

#### Step 3.3: Verify Frontend Deployment

```bash
# Check website is accessible
curl -I https://your-domain.com

# Expected: HTTP/2 200

# Test in browser
open https://your-domain.com
```

### Phase 4: Feature Enablement

#### Step 4.1: Enable Feature Flags (if applicable)

```bash
# Enable organizer UX features
aws ssm put-parameter \
  --name /app/features/organizer-ux \
  --value "enabled" \
  --overwrite

# Enable template system
aws ssm put-parameter \
  --name /app/features/templates \
  --value "enabled" \
  --overwrite

# Enable public quiz browser
aws ssm put-parameter \
  --name /app/features/public-browser \
  --value "enabled" \
  --overwrite
```

#### Step 4.2: Verify Features Enabled

```bash
# Check feature flags
aws ssm get-parameter --name /app/features/organizer-ux
aws ssm get-parameter --name /app/features/templates
aws ssm get-parameter --name /app/features/public-browser
```

---

## Verification Procedures

### Automated Testing

Run the deployment verification script:

```bash
cd scripts
./test-aws-deployment.sh
```

**Tests Performed**:
1. ✓ Backend health check
2. ✓ API endpoints responding
3. ✓ WebSocket connection
4. ✓ Frontend loading
5. ✓ Database queries working
6. ✓ New features accessible

### Manual Testing

#### Test 1: Organizer Dashboard

1. Log in as organizer
2. Navigate to "My Quizzes"
3. Verify dashboard displays
4. Check quiz categorization (Live, Upcoming, Past)
5. Test search functionality
6. Test filter tabs

**Expected**: Dashboard loads with all quizzes categorized correctly

#### Test 2: Quiz Creation

1. Click "Create New Quiz"
2. Select "Start from Blank"
3. Enter quiz details
4. Set privacy to "Private"
5. Add questions in Setup Mode
6. Click "Ready to Start Quiz"
7. Verify Game PIN displayed
8. Start quiz

**Expected**: Quiz transitions to Live Mode successfully

#### Test 3: Template System

1. Create a quiz with questions
2. Click "Save as Template"
3. Enter template details
4. Save template
5. Create new quiz from template
6. Verify questions copied

**Expected**: Template created and reused successfully

#### Test 4: Public Quiz Browser

1. Create a quiz
2. Set privacy to "Public"
3. Start quiz
4. Open public quiz browser (as participant)
5. Search for quiz
6. Verify quiz appears
7. Join quiz

**Expected**: Public quiz discoverable and joinable

#### Test 5: Real-Time Updates

1. Open organizer dashboard
2. Start a quiz in another tab
3. Verify dashboard updates in real-time
4. Have participant join
5. Verify participant count updates

**Expected**: Dashboard reflects changes immediately

### Performance Testing

```bash
# Test dashboard load time
time curl https://api.your-domain.com/api/events/organizer/test-org-id

# Should complete in < 2 seconds

# Test search performance
time curl "https://api.your-domain.com/api/events/public?search=math"

# Should complete in < 300ms
```

### Load Testing (Optional)

```bash
# Run load tests
cd backend
npm run test:load

# Monitor CloudWatch metrics during test
```

---

## Rollback Procedures

If critical issues are discovered, follow these rollback steps:

### Step 1: Assess Severity

Determine if rollback is necessary:
- **Critical**: Data loss, system unavailable, security issue → Rollback immediately
- **Major**: Feature broken, poor performance → Consider rollback
- **Minor**: UI glitch, non-critical bug → Fix forward

### Step 2: Rollback Frontend

```bash
# Revert to previous frontend version
cd infrastructure
./scripts/deploy-frontend.sh --version previous

# Or manually
aws s3 sync s3://backup-bucket/frontend-v1.0/ s3://live-quiz-frontend-bucket/
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### Step 3: Rollback Backend

```bash
# Revert ECS service to previous task definition
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service live-quiz-backend \
  --task-definition live-quiz-backend:previous

# Wait for deployment
aws ecs wait services-stable \
  --cluster live-quiz-cluster \
  --services live-quiz-backend
```

### Step 4: Rollback Database

```bash
# Run rollback migration script
cd scripts
ts-node rollback-migration.ts

# Or restore from backup if needed
aws dynamodb restore-table-from-backup \
  --target-table-name live-quiz-events \
  --backup-arn <backup-arn>
```

### Step 5: Disable Feature Flags

```bash
# Disable new features
aws ssm put-parameter \
  --name /app/features/organizer-ux \
  --value "disabled" \
  --overwrite
```

### Step 6: Verify Rollback

```bash
# Test system functionality
cd scripts
./test-aws-deployment.sh

# Verify old version working
curl https://api.your-domain.com/health
```

---

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor error logs
- [ ] Check CloudWatch metrics
- [ ] Review user feedback
- [ ] Verify all features working
- [ ] Update status page
- [ ] Notify team of completion

### Short-term (Week 1)

- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Address minor issues
- [ ] Update documentation
- [ ] Create user announcement
- [ ] Train support team

### Long-term (Month 1)

- [ ] Analyze usage patterns
- [ ] Optimize performance
- [ ] Plan improvements
- [ ] Review success metrics
- [ ] Document lessons learned
- [ ] Archive deployment artifacts

---

## Monitoring

### Key Metrics to Watch

**Backend**:
- API response times
- Error rates
- WebSocket connections
- Database query performance
- ECS task health

**Frontend**:
- Page load times
- JavaScript errors
- User engagement
- Feature adoption

**Database**:
- Read/write capacity
- Query latency
- Throttling events
- Storage usage

### CloudWatch Dashboards

Create dashboards for:
- API endpoint performance
- WebSocket metrics
- Database operations
- User activity

### Alerts

Set up alerts for:
- High error rates (>1%)
- Slow response times (>2s)
- Database throttling
- ECS task failures
- High memory/CPU usage

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code tested and reviewed
- [ ] Staging deployment successful
- [ ] Backups created
- [ ] Team notified
- [ ] Rollback plan ready

### Deployment
- [ ] Backend deployed
- [ ] Database migrated
- [ ] Frontend deployed
- [ ] Features enabled
- [ ] Verification tests passed

### Post-Deployment
- [ ] Monitoring enabled
- [ ] Metrics reviewed
- [ ] Users notified
- [ ] Documentation updated
- [ ] Support team briefed

---

## Troubleshooting

### Issue: Backend Deployment Fails

**Solution**:
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services live-quiz-backend

# Check task logs
aws logs tail /ecs/live-quiz-backend --follow
```

### Issue: Frontend Not Updating

**Solution**:
```bash
# Verify S3 upload
aws s3 ls s3://live-quiz-frontend-bucket/

# Force CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Issue: Migration Fails

**Solution**:
```bash
# Check migration logs
cat migration.log

# Resume from last successful event
RESUME_FROM=evt_123456 ts-node migrate-events.ts
```

### Issue: WebSocket Not Connecting

**Solution**:
```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Verify WebSocket endpoint
wscat -c wss://ws.your-domain.com
```

---

## Support

For deployment support:
- **Runbook**: This document
- **Logs**: CloudWatch Logs
- **Metrics**: CloudWatch Dashboards
- **Team**: DevOps on-call
- **Escalation**: Engineering lead

---

## Deployment Script Reference

### Build and Push Script

**Location**: `infrastructure/scripts/build-and-push.sh`

**Usage**:
```bash
./scripts/build-and-push.sh backend
./scripts/build-and-push.sh frontend
```

### Deploy All Script

**Location**: `infrastructure/scripts/deploy-all.sh`

**Usage**:
```bash
# Deploy everything
./scripts/deploy-all.sh

# Deploy specific component
./scripts/deploy-all.sh --backend-only
./scripts/deploy-all.sh --frontend-only
```

### Update ECS Service Script

**Location**: `infrastructure/scripts/update-ecs-service.sh`

**Usage**:
```bash
./scripts/update-ecs-service.sh
```

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 28, 2025  
**Compatibility**: Live Quiz Event System v2.0+
