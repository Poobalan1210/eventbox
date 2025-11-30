#!/bin/bash

# Deploy Frontend to S3 and CloudFront
# This script builds the frontend and deploys it to S3, then invalidates CloudFront cache
# Usage: ./deploy-frontend.sh [environment]
# Example: ./deploy-frontend.sh production

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

echo "Deploying to environment: ${ENVIRONMENT}"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

echo "========================================="
echo "Deploying Frontend to S3 + CloudFront"
echo "========================================="

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get stack outputs
echo "Fetching stack outputs from ${STACK_NAME}..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

WEBSOCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

echo "S3 Bucket: ${BUCKET_NAME}"
echo "CloudFront Distribution: ${DISTRIBUTION_ID}"
echo "CloudFront URL: ${CLOUDFRONT_URL}"
echo "========================================="

# Step 1: Build frontend with environment-specific configuration
echo "Building frontend for ${ENVIRONMENT}..."
cd ../frontend

# Create environment-specific .env file for build
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "Using .env.${ENVIRONMENT} for build..."
    # Update WebSocket URL with actual ALB URL
    cat .env.${ENVIRONMENT} > .env.production
    # Replace placeholder with actual WebSocket URL if available
    if [ ! -z "$WEBSOCKET_URL" ]; then
        sed -i.bak "s|VITE_WS_URL=.*|VITE_WS_URL=${WEBSOCKET_URL}|g" .env.production
        sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=${WEBSOCKET_URL}|g" .env.production
        rm -f .env.production.bak
    fi
else
    echo "Warning: .env.${ENVIRONMENT} not found, using defaults"
fi

npm run build

# Clean up
rm -f .env.production

# Step 2: Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --region ${AWS_REGION}

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
    --cache-control "public, max-age=0, must-revalidate" \
    --region ${AWS_REGION}

# Step 3: Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)

echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo "CloudFront URL: ${CLOUDFRONT_URL}"
echo "Invalidation ID: ${INVALIDATION_ID}"
echo ""
echo "Monitor invalidation status:"
echo "aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
