#!/bin/bash

# Build and Push Docker Image to ECR
# This script only builds and pushes the Docker image without updating ECS
# Usage: ./build-and-push.sh [environment] [tag]
# Example: ./build-and-push.sh production v1.0.0

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

echo "Building and pushing Docker image for environment: ${ENVIRONMENT}"
echo "Image tag: ${IMAGE_TAG}"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY_NAME="live-quiz-backend-${ENVIRONMENT}"

# Use production repository name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    ECR_REPOSITORY_NAME="live-quiz-backend"
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR repository URI
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

echo "========================================="
echo "Building and Pushing Docker Image"
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
cd "$(dirname "$0")/../../backend"

# Copy environment-specific .env file
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "Using .env.${ENVIRONMENT} for build..."
    cp .env.${ENVIRONMENT} .env.production.tmp
else
    echo "Warning: .env.${ENVIRONMENT} not found, using defaults"
fi

docker build -t ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} .

# Clean up temporary env file
rm -f .env.production.tmp

# Step 4: Tag image
echo "Tagging image..."
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

# Also tag as latest if this is the latest tag
if [ "$IMAGE_TAG" = "latest" ] || [ -z "$IMAGE_TAG" ]; then
    docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_URI}:latest
fi

# Step 5: Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

if [ "$IMAGE_TAG" = "latest" ] || [ -z "$IMAGE_TAG" ]; then
    docker push ${ECR_URI}:latest
fi

echo "========================================="
echo "Build and push completed successfully!"
echo "========================================="
echo "Image URI: ${ECR_URI}:${IMAGE_TAG}"
echo ""
echo "To deploy this image, run:"
echo "./deploy-backend.sh ${ENVIRONMENT}"
