# Deployment Quick Reference

Quick commands and checklists for deploying the Live Quiz Event system.

## 🚀 Quick Deploy to AWS

```bash
# One command to deploy everything
npm run deploy:all production
```

## 📋 Pre-Flight Checklist

- [ ] AWS CLI configured: `aws sts get-caller-identity`
- [ ] Docker running: `docker ps`
- [ ] All local tests passed: `./scripts/test-local-flow.sh`
- [ ] Code committed to git

## 🧪 Testing Commands

### Local Testing
```bash
# Start local environment
npm run dev

# Run automated tests
./scripts/test-local-flow.sh
```

### AWS Testing
```bash
# After deployment, verify
./scripts/test-aws-deployment.sh production
```

## 🔧 Individual Deployment Commands

### Infrastructure Only
```bash
cd infrastructure
npm run build
cdk deploy
```

### Backend Only
```bash
npm run deploy:backend production
```

### Frontend Only
```bash
npm run deploy:frontend production
```

## 📊 Monitoring Commands

### Check ECS Service
```bash
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service
```

### View Logs
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### Check CloudFront Status
```bash
aws cloudfront get-distribution --id <distribution-id>
```

## 🔄 Update Commands

### Update Backend
```bash
npm run deploy:backend production
```

### Update Frontend
```bash
npm run deploy:frontend production
```

### Invalidate CloudFront Cache
```bash
npm run invalidate:cloudfront production "/*"
```

## 🆘 Emergency Rollback

### Rollback Backend
```bash
# List previous versions
aws ecs list-task-definitions --family-prefix websocket-task

# Rollback to previous
aws ecs update-service \
  --cluster live-quiz-cluster \
  --service websocket-service \
  --task-definition websocket-task:PREVIOUS_REVISION
```

### Rollback Frontend
```bash
git checkout <previous-commit>
npm run deploy:frontend production
```

## 🎯 Success Indicators

After deployment, verify:

- [ ] Frontend loads: `https://<cloudfront-url>`
- [ ] Backend health: `curl http://<alb-url>/health`
- [ ] ECS tasks running: Check AWS Console
- [ ] No errors in logs: `aws logs tail /ecs/live-quiz-websocket-server`
- [ ] Can create event
- [ ] Can join as participant
- [ ] WebSocket connects
- [ ] Quiz flow works end-to-end

## 📱 Mobile Testing

- [ ] Scan QR code with phone
- [ ] Join event on mobile browser
- [ ] Complete quiz on mobile
- [ ] Verify responsive layout
- [ ] Test on iOS and Android

## 🔐 Security Checklist

- [ ] HTTPS enabled on CloudFront
- [ ] CORS configured correctly
- [ ] DynamoDB encryption enabled
- [ ] ECS tasks in private subnets
- [ ] Security groups configured
- [ ] IAM roles least privilege

## 📈 Performance Targets

- Frontend load: < 2 seconds
- API response: < 500ms
- Question display: < 2 seconds
- Leaderboard update: < 2 seconds
- WebSocket latency: < 100ms

## 🔗 Quick Links

- [Full Integration Guide](./FINAL_INTEGRATION_GUIDE.md)
- [Deployment Verification](./DEPLOYMENT_VERIFICATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Infrastructure Guide](./infrastructure/README.md)

## 💡 Pro Tips

1. **Always test locally first**: Run `./scripts/test-local-flow.sh`
2. **Deploy to staging first**: Use `npm run deploy:staging`
3. **Monitor during deployment**: Watch CloudWatch logs
4. **Keep outputs handy**: Save CloudFront and ALB URLs
5. **Test mobile early**: Don't wait until production

## 🆘 Common Issues

### Frontend not loading
```bash
npm run deploy:frontend production
npm run invalidate:cloudfront production "/*"
```

### Backend not responding
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
npm run deploy:backend production
```

### WebSocket not connecting
- Check browser console for errors
- Verify WebSocket URL in frontend config
- Check ALB listener configuration

## 📞 Support

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review CloudWatch logs
- Check AWS service health dashboard

---

**Remember:** Test locally → Deploy to staging → Verify → Deploy to production

