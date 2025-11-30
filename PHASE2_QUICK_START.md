# Phase 2 Quick Start Guide

## 🚀 Deploy Phase 2 in 3 Steps

### Step 1: Deploy Everything
```bash
./scripts/deploy-phase2.sh production
```

This single command will:
- ✅ Check prerequisites
- ✅ Deploy infrastructure (GamePins table, Images bucket)
- ✅ Deploy backend (Docker to ECS)
- ✅ Deploy frontend (React to S3)
- ✅ Run automated tests

**Time:** ~15-20 minutes

### Step 2: Test Deployment
```bash
./scripts/test-phase2-features.sh production
```

This will verify:
- ✅ Game PIN system
- ✅ Image infrastructure
- ✅ All API endpoints
- ✅ DynamoDB tables
- ✅ S3 buckets
- ✅ CloudFront distributions

**Time:** ~5 minutes

### Step 3: Manual Testing

Open the app and test these key features:

1. **Game PIN** - Create event, use PIN to join
2. **Colorful Buttons** - Verify Red Triangle, Blue Diamond, etc.
3. **Speed Scoring** - Answer fast = 1000 points, slow = 500 points
4. **Statistics** - See bar chart after question ends
5. **Podium** - Complete quiz, see top 3 celebration
6. **Images** - Upload image to question
7. **Streaks** - Answer 3 correctly, see fire emoji
8. **Nicknames** - Join event, see 3 suggestions
9. **Animations** - Check all animations are smooth
10. **Mobile** - Test on actual mobile device

**Time:** ~15-20 minutes

---

## 📋 Prerequisites

Before deploying, ensure you have:

```bash
# Check AWS CLI
aws --version

# Check Docker
docker --version
docker info

# Check CDK
cdk --version

# Check Node.js (need 18+)
node --version
```

If missing, install:
- AWS CLI: https://aws.amazon.com/cli/
- Docker: https://docs.docker.com/get-docker/
- CDK: `npm install -g aws-cdk`
- Node.js: https://nodejs.org/

---

## 🎯 What Gets Deployed

### Infrastructure
- **GamePins Table** - DynamoDB with TTL (24 hours)
- **Images Bucket** - S3 with lifecycle (30 days)
- **Images CDN** - CloudFront distribution
- **IAM Roles** - S3 access for ECS tasks

### Backend Features
- Game PIN generation and lookup
- Speed-based scoring (500-1000 points)
- Answer statistics calculation
- Streak tracking
- Nickname generator
- Image upload and processing

### Frontend Features
- Colorful answer buttons with shapes
- Answer statistics bar chart
- Podium display with animations
- Question image display
- Streak indicator
- Nickname generator UI
- Framer Motion animations

---

## 🔍 Monitoring

### View Logs
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### Check ECS Service
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service
```

### Check Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs"
```

---

## 🆘 Troubleshooting

### Deployment Failed?

**Infrastructure issues:**
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name LiveQuizEventStack

# View stack events
aws cloudformation describe-stack-events --stack-name LiveQuizEventStack
```

**Backend issues:**
```bash
# Check ECS service
aws ecs describe-services --cluster live-quiz-cluster --services websocket-service

# View logs
aws logs tail /ecs/live-quiz-websocket-server --follow
```

**Frontend issues:**
```bash
# Check S3 bucket
aws s3 ls s3://live-quiz-frontend-*/

# Check CloudFront
aws cloudfront list-distributions
```

### Common Issues

**"Docker not running"**
- Start Docker Desktop
- Or: `sudo systemctl start docker` (Linux)

**"AWS credentials not configured"**
- Run: `aws configure`
- Enter Access Key ID and Secret Access Key

**"CDK not found"**
- Install: `npm install -g aws-cdk`

**"Node version too old"**
- Install Node.js 18+: https://nodejs.org/

---

## 📚 Documentation

- **Full Guide:** `PHASE2_DEPLOYMENT_GUIDE.md`
- **Testing:** `scripts/test-phase2-features.sh`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Summary:** `TASK_35_PHASE2_DEPLOYMENT.md`

---

## 💰 Cost Estimate

Phase 2 adds minimal costs:
- DynamoDB (GamePins): ~$0.25/month
- S3 (Images): ~$0.023/GB/month
- CloudFront (Images): ~$0.085/GB transfer

**Total: $5-20/month** depending on usage

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Frontend loads at CloudFront URL
- [ ] Backend health check returns OK
- [ ] Can create event with Game PIN
- [ ] Can join event using PIN
- [ ] Colorful answer buttons display correctly
- [ ] Speed-based scoring works (1000 → 500 points)
- [ ] Answer statistics show after question
- [ ] Podium displays after quiz ends
- [ ] Can upload and view question images
- [ ] Streak indicator updates correctly
- [ ] Nickname suggestions appear
- [ ] All animations are smooth
- [ ] Works on mobile device
- [ ] No errors in browser console
- [ ] No errors in CloudWatch logs

---

## 🎉 You're Done!

Phase 2 is deployed! Your quiz app now has:
- 🎯 Game PINs for easy joining
- 🎨 Colorful geometric answer buttons
- ⚡ Speed-based scoring
- 📊 Live answer statistics
- 🏆 Podium celebrations
- 🖼️ Question images
- 🔥 Answer streaks
- 🎭 Fun nicknames
- ✨ Smooth animations

**Enjoy your Kahoot-style quiz app!**

