# Quick Start Guide

Get the Live Quiz Event system deployed to AWS in under 30 minutes.

## Prerequisites

- AWS Account
- AWS CLI configured (`aws configure`)
- Node.js 18+ and npm
- Docker installed

## Step-by-Step Deployment

### 1. Install Dependencies (5 minutes)

```bash
# From project root
npm install

# Install CDK globally if not already installed
npm install -g aws-cdk
```

### 2. Bootstrap CDK (2 minutes, first time only)

```bash
cd infrastructure
cdk bootstrap
```

### 3. Deploy Infrastructure (10 minutes)

```bash
npm run deploy
```

Save the output values - you'll need them!

### 4. Build and Deploy Backend (8 minutes)

```bash
# From project root
npm run deploy:backend
```

This will:
- Create ECR repository
- Build Docker image
- Push to ECR
- Deploy to ECS

### 5. Configure Frontend (2 minutes)

Get the backend URL:
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
  --output text
```

Update `frontend/.env`:
```env
VITE_API_URL=http://<alb-url>/api
VITE_WEBSOCKET_URL=http://<alb-url>
```

### 6. Deploy Frontend (3 minutes)

```bash
# From project root
npm run deploy:frontend
```

### 7. Test Your Deployment

Get the CloudFront URL:
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text
```

Open the URL in your browser and create your first quiz event!

## Troubleshooting

### Backend not responding?

Check ECS logs:
```bash
aws logs tail /ecs/live-quiz-websocket-server --follow
```

### Frontend not loading?

Verify S3 upload:
```bash
aws s3 ls s3://live-quiz-frontend-<account-id>/
```

### Need to redeploy?

Backend:
```bash
npm run deploy:backend
```

Frontend:
```bash
npm run deploy:frontend
```

Infrastructure:
```bash
cd infrastructure && npm run deploy
```

## What's Next?

- [ ] Set up custom domain (see DEPLOYMENT_GUIDE.md)
- [ ] Enable HTTPS on ALB (see DEPLOYMENT_GUIDE.md)
- [ ] Configure auto-scaling (see DEPLOYMENT_GUIDE.md)
- [ ] Set up monitoring and alerts
- [ ] Review security best practices

## Cost Estimate

Expected monthly cost: **$67-117** for low-traffic development environment

See DEPLOYMENT_GUIDE.md for detailed cost breakdown.

## Cleanup

To delete everything:
```bash
cd infrastructure
npm run destroy
```

## Need Help?

- Full deployment guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Environment variables: [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- Infrastructure details: [README.md](./README.md)
