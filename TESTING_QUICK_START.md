# Testing Quick Start Guide

Get your Live Quiz Event system tested and deployed in minutes!

## 🎯 Goal

This guide helps you quickly test and verify the Live Quiz Event system both locally and on AWS.

## 📋 Prerequisites

- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] AWS CLI configured (for AWS deployment)
- [ ] All dependencies installed: `npm install`

## 🧪 Local Testing (5 minutes)

### Step 1: Start the Application

```bash
npm run dev
```

Wait for all services to start:
- ✅ DynamoDB Local (port 8000)
- ✅ Backend API (port 3001)
- ✅ Frontend (port 5173)

### Step 2: Run Automated Tests

Open a new terminal and run:

```bash
./scripts/test-local-flow.sh
```

This will:
- ✅ Check prerequisites
- ✅ Verify services are running
- ✅ Test API endpoints
- ✅ Verify database tables
- ✅ Test event creation

### Step 3: Manual Testing

Follow the interactive prompts to test:

1. **Create an event** at http://localhost:5173
2. **Add 2-3 questions** with multiple choice answers
3. **Join as a participant** in a new browser window
4. **Start the quiz** and answer questions
5. **Verify the leaderboard** updates correctly

### Step 4: Test Mobile Responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on iPhone SE (375px)
4. Verify all elements are readable and clickable

**✅ Local testing complete!**

## ☁️ AWS Deployment Testing (10 minutes)

### Step 1: Deploy to AWS

```bash
npm run deploy:all production
```

This will:
- Deploy infrastructure (DynamoDB, S3, CloudFront, ECS)
- Build and deploy backend Docker image
- Build and deploy frontend to S3

**Save the output URLs:**
- CloudFront URL: `https://d1234567890.cloudfront.net`
- WebSocket URL: `http://live-quiz-alb-123.us-east-1.elb.amazonaws.com`

### Step 2: Run Automated Tests

```bash
./scripts/test-aws-deployment.sh production
```

This will:
- ✅ Verify infrastructure is deployed
- ✅ Test backend API
- ✅ Verify frontend loads
- ✅ Check ECS service health
- ✅ Measure performance

### Step 3: Manual Testing

Follow the prompts to test:

1. **Open CloudFront URL** in your browser
2. **Create a test event** with questions
3. **Join as multiple participants** in different windows
4. **Complete the quiz** and verify real-time updates
5. **Check the leaderboard** for correct rankings

### Step 4: Mobile Device Testing

1. **Scan QR code** with your phone camera
2. **Join the event** on mobile browser
3. **Complete the quiz** on mobile
4. **Verify responsive layout** works correctly

**✅ AWS deployment testing complete!**

## 🚀 Quick Commands Reference

### Local Development
```bash
npm run dev                    # Start everything
./scripts/test-local-flow.sh   # Test local setup
npm run db:admin               # View database
```

### AWS Deployment
```bash
npm run deploy:all production          # Deploy everything
./scripts/test-aws-deployment.sh production  # Test deployment
npm run deploy:backend production      # Update backend only
npm run deploy:frontend production     # Update frontend only
```

### Monitoring
```bash
# View ECS logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Check ECS service
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service
```

## ✅ Success Checklist

### Local Testing
- [ ] All services start without errors
- [ ] Automated tests pass
- [ ] Can create events
- [ ] Can join as participant
- [ ] Quiz flow works end-to-end
- [ ] WebSocket connections work
- [ ] Mobile responsive in DevTools

### AWS Testing
- [ ] Infrastructure deploys successfully
- [ ] Automated tests pass
- [ ] Frontend loads at CloudFront URL
- [ ] Backend API responds
- [ ] Can create events on AWS
- [ ] Can join as participant
- [ ] Quiz flow works end-to-end
- [ ] QR code scanning works
- [ ] Mobile devices work correctly

## 🆘 Common Issues

### Local: "Docker not running"
**Solution:** Start Docker Desktop

### Local: "Port 3001 already in use"
**Solution:** 
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

### AWS: "Frontend not loading"
**Solution:**
```bash
npm run deploy:frontend production
npm run invalidate:cloudfront production "/*"
```

### AWS: "Backend not responding"
**Solution:**
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
npm run deploy:backend production
```

## 📚 Detailed Documentation

For more information:

- **Complete Testing Guide**: [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md)
- **Integration Guide**: [FINAL_INTEGRATION_GUIDE.md](./FINAL_INTEGRATION_GUIDE.md)
- **Quick Reference**: [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 🎉 You're Done!

Your Live Quiz Event system is now:
- ✅ Tested locally
- ✅ Deployed to AWS
- ✅ Verified on desktop and mobile
- ✅ Ready for production use

**Next Steps:**
1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Enable auto-scaling
4. Implement CI/CD pipeline

---

**Need help?** Check the detailed guides or review CloudWatch logs for errors.

