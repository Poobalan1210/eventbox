#!/bin/bash

# Invalidate CloudFront Cache
# This script creates a CloudFront invalidation for all paths
# Usage: ./invalidate-cloudfront.sh [environment] [paths]
# Example: ./invalidate-cloudfront.sh production "/*"
# Example: ./invalidate-cloudfront.sh production "/index.html /assets/*"

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}
PATHS=${2:-"/*"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

echo "Invalidating CloudFront cache for environment: ${ENVIRONMENT}"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

echo "========================================="
echo "Invalidating CloudFront Cache"
echo "========================================="

# Get CloudFront distribution ID from stack outputs
echo "Fetching CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Error: Could not find CloudFront distribution ID in stack outputs"
    exit 1
fi

echo "Distribution ID: ${DISTRIBUTION_ID}"
echo "Paths to invalidate: ${PATHS}"
echo "========================================="

# Create invalidation
echo "Creating invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --paths ${PATHS} \
    --query "Invalidation.Id" \
    --output text)

echo "========================================="
echo "Invalidation created successfully!"
echo "========================================="
echo "Invalidation ID: ${INVALIDATION_ID}"
echo ""
echo "Monitor invalidation status:"
echo "aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
echo ""
echo "Wait for invalidation to complete:"
echo "aws cloudfront wait invalidation-completed --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
