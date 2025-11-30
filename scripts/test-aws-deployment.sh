#!/bin/bash

# Test AWS Deployment
# This script verifies the deployed application on AWS
# Usage: ./test-aws-deployment.sh [environment]
# Example: ./test-aws-deployment.sh production

set -e

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

echo "========================================="
echo "AWS Deployment Test"
echo "Environment: ${ENVIRONMENT}"
echo "Stack: ${STACK_NAME}"
echo "========================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗${NC} AWS CLI is not installed"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗${NC} AWS credentials not configured"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS CLI configured"

echo ""
echo "Step 1: Fetching Stack Outputs"
echo "========================================="

# Get stack outputs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

WEBSOCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ -z "$CLOUDFRONT_URL" ] || [ -z "$WEBSOCKET_URL" ]; then
    echo -e "${RED}✗${NC} Failed to fetch stack outputs. Is the stack deployed?"
    exit 1
fi

echo -e "${GREEN}✓${NC} Stack outputs retrieved"
echo "Frontend URL: ${CLOUDFRONT_URL}"
echo "Backend URL: ${WEBSOCKET_URL}"
echo "CloudFront Distribution: ${DISTRIBUTION_ID}"
echo "S3 Bucket: ${BUCKET_NAME}"

echo ""
echo "Step 2: Testing Infrastructure"
echo "========================================="

# Test DynamoDB tables
tables=("LiveQuizEvents" "LiveQuizQuestions" "LiveQuizParticipants" "LiveQuizAnswers")
for table in "${tables[@]}"; do
    echo -n "Checking DynamoDB table ${table}... "
    if aws dynamodb describe-table --table-name "$table" --region ${AWS_REGION} &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        exit 1
    fi
done

# Test S3 bucket
echo -n "Checking S3 bucket... "
if aws s3 ls "s3://${BUCKET_NAME}/" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    file_count=$(aws s3 ls "s3://${BUCKET_NAME}/" --recursive | wc -l)
    echo "  Files in bucket: ${file_count}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Test CloudFront distribution
