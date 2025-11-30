#!/bin/bash

# Update ECS Service with New Task Definition
# This script forces a new deployment of the ECS service
# Usage: ./update-ecs-service.sh [environment]
# Example: ./update-ecs-service.sh production

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

echo "Updating ECS service for environment: ${ENVIRONMENT}"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECS_CLUSTER_NAME="live-quiz-cluster-${ENVIRONMENT}"
ECS_SERVICE_NAME="websocket-service-${ENVIRONMENT}"

# Use production names if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    ECS_CLUSTER_NAME="live-quiz-cluster"
    ECS_SERVICE_NAME="websocket-service"
fi

echo "========================================="
echo "Updating ECS Service"
echo "========================================="
echo "Cluster: ${ECS_CLUSTER_NAME}"
echo "Service: ${ECS_SERVICE_NAME}"
echo "Region: ${AWS_REGION}"
echo "========================================="

# Update ECS service
echo "Forcing new deployment..."
aws ecs update-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service ${ECS_SERVICE_NAME} \
    --force-new-deployment \
    --region ${AWS_REGION}

echo "========================================="
echo "Service update initiated successfully!"
echo "========================================="
echo ""
echo "Monitor deployment status:"
echo "aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME} --region ${AWS_REGION}"
echo ""
echo "View logs:"
echo "aws logs tail /ecs/live-quiz-websocket-server --follow --region ${AWS_REGION}"
echo ""
echo "Check service events:"
echo "aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME} --query 'services[0].events[0:5]' --region ${AWS_REGION}"
