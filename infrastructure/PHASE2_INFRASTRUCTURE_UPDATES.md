# Phase 2 Infrastructure Updates

This document summarizes the infrastructure updates made to support Phase 2 features (Game PIN system and Question Images).

## Changes Made

### 1. GamePins DynamoDB Table

**Added to CDK Stack:**
- Table Name: `LiveQuizGamePins`
- Partition Key: `gamePin` (String)
- TTL Attribute: `expiresAt` (for automatic cleanup after 24 hours)
- Billing Mode: PAY_PER_REQUEST
- Encryption: AWS_MANAGED

**Purpose:**
- Store Game PIN to Event ID mappings
- Enable quick PIN lookup for participants joining events
- Automatic expiration of PINs after 24 hours using TTL

### 2. Question Images S3 Bucket (Already Implemented)

**Bucket Configuration:**
- Bucket Name: `live-quiz-question-images-{account-id}`
- CORS enabled for uploads from frontend
- Lifecycle policy: Delete images after 30 days
- Encryption: S3_MANAGED
- SSL enforcement enabled

**CloudFront Distribution:**
- CDN for global image delivery
- HTTPS only
- Caching optimized for images
- Origin Access Identity for secure S3 access

### 3. IAM Permissions

**Task Role Permissions:**
- Read/Write access to GamePins table
- Read/Write access to Question Images S3 bucket
- All DynamoDB tables accessible by ECS tasks

### 4. Environment Variables

**Added to ECS Task Definition:**
- `GAME_PINS_TABLE_NAME`: Name of the GamePins DynamoDB table
- `QUESTION_IMAGES_BUCKET`: Name of the S3 bucket for question images
- `CLOUDFRONT_IMAGES_URL`: CloudFront distribution URL for serving images

**Updated Backend Environment Files:**
- `.env.example`
- `.env.local`
- `.env.development`
- `.env.staging`
- `.env.production`

All files now include:
- `GAME_PINS_TABLE` variable
- `QUESTION_IMAGES_BUCKET` variable
- `CLOUDFRONT_IMAGES_URL` variable

### 5. Local Development Setup

**Updated `scripts/setup-local-db.ts`:**
- GamePins table is created automatically for local development
- TTL configuration included (though DynamoDB Local may not fully support it)

## CDK Stack Outputs

The following outputs are available after deployment:

```bash
# GamePins Table
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='GamePinsTableName'].OutputValue" \
  --output text

# Question Images Bucket
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesBucketName'].OutputValue" \
  --output text

# Question Images CloudFront URL
aws cloudformation describe-stacks \
  --stack-name LiveQuizEventStack \
  --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesCloudFrontURL'].OutputValue" \
  --output text
```

## Deployment Instructions

### 1. Deploy Infrastructure Updates

```bash
cd infrastructure
npm run build
npx cdk diff  # Review changes
npx cdk deploy
```

### 2. Update Backend Environment

The environment variables are automatically set in the ECS task definition by CDK. No manual configuration needed for AWS deployments.

For local development:
```bash
cd backend
# Ensure .env.local has the new variables
npm run setup:local-db  # Creates GamePins table
```

### 3. Verify Deployment

```bash
# Check GamePins table exists
aws dynamodb describe-table --table-name LiveQuizGamePins

# Check S3 bucket exists
aws s3 ls | grep live-quiz-question-images

# Check CloudFront distributions
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='OAI for Live Quiz Question Images'].DomainName"
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    DynamoDB Tables                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐            │
│  │  Events  │  │ Questions │  │ GamePins │  ...       │
│  └──────────┘  └───────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │
                    ┌────┴────┐
                    │   ECS   │
                    │  Tasks  │
                    └────┬────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    S3 Buckets                            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Question Images  │  │  Frontend Assets │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
│           │                      │                       │
│           ▼                      ▼                       │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │   CloudFront     │  │   CloudFront     │            │
│  │  (Images CDN)    │  │  (Frontend CDN)  │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Cost Considerations

### GamePins Table
- PAY_PER_REQUEST billing: ~$1.25 per million read/write requests
- Storage: First 25 GB free, then $0.25/GB per month
- TTL: No additional cost

### Question Images S3 Bucket
- Storage: $0.023/GB per month (Standard)
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests
- Lifecycle transitions: Free

### CloudFront Distribution
- Data transfer: $0.085/GB for first 10 TB
- HTTP/HTTPS requests: $0.0075 per 10,000 requests
- Free tier: 1 TB data transfer out, 10 million requests per month

## Security Considerations

1. **S3 Bucket Security:**
   - Block all public access enabled
   - Access only through CloudFront with OAI
   - SSL enforcement enabled
   - Server-side encryption enabled

2. **DynamoDB Security:**
   - Encryption at rest with AWS managed keys
   - Point-in-time recovery enabled
   - Access controlled via IAM roles

3. **IAM Permissions:**
   - Least privilege principle applied
   - ECS tasks have only necessary permissions
   - No hardcoded credentials

4. **TTL for GamePins:**
   - Automatic cleanup prevents stale data
   - Reduces storage costs
   - Improves security by removing old PINs

## Troubleshooting

### GamePins Table Not Found
```bash
# Verify table exists
aws dynamodb list-tables | grep GamePins

# Check environment variable
aws ecs describe-task-definition \
  --task-definition websocket-task-def \
  --query "taskDefinition.containerDefinitions[0].environment[?name=='GAME_PINS_TABLE_NAME']"
```

### Image Upload Fails
```bash
# Check S3 bucket permissions
aws s3api get-bucket-policy --bucket live-quiz-question-images-{account-id}

# Check ECS task role
aws iam get-role-policy \
  --role-name LiveQuizEventStack-TaskRole \
  --policy-name S3Access
```

### Images Not Loading
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution \
  --id {distribution-id} \
  --query "Distribution.Status"

# Test image URL
curl -I https://{cloudfront-domain}/questions/{event-id}/{question-id}.jpg
```

## Next Steps

1. Deploy the updated infrastructure: `npm run deploy:infrastructure`
2. Update backend code to use new environment variables
3. Test Game PIN functionality
4. Test image upload and retrieval
5. Monitor CloudWatch logs for any issues

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [CloudFront with S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