echo -n "Checking CloudFront distribution... "
distribution_status=$(aws cloudfront get-distribution \
    --id ${DISTRIBUTION_ID} \
    --query "Distribution.Status" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$distribution_status" = "Deployed" ]; then
    echo -e "${GREEN}✓${NC} (Status: Deployed)"
else
    echo -e "${YELLOW}!${NC} (Status: ${distribution_status})"
fi

# Test ECS service
ECS_CLUSTER="live-quiz-cluster"
ECS_SERVICE="websocket-service"
if [ "$ENVIRONMENT" != "production" ]; then
    ECS_CLUSTER="${ECS_CLUSTER}-${ENVIRONMENT}"
    ECS_SERVICE="${ECS_SERVICE}-${ENVIRONMENT}"
fi

echo -n "Checking ECS service... "
running_count=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query "services[0].runningCount" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

desired_count=$(aws ecs describe-services \
    --cluster ${ECS_CLUSTER} \
    --services ${ECS_SERVICE} \
    --query "services[0].desiredCount" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$running_count" = "$desired_count" ] && [ "$running_count" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} (${running_count}/${desired_count} tasks running)"
else
    echo -e "${YELLOW}!${NC} (${running_count}/${desired_count} tasks running)"
fi

echo ""
echo "Step 3: Testing Backend API"
echo "========================================="

# Test health endpoint
echo -n "Testing health endpoint... "
health_response=$(curl -s "${WEBSOCKET_URL}/health" 2>/dev/null)
if echo "$health_response" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Health check failed: $health_response"
    exit 1
fi

# Test CORS headers
echo -n "Testing CORS headers... "
cors_response=$(curl -s -I -X OPTIONS "${WEBSOCKET_URL}/api/events" \
    -H "Origin: ${CLOUDFRONT_URL}" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null)

if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} CORS headers not found (may need configuration)"
fi

# Test event creation
echo -n "Testing event creation... "
event_response=$(curl -s -X POST "${WEBSOCKET_URL}/api/events" \
    -H "Content-Type: application/json" \
    -d '{"name":"AWS Test Event"}' 2>/dev/null)

if echo "$event_response" | grep -q "eventId"; then
    echo -e "${GREEN}✓${NC}"
    EVENT_ID=$(echo "$event_response" | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
    echo "  Created event: $EVENT_ID"
else
    echo -e "${RED}✗${NC}"
    echo "  Event creation failed: $event_response"
    exit 1
fi

# Test question creation
echo -n "Testing question creation... "
question_response=$(curl -s -X POST "${WEBSOCKET_URL}/api/events/${EVENT_ID}/questions" \
    -H "Content-Type: application/json" \
    -d '{
        "text": "AWS Test Question",
        "options": [
            {"id": "a", "text": "Option A"},
            {"id": "b", "text": "Option B"}
        ],
        "correctOptionId": "a",
        "timerSeconds": 30
    }' 2>/dev/null)

if echo "$question_response" | grep -q "questionId"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Question creation failed: $question_response"
    exit 1
fi

echo ""
echo "Step 4: Testing Frontend"
echo "========================================="

# Test frontend loads
echo -n "Testing frontend loads... "
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "${CLOUDFRONT_URL}" 2>/dev/null)

if [ "$frontend_response" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} (HTTP ${frontend_response})"
    exit 1
fi

# Test static assets
echo -n "Testing static assets... "
assets_response=$(curl -s -o /dev/null -w "%{http_code}" "${CLOUDFRONT_URL}/assets/" 2>/dev/null)

if [ "$assets_response" = "200" ] || [ "$assets_response" = "403" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} (HTTP ${assets_response})"
fi

echo ""
echo "Step 5: Testing CloudWatch Logs"
echo "========================================="

# Check if logs exist
echo -n "Checking ECS logs... "
log_streams=$(aws logs describe-log-streams \
    --log-group-name "/ecs/live-quiz-websocket-server" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --region ${AWS_REGION} 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
    echo "  View logs: aws logs tail /ecs/live-quiz-websocket-server --follow --region ${AWS_REGION}"
else
    echo -e "${YELLOW}!${NC} No logs found yet"
fi

echo ""
echo "Step 6: Performance Check"
echo "========================================="

# Test response time
echo -n "Testing API response time... "
start_time=$(date +%s%N)
curl -s "${WEBSOCKET_URL}/health" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✓${NC} (${response_time}ms)"
elif [ $response_time -lt 2000 ]; then
    echo -e "${YELLOW}!${NC} (${response_time}ms - acceptable)"
else
    echo -e "${RED}✗${NC} (${response_time}ms - slow)"
fi

echo ""
echo "Step 7: Manual Testing Checklist"
echo "========================================="
echo ""
echo "Please perform the following manual tests:"
echo ""
echo "1. Open ${BLUE}${CLOUDFRONT_URL}${NC} in your browser"
echo "   ${YELLOW}→${NC} Verify the home page loads"
echo "   ${YELLOW}→${NC} Check browser console for errors (F12)"
echo ""
echo "2. Create a test event"
echo "   ${YELLOW}→${NC} Add 2-3 questions"
echo "   ${YELLOW}→${NC} Verify QR code generates"
echo "   ${YELLOW}→${NC} Copy join link"
echo ""
echo "3. Test participant flow"
echo "   ${YELLOW}→${NC} Open join link in new window"
echo "   ${YELLOW}→${NC} Join with test name"
echo "   ${YELLOW}→${NC} Verify WebSocket connection (check Network tab)"
echo ""
echo "4. Test quiz flow"
echo "   ${YELLOW}→${NC} Start quiz from organizer dashboard"
echo "   ${YELLOW}→${NC} Answer questions as participant"
echo "   ${YELLOW}→${NC} Verify real-time updates"
echo "   ${YELLOW}→${NC} Check leaderboard updates"
echo ""
echo "5. Test mobile responsiveness"
echo "   ${YELLOW}→${NC} Open on actual mobile device"
echo "   ${YELLOW}→${NC} Scan QR code with phone camera"
echo "   ${YELLOW}→${NC} Complete quiz on mobile"
echo "   ${YELLOW}→${NC} Verify touch targets are adequate"
echo "   ${YELLOW}→${NC} Verify no horizontal scrolling"
echo ""
echo "6. Test with multiple participants"
echo "   ${YELLOW}→${NC} Open 3-5 participant windows"
echo "   ${YELLOW}→${NC} Join with different names"
echo "   ${YELLOW}→${NC} Complete quiz simultaneously"
echo "   ${YELLOW}→${NC} Verify leaderboard ranking"
echo ""
echo "========================================="
echo ""
read -p "Have you completed all manual tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please complete the manual tests.${NC}"
    exit 1
fi

echo ""
echo "Step 8: Mobile Device Testing"
echo "========================================="
echo ""
echo "Mobile testing checklist:"
echo "1. Scan QR code with phone camera"
echo "2. Join event on mobile browser"
echo "3. Complete full quiz on mobile"
echo "4. Test on both iOS and Android if possible"
echo "5. Test in portrait and landscape modes"
echo "6. Verify all buttons are easily tappable"
echo "7. Verify text is readable without zooming"
echo ""
read -p "Have you tested on actual mobile devices? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Mobile testing recommended before production.${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ AWS Deployment Tests Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  Frontend: ${CLOUDFRONT_URL}"
echo "  Backend: ${WEBSOCKET_URL}"
echo "  Environment: ${ENVIRONMENT}"
echo ""
echo "Monitoring commands:"
echo "  View logs: aws logs tail /ecs/live-quiz-websocket-server --follow"
echo "  Check ECS: aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE}"
echo "  Check CloudFront: aws cloudfront get-distribution --id ${DISTRIBUTION_ID}"
echo ""
echo "Next steps:"
echo "  1. Monitor CloudWatch logs for errors"
echo "  2. Set up CloudWatch alarms"
echo "  3. Configure custom domain (optional)"
echo "  4. Enable HTTPS on ALB (recommended)"
echo "  5. Set up CI/CD pipeline"
echo ""
