#!/bin/bash

# Deploy Complete Stack (Infrastructure + Backend + Frontend)
# This script deploys the entire application to AWS
# Usage: ./deploy-all.sh [environment]
# Example: ./deploy-all.sh production

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

echo "========================================="
echo "Deploying Complete Stack"
echo "Environment: ${ENVIRONMENT}"
echo "========================================="

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

# Step 1: Deploy Infrastructure (CDK)
echo ""
echo "Step 1/3: Deploying Infrastructure..."
echo "========================================="
cd "$(dirname "$0")/.."

# Build CDK project
npm run build

# Deploy CDK stack
cdk deploy ${STACK_NAME} --require-approval never

echo "Infrastructure deployment complete!"

# Step 2: Deploy Backend
echo ""
echo "Step 2/3: Deploying Backend..."
echo "========================================="
./scripts/deploy-backend.sh ${ENVIRONMENT}

echo "Backend deployment complete!"

# Step 3: Deploy Frontend
echo ""
echo "Step 3/3: Deploying Frontend..."
echo "========================================="
./scripts/deploy-frontend.sh ${ENVIRONMENT}

echo "Frontend deployment complete!"

# Get final URLs
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="

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

echo "Frontend URL: ${CLOUDFRONT_URL}"
echo "Backend URL: ${WEBSOCKET_URL}"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to CloudFront"
echo "2. Configure SSL certificate for custom domain (if needed)"
echo "3. Update CORS_ORIGIN in backend environment variables"
echo "4. Test the application at ${CLOUDFRONT_URL}"
