# Environment Variables Reference

This document lists all environment variables used in the Live Quiz Event system.

## Backend Environment Variables

These are automatically configured in the ECS task definition by CDK:

### Required Variables

| Variable | Description | Example | Set By |
|----------|-------------|---------|--------|
| `NODE_ENV` | Node environment | `production` | CDK |
| `AWS_REGION` | AWS region for services | `us-east-1` | CDK |
| `EVENTS_TABLE_NAME` | DynamoDB Events table | `LiveQuizEvents` | CDK |
| `QUESTIONS_TABLE_NAME` | DynamoDB Questions table | `LiveQuizQuestions` | CDK |
| `PARTICIPANTS_TABLE_NAME` | DynamoDB Participants table | `LiveQuizParticipants` | CDK |
| `ANSWERS_TABLE_NAME` | DynamoDB Answers table | `LiveQuizAnswers` | CDK |
| `GAME_PINS_TABLE_NAME` | DynamoDB GamePins table | `LiveQuizGamePins` | CDK |
| `QUESTION_IMAGES_BUCKET` | S3 bucket for question images | `live-quiz-question-images-123456789012` | CDK |
| `CLOUDFRONT_IMAGES_URL` | CloudFront URL for images | `https://d123abc.cloudfront.net` | CDK |
| `PORT` | Server port | `3000` | CDK |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | `https://example.com` |
| `MAX_PARTICIPANTS` | Max participants per event | `100` | `500` |
| `SESSION_TIMEOUT` | WebSocket session timeout (ms) | `300000` | `600000` |

## Frontend Environment Variables

These should be set in `frontend/.env` or `frontend/.env.production`:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://live-quiz-alb-123.us-east-1.elb.amazonaws.com/api` |
| `VITE_WEBSOCKET_URL` | WebSocket server URL | `http://live-quiz-alb-123.us-east-1.elb.amazonaws.com` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_APP_NAME` | Application name | `Live Quiz Event` | `My Quiz App` |
| `VITE_RECONNECT_ATTEMPTS` | WebSocket reconnect attempts | `5` | `10` |
| `VITE_RECONNECT_DELAY` | Initial reconnect delay (ms) | `1000` | `2000` |

## CDK Deployment Variables

These can be set when deploying infrastructure:

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CDK_DEFAULT_ACCOUNT` | AWS account ID | Current account | `123456789012` |
| `CDK_DEFAULT_REGION` | AWS region | `us-east-1` | `us-west-2` |
| `STACK_NAME` | CloudFormation stack name | `LiveQuizEventStack` | `MyQuizStack` |

## Setting Environment Variables

### For Local Development

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

Frontend:
```bash
cd frontend
cp .env.example .env
# Edit .env with your values
```

### For AWS Deployment

Backend environment variables are automatically set by CDK in the ECS task definition. To add custom variables:

1. Edit `infrastructure/lib/live-quiz-event-stack.ts`
2. Add to the `environment` section of the container definition:
   ```typescript
   environment: {
     // ... existing variables
     MY_CUSTOM_VAR: 'my-value',
   },
   ```
3. Redeploy: `npm run deploy:infrastructure`

For sensitive values, use AWS Secrets Manager:

```typescript
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const secret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'MySecret',
  'my-secret-name'
);

// In container definition:
secrets: {
  MY_SECRET: ecs.Secret.fromSecretsManager(secret),
},
```

### For Frontend Deployment

Frontend environment variables are baked into the build. To update:

1. Edit `frontend/.env.production`
2. Rebuild and redeploy:
   ```bash
   npm run deploy:frontend
   ```

## Retrieving Deployed Values

Get backend URL from CDK outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
  --output text
```

Get DynamoDB table names:
```bash
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?contains(OutputKey, 'TableName')].{Key:OutputKey,Value:OutputValue}" \
  --output table
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use AWS Secrets Manager** for sensitive data (API keys, passwords)
3. **Rotate credentials** regularly
4. **Use IAM roles** instead of access keys when possible
5. **Restrict CORS origins** in production
6. **Enable HTTPS** for all endpoints in production
7. **Use parameter store** for non-sensitive configuration
8. **Audit access** to secrets and parameters

## Troubleshooting

### Backend can't connect to DynamoDB

Check:
- IAM role has correct permissions
- Table names are correct
- AWS region matches table region
- VPC has internet access (NAT Gateway)

### Frontend can't connect to backend

Check:
- `VITE_API_URL` and `VITE_WEBSOCKET_URL` are correct
- CORS is configured on backend
- ALB security group allows traffic
- ECS tasks are running

### Environment variables not updating

Remember:
- Backend: Redeploy ECS service after changing task definition
- Frontend: Rebuild and redeploy after changing `.env`
- CDK: Run `cdk deploy` after changing stack code
