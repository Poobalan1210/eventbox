#!/bin/bash

AWS_REGION="us-east-1"
STACK_NAME="LiveQuizEventStack"
ECS_CLUSTER="live-quiz-cluster"
ECS_SERVICE="websocket-service"

echo "🔍 AWS Deployment Status Check"
echo "==============================="
echo ""

# Check CloudFormation Stack
echo "📦 CloudFormation Stack Status:"
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].StackStatus' \
  --output text 2>&1)

echo "   Status: ${STACK_STATUS}"
echo ""

# Check ECS Service
echo "🐳 ECS Service Status:"
aws ecs describe-services \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION} \
  --query 'services[0].[serviceName,status,runningCount,desiredCount,deployments[0].rolloutState]' \
  --output table 2>&1 || echo "   Service not found or not accessible"
echo ""

# Check Target Health
echo "🎯 Load Balancer Target Health:"
TG_ARN=$(aws elbv2 describe-target-groups \
  --region ${AWS_REGION} \
  --names websocket-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text 2>&1)

if [ ! -z "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
    aws elbv2 describe-target-health \
      --target-group-arn ${TG_ARN} \
      --region ${AWS_REGION} \
      --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason]' \
      --output table 2>&1
else
    echo "   Target group not found"
fi
echo ""

# If stack is complete, show outputs
if [ "$STACK_STATUS" == "CREATE_COMPLETE" ] || [ "$STACK_STATUS" == "UPDATE_COMPLETE" ]; then
    echo "✅ Stack is complete! Here are your resources:"
    echo ""
    aws cloudformation describe-stacks \
      --stack-name ${STACK_NAME} \
      --region ${AWS_REGION} \
      --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
      --output table
fi
