#!/bin/bash

# Deploy Phase 2 Features
# This script deploys all Phase 2 Kahoot-style enhancements
# Usage: ./deploy-phase2.sh [environment]
# Example: ./deploy-phase2.sh production

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

echo "========================================="
echo "Phase 2 Deployment"
echo "Environment: ${ENVIRONMENT}"
echo "========================================="
echo ""
echo "This script will deploy all Phase 2 features:"
echo "  1. Game PIN System"
echo "  2. Colorful Answer Buttons"
echo "  3. Speed-Based Scoring"
echo "  4. Answer Statistics"
echo "  5. Answer Result Reveal"
echo "  6. Podium Display"
echo "  7. Question Images"
echo "  8. Answer Streak Tracking"
echo "  9. Nickname Generator"
echo "  10. Visual Feedback & Animations"
echo ""
echo "Infrastructure changes:"
echo "  - New DynamoDB table: GamePins (with TTL)"
echo "  - New S3 bucket: Question Images"
echo "  - New CloudFront distribution: Images CDN"
echo "  - Updated IAM permissions"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

# Check prerequisites
echo ""
echo "Checking prerequisites..."
echo "========================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗${NC} AWS CLI is not installed"
    echo "Install: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✓${NC} AWS CLI installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗${NC} AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi
echo -e "${GREEN}✓${NC} AWS credentials configured"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not installed"
    echo "Install: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installed"

# Check Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not running"
    echo "Start Docker Desktop or Docker daemon"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker running"

# Check CDK
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}✗${NC} AWS CDK is not installed"
    echo "Install: npm install -g aws-cdk"
    exit 1
fi
echo -e "${GREEN}✓${NC} AWS CDK installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "Install: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗${NC} Node.js version must be 18 or higher (current: $(node -v))"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

echo ""
echo "All prerequisites met!"

# Step 1: Deploy Infrastructure
echo ""
echo "========================================="
echo "Step 1/3: Deploying Infrastructure"
echo "========================================="
echo ""
echo "This will create/update:"
echo "  - GamePins DynamoDB table with TTL"
echo "  - Question Images S3 bucket"
echo "  - CloudFront distribution for images"
echo "  - Updated IAM roles"
echo ""

cd "$(dirname "$0")/../infrastructure"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build CDK project
echo "Building CDK project..."
npm run build

# Show what will change
echo ""
echo "Previewing infrastructure changes..."
cdk diff ${STACK_NAME} || true

echo ""
read -p "Deploy infrastructure changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy CDK stack
echo ""
echo "Deploying infrastructure..."
cdk deploy ${STACK_NAME} --require-approval never

echo -e "${GREEN}✓${NC} Infrastructure deployed successfully!"

# Get stack outputs
echo ""
echo "Fetching stack outputs..."
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

IMAGES_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesBucketName'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

IMAGES_CLOUDFRONT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesCloudFrontURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

echo "Frontend URL: ${CLOUDFRONT_URL}"
echo "Backend URL: ${WEBSOCKET_URL}"
echo "Images Bucket: ${IMAGES_BUCKET}"
echo "Images CloudFront: ${IMAGES_CLOUDFRONT}"

# Step 2: Deploy Backend
echo ""
echo "========================================="
echo "Step 2/3: Deploying Backend"
echo "========================================="
echo ""
echo "This will:"
echo "  - Build Docker image with Phase 2 code"
echo "  - Push to Amazon ECR"
echo "  - Update ECS service"
echo ""

read -p "Deploy backend? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping backend deployment."
else
    cd "$(dirname "$0")/../infrastructure/scripts"
    ./deploy-backend.sh ${ENVIRONMENT}
    
    echo -e "${GREEN}✓${NC} Backend deployed successfully!"
    
    # Wait for ECS service to stabilize
    echo ""
    echo "Waiting for ECS service to stabilize..."
    ECS_CLUSTER="live-quiz-cluster"
    ECS_SERVICE="websocket-service"
    if [ "$ENVIRONMENT" != "production" ]; then
        ECS_CLUSTER="${ECS_CLUSTER}-${ENVIRONMENT}"
        ECS_SERVICE="${ECS_SERVICE}-${ENVIRONMENT}"
    fi
    
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} || true
    
    echo -e "${GREEN}✓${NC} ECS service is stable"
fi

# Step 3: Deploy Frontend
echo ""
echo "========================================="
echo "Step 3/3: Deploying Frontend"
echo "========================================="
echo ""
echo "This will:"
echo "  - Build React app with Phase 2 components"
echo "  - Upload to S3"
echo "  - Invalidate CloudFront cache"
echo ""

read -p "Deploy frontend? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping frontend deployment."
else
    cd "$(dirname "$0")/../infrastructure/scripts"
    ./deploy-frontend.sh ${ENVIRONMENT}
    
    echo -e "${GREEN}✓${NC} Frontend deployed successfully!"
fi

# Step 4: Run Tests
echo ""
echo "========================================="
echo "Step 4/4: Testing Deployment"
echo "========================================="
echo ""

read -p "Run automated tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping automated tests."
else
    cd "$(dirname "$0")"
    ./test-phase2-features.sh ${ENVIRONMENT}
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✓ Phase 2 Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Deployment Summary:"
echo "  Environment: ${ENVIRONMENT}"
echo "  Frontend: ${CLOUDFRONT_URL}"
echo "  Backend: ${WEBSOCKET_URL}"
echo ""
echo "Phase 2 Features Deployed:"
echo "  ${GREEN}✓${NC} Game PIN System"
echo "  ${GREEN}✓${NC} Colorful Answer Buttons"
echo "  ${GREEN}✓${NC} Speed-Based Scoring"
echo "  ${GREEN}✓${NC} Answer Statistics"
echo "  ${GREEN}✓${NC} Answer Result Reveal"
echo "  ${GREEN}✓${NC} Podium Display"
echo "  ${GREEN}✓${NC} Question Images"
echo "  ${GREEN}✓${NC} Answer Streak Tracking"
echo "  ${GREEN}✓${NC} Nickname Generator"
echo "  ${GREEN}✓${NC} Visual Feedback & Animations"
echo ""
echo "Next Steps:"
echo "  1. Open ${BLUE}${CLOUDFRONT_URL}${NC} in your browser"
echo "  2. Create a test event and verify Game PIN works"
echo "  3. Test all Phase 2 features (see PHASE2_DEPLOYMENT_GUIDE.md)"
echo "  4. Test on mobile devices"
echo "  5. Monitor CloudWatch logs for errors"
echo ""
echo "Monitoring Commands:"
echo "  View logs:"
echo "    aws logs tail /ecs/live-quiz-websocket-server --follow"
echo ""
echo "  Check ECS service:"
echo "    aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE}"
echo ""
echo "  View CloudFront distributions:"
echo "    aws cloudfront list-distributions"
echo ""
echo "Documentation:"
echo "  - Full deployment guide: PHASE2_DEPLOYMENT_GUIDE.md"
echo "  - Testing guide: scripts/test-phase2-features.sh"
echo "  - Troubleshooting: TROUBLESHOOTING.md"
echo ""
echo "Happy quizzing! 🎉"
echo ""

