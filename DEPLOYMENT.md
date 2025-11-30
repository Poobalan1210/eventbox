# Live Quiz Event - Deployment Overview

This document provides an overview of deploying the Live Quiz Event system to AWS.

## Architecture

The system consists of three main components:

1. **Frontend** (React + Vite)
   - Hosted on S3
   - Distributed via CloudFront CDN
   - HTTPS enabled

2. **Backend** (Node.js + Express + Socket.io)
   - Runs on ECS Fargate
   - Behind Application Load Balancer
   - WebSocket support for real-time communication

3. **Database** (DynamoDB)
   - 4 tables: Events, Questions, Participants, Answers
   - On-demand billing
   - Encrypted at rest

## Quick Start

For a quick deployment, see [infrastructure/QUICKSTART.md](./infrastructure/QUICKSTART.md)

## Detailed Documentation

- **[Infrastructure README](./infrastructure/README.md)** - Complete infrastructure overview
- **[Deployment Guide](./infrastructure/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[Deployment Configuration](./infrastructure/DEPLOYMENT_CONFIG.md)** - Deployment scripts and configuration guide
- **[Deployment Checklist](./infrastructure/DEPLOYMENT_CHECKLIST.md)** - Pre and post-deployment checklist
- **[Deployment Commands](./infrastructure/DEPLOYMENT_COMMANDS.md)** - Quick command reference
- **[Scripts README](./infrastructure/scripts/README.md)** - Deployment scripts documentation
- **[Environment Variables](./infrastructure/ENV_VARIABLES.md)** - Configuration reference
- **[Quick Start](./infrastructure/QUICKSTART.md)** - Fast deployment guide

## Deployment Commands

From the project root:

```bash
# Deploy complete stack (infrastructure + backend + frontend)
npm run deploy:all          # Production (default)
npm run deploy:prod         # Production
npm run deploy:staging      # Staging
npm run deploy:dev          # Development

# Deploy individual components
npm run deploy:infrastructure  # Infrastructure only (CDK)
npm run deploy:backend production  # Backend only
npm run deploy:frontend production # Frontend only

# Build and push Docker image
npm run build:push production v1.0.0

# Invalidate CloudFront cache
npm run invalidate:cloudfront production "/*"
```

For more commands, see [Deployment Commands Reference](./infrastructure/DEPLOYMENT_COMMANDS.md)

## Infrastructure as Code

The infrastructure is defined using AWS CDK (TypeScript) in the `infrastructure/` directory.

Key resources:
- DynamoDB tables with appropriate indexes
- S3 bucket with CloudFront distribution
- VPC with public and private subnets
- ECS Fargate cluster and service
- Application Load Balancer
- Security groups and IAM roles
- CloudWatch log groups

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18+ and npm
- Docker installed
- AWS CDK CLI (`npm install -g aws-cdk`)

## Deployment Flow

```
1. Bootstrap CDK (first time only)
   ↓
2. Deploy infrastructure (CDK)
   ↓
3. Build and push backend Docker image
   ↓
4. Configure frontend environment
   ↓
5. Build and deploy frontend to S3
   ↓
6. Test deployment
```

## Cost Estimate

Approximate monthly costs for development environment:

- DynamoDB: $1-5
- ECS Fargate: $15-30
- ALB: $16-20
- NAT Gateway: $32-45
- CloudFront: $1-10
- S3: $1-2
- CloudWatch: $1-5

**Total: ~$67-117/month**

Production costs will scale with traffic and resource usage.

## Security Features

- HTTPS enforced on CloudFront
- DynamoDB encryption at rest
- ECS tasks in private subnets
- Security groups restrict traffic
- IAM roles with least privilege
- VPC network isolation

## Monitoring

- CloudWatch Logs for ECS tasks
- Container Insights for ECS metrics
- ALB health checks
- CloudWatch alarms (configure separately)

## Updating the Application

### Update Backend
```bash
npm run deploy:backend
```

### Update Frontend
```bash
npm run deploy:frontend
```

### Update Infrastructure
```bash
cd infrastructure
npm run deploy
```

## Cleanup

To delete all resources:

```bash
cd infrastructure
npm run destroy
```

**Warning**: This permanently deletes all data.

## Production Considerations

Before going to production:

1. **Enable HTTPS on ALB** - Add ACM certificate
2. **Custom Domain** - Configure Route 53 and CloudFront
3. **Auto Scaling** - Configure ECS service auto-scaling
4. **Monitoring** - Set up CloudWatch alarms
5. **Backups** - Enable DynamoDB backups
6. **WAF** - Add AWS WAF for DDoS protection
7. **Secrets** - Use AWS Secrets Manager
8. **CI/CD** - Implement automated deployment
9. **Multi-AZ** - Increase NAT Gateways and ECS tasks
10. **Change Removal Policies** - Set to RETAIN for data

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Check service status
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service
```

### WebSocket Connection Issues

```bash
# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Test health endpoint
curl http://<alb-url>/health
```

### Frontend Not Loading

```bash
# Check S3 contents
aws s3 ls s3://live-quiz-frontend-<account-id>/

# Check CloudFront status
aws cloudfront get-distribution --id <distribution-id>
```

## Support

For detailed information, see the documentation in the `infrastructure/` directory:

- [README.md](./infrastructure/README.md) - Infrastructure overview
- [DEPLOYMENT_GUIDE.md](./infrastructure/DEPLOYMENT_GUIDE.md) - Detailed deployment steps
- [ENV_VARIABLES.md](./infrastructure/ENV_VARIABLES.md) - Configuration reference
- [QUICKSTART.md](./infrastructure/QUICKSTART.md) - Quick deployment guide

## Development vs Production

### Development
- Single ECS task
- 1 NAT Gateway
- On-demand DynamoDB
- No custom domain
- HTTP only on ALB

### Production
- Multiple ECS tasks with auto-scaling
- 2+ NAT Gateways for HA
- Provisioned DynamoDB capacity
- Custom domain with Route 53
- HTTPS with ACM certificate
- WAF enabled
- CloudWatch alarms
- Automated backups
- CI/CD pipeline

## Next Steps

1. Complete the quick start deployment
2. Test the application
3. Review security best practices
4. Set up monitoring and alerts
5. Plan for production deployment
6. Implement CI/CD pipeline

For questions or issues, refer to the detailed documentation in the `infrastructure/` directory.
