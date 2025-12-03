#!/bin/bash

set -e

echo "🚀 Deploying Backend to AWS ECS"
echo "================================"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="333105300941"
ECR_REPO="live-quiz-backend"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
IMAGE_TAG="v1.0.0"
ECS_CLUSTER="live-quiz-cluster"
ECS_SERVICE="websocket-service"
TASK_FAMILY="LiveQuizEventStack-WebSocketTaskDef"

echo "📋 Configuration:"
echo "   AWS Region: ${AWS_REGION}"
echo "   ECR Repository: ${ECR_URI}"
echo "   Image Tag: ${IMAGE_TAG}"
echo "   ECS Cluster: ${ECS_CLUSTER}"
echo "   ECS Service: ${ECS_SERVICE}"
echo ""

# Step 1: Authenticate Docker with ECR
echo "🔐 Step 1: Authenticating Docker with ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo "✅ Docker authenticated"
echo ""

# Step 2: Build Docker image for AMD64 (AWS ECS platform)
echo "🏗️  Step 2: Building Docker image for linux/amd64..."
cd backend
docker buildx build --platform linux/amd64 -t ${ECR_REPO}:${IMAGE_TAG} -t ${ECR_REPO}:latest .
echo "✅ Docker image built"
echo ""

# Step 3: Tag image for ECR
echo "🏷️  Step 3: Tagging image for ECR..."
docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
docker tag ${ECR_REPO}:latest ${ECR_URI}:latest
echo "✅ Image tagged"
echo ""

# Step 4: Push to ECR
echo "📤 Step 4: Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}
docker push ${ECR_URI}:latest
echo "✅ Image pushed to ECR"
echo ""

# Step 5: Get current task definition
echo "📝 Step 5: Updating ECS task definition..."
TASK_DEF_ARN=$(aws ecs describe-services \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION} \
  --query 'services[0].taskDefinition' \
  --output text)

echo "   Current task definition: ${TASK_DEF_ARN}"

# Get the task definition
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition ${TASK_DEF_ARN} \
  --region ${AWS_REGION} \
  --query 'taskDefinition')

# Update the image in the task definition
NEW_TASK_DEF=$(echo ${TASK_DEF} | jq --arg IMAGE "${ECR_URI}:${IMAGE_TAG}" '
  .containerDefinitions[0].image = $IMAGE |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
')

# Register new task definition
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
  --region ${AWS_REGION} \
  --cli-input-json "${NEW_TASK_DEF}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "   New task definition: ${NEW_TASK_DEF_ARN}"
echo "✅ Task definition updated"
echo ""

# Step 6: Update ECS service
echo "🔄 Step 6: Updating ECS service..."
aws ecs update-service \
  --cluster ${ECS_CLUSTER} \
  --service ${ECS_SERVICE} \
  --task-definition ${NEW_TASK_DEF_ARN} \
  --region ${AWS_REGION} \
  --force-new-deployment \
  --query 'service.[serviceName,status,runningCount,desiredCount]' \
  --output table

echo "✅ ECS service updated"
echo ""

# Step 7: Wait for service to stabilize
echo "⏳ Step 7: Waiting for service to stabilize (this may take 2-5 minutes)..."
echo "   You can monitor progress in the AWS Console or run:"
echo "   aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}"
echo ""

# Optional: Wait for service to become stable
# aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}

echo "🎉 Backend deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Monitor the deployment: aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}"
echo "2. Check task logs: aws logs tail /ecs/live-quiz-websocket-server --follow --region ${AWS_REGION}"
echo "3. Once healthy, run: ./check-deployment.sh"
echo ""
