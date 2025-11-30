#!/bin/bash

# Deploy Backend to ECS
# This script builds, tags, and pushes the Docker image to ECR, then updates the ECS service
# Usage: ./deploy-backend.sh [environment]
# Example: ./deploy-backend.sh production

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
ECR_REPOSITORY_NAME="live-quiz-backend-${ENVIRONMENT}"
ECS_CLUSTER_NAME="live-quiz-cluster-${ENVIRONMENT}"
ECS_SERVICE_NAME="websocket-service-${ENVIRONMENT}"
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
    ECR_REPOSITORY_NAME="live-quiz-backend"
    ECS_CLUSTER_NAME="live-quiz-cluster"
    ECS_SERVICE_NAME="websocket-service"
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR repository URI
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

echo "========================================="
echo "Deploying Backend to ECS"
echo "========================================="
echo "AWS Account: ${AWS_ACCOUNT_ID}"
echo "Region: ${AWS_REGION}"
echo "ECR Repository: ${ECR_URI}"
echo "========================================="

# Step 1: Create ECR repository if it doesn't exist
echo "Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} > /dev/null 2>&1; then
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name ${ECR_REPOSITORY_NAME} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo "ECR repository created."
else
    echo "ECR repository already exists."
fi

# Step 2: Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

# Step 3: Build Docker image
echo "Building Docker image..."
cd ../backend

# Copy environment-specific .env file
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "Using .env.${ENVIRONMENT} for build..."
    cp .env.${ENVIRONMENT} .env.production.tmp
else
    echo "Warning: .env.${ENVIRONMENT} not found, using defaults"
fi

docker build -t ${ECR_REPOSITORY_NAME}:latest .

# Clean up temporary env file
rm -f .env.production.tmp

# Step 4: Tag image
echo "Tagging image..."
docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_URI}:latest
docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_URI}:$(date +%Y%m%d-%H%M%S)

# Step 5: Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_URI}:latest
docker push ${ECR_URI}:$(date +%Y%m%d-%H%M%S)

# Step 6: Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service ${ECS_SERVICE_NAME} \
    --force-new-deployment \
    --region ${AWS_REGION}

echo "========================================="
echo "Deployment initiated successfully!"
echo "========================================="
echo "Monitor deployment status:"
echo "aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME} --region ${AWS_REGION}"
echo ""
echo "View logs:"
echo "aws logs tail /ecs/live-quiz-websocket-server --follow --region ${AWS_REGION}"
