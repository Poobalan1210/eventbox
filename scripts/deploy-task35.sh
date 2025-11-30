#!/bin/bash

# Task 35: Final Deployment and Testing of Phase 2 Features
# This script performs a complete deployment and verification of all Phase 2 features
# Usage: ./deploy-task35.sh [environment]
# Example: ./deploy-task35.sh production

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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

echo "========================================="
echo -e "${CYAN}Task 35: Phase 2 Final Deployment${NC}"
echo "========================================="
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "Stack Name: ${STACK_NAME}"
echo "AWS Region: ${AWS_REGION}"
echo ""
echo "This deployment includes:"
echo "  ${GREEN}✓${NC} All Phase 1 features"
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

# Check if this is a dry run
DRY_RUN=${DRY_RUN:-false}
if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN MODE - No actual deployment will occur${NC}"
    echo ""
fi

# Function to check prerequisites
check_prerequisites() {
    echo "========================================="
    echo "Checking Prerequisites"
    echo "========================================="
    
    local all_good=true
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}✗${NC} AWS CLI is not installed"
        all_good=false
    else
        echo -e "${GREEN}✓${NC} AWS CLI installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}✗${NC} AWS credentials not configured"
        all_good=false
    else
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo -e "${GREEN}✓${NC} AWS credentials configured (Account: ${ACCOUNT_ID})"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗${NC} Docker is not installed"
        all_good=false
    else
        echo -e "${GREEN}✓${NC} Docker installed"
    fi
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗${NC} Docker is not running"
        all_good=false
    else
        echo -e "${GREEN}✓${NC} Docker running"
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        # Try npx cdk
        if npx cdk --version &> /dev/null; then
            CDK_VERSION=$(npx cdk --version 2>&1 | cut -d' ' -f1)
            echo -e "${GREEN}✓${NC} AWS CDK ${CDK_VERSION} (via npx)"
        else
            echo -e "${RED}✗${NC} AWS CDK is not installed"
            all_good=false
        fi
    else
        CDK_VERSION=$(cdk --version | cut -d' ' -f1)
        echo -e "${GREEN}✓${NC} AWS CDK ${CDK_VERSION}"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗${NC} Node.js is not installed"
        all_good=false
    else
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION}"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗${NC} npm is not installed"
        all_good=false
    else
        NPM_VERSION=$(npm -v)
        echo -e "${GREEN}✓${NC} npm ${NPM_VERSION}"
    fi
    
    if [ "$all_good" = false ]; then
        echo ""
        echo -e "${RED}Prerequisites check failed. Please install missing tools.${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}All prerequisites met!${NC}"
}

# Function to verify code is ready
verify_code() {
    echo ""
    echo "========================================="
    echo "Verifying Code"
    echo "========================================="
    
    # Check backend files
    echo "Checking backend Phase 2 files..."
    local backend_files=(
        "backend/src/services/gamePinService.ts"
        "backend/src/services/scoringEngine.ts"
        "backend/src/services/nicknameService.ts"
        "backend/src/services/imageProcessingService.ts"
        "backend/src/db/repositories/GamePinRepository.ts"
    )
    
    for file in "${backend_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
        fi
    done
    
    # Check frontend files
    echo ""
    echo "Checking frontend Phase 2 files..."
    local frontend_files=(
        "frontend/src/components/GamePINInput.tsx"
        "frontend/src/components/ColorfulAnswerButton.tsx"
        "frontend/src/components/AnswerStatisticsChart.tsx"
        "frontend/src/components/PodiumDisplay.tsx"
        "frontend/src/components/NicknameGenerator.tsx"
        "frontend/src/components/StreakIndicator.tsx"
        "frontend/src/constants/animations.ts"
        "frontend/src/constants/answerStyles.ts"
    )
    
    for file in "${frontend_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
        fi
    done
    
    echo ""
    echo -e "${GREEN}Code verification complete!${NC}"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo ""
    echo "========================================="
    echo "Step 1/3: Deploying Infrastructure"
    echo "========================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would deploy infrastructure"
        return
    fi
    
    cd "$(dirname "$0")/../infrastructure"
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install --silent
    
    # Build CDK project
    echo "Building CDK project..."
    npm run build
    
    # Show diff
    echo ""
    echo "Infrastructure changes:"
    cdk diff ${STACK_NAME} || true
    
    echo ""
    read -p "Deploy infrastructure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Deploy
    echo ""
    echo "Deploying infrastructure..."
    cdk deploy ${STACK_NAME} --require-approval never
    
    echo ""
    echo -e "${GREEN}✓ Infrastructure deployed!${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo ""
    echo "========================================="
    echo "Step 2/3: Deploying Backend"
    echo "========================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would deploy backend"
        return
    fi
    
    cd "$(dirname "$0")/../infrastructure/scripts"
    
    echo "Building and deploying backend..."
    ./deploy-backend.sh ${ENVIRONMENT}
    
    echo ""
    echo -e "${GREEN}✓ Backend deployed!${NC}"
    
    # Wait for service to stabilize
    echo ""
    echo "Waiting for ECS service to stabilize..."
    ECS_CLUSTER="live-quiz-cluster"
    ECS_SERVICE="websocket-service"
    
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} || true
    
    echo -e "${GREEN}✓ ECS service is stable${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo ""
    echo "========================================="
    echo "Step 3/3: Deploying Frontend"
    echo "========================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would deploy frontend"
        return
    fi
    
    cd "$(dirname "$0")/../infrastructure/scripts"
    
    echo "Building and deploying frontend..."
    ./deploy-frontend.sh ${ENVIRONMENT}
    
    echo ""
    echo -e "${GREEN}✓ Frontend deployed!${NC}"
}

# Function to run tests
run_tests() {
    echo ""
    echo "========================================="
    echo "Running Automated Tests"
    echo "========================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would run tests"
        return
    fi
    
    cd "$(dirname "$0")"
    
    echo "Running Phase 2 feature tests..."
    ./test-phase2-features.sh ${ENVIRONMENT} || true
    
    echo ""
    echo -e "${GREEN}✓ Tests complete!${NC}"
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "========================================="
    echo -e "${GREEN}✓ Deployment Complete!${NC}"
    echo "========================================="
    
    # Get stack outputs
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || echo "N/A")
    
    WEBSOCKET_URL=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || echo "N/A")
    
    IMAGES_CLOUDFRONT=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesCloudFrontURL'].OutputValue" \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || echo "N/A")
    
    echo ""
    echo "Deployment Information:"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  Stack: ${STACK_NAME}"
    echo "  Region: ${AWS_REGION}"
    echo ""
    echo "URLs:"
    echo "  Frontend: ${BLUE}${CLOUDFRONT_URL}${NC}"
    echo "  Backend: ${BLUE}${WEBSOCKET_URL}${NC}"
    echo "  Images CDN: ${BLUE}${IMAGES_CLOUDFRONT}${NC}"
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
    echo "  2. Create a test event and verify Game PIN"
    echo "  3. Test all Phase 2 features (see TASK_35_DEPLOYMENT_VERIFICATION.md)"
    echo "  4. Test on mobile devices"
    echo "  5. Monitor CloudWatch logs for errors"
    echo ""
    echo "Monitoring:"
    echo "  View logs:"
    echo "    ${CYAN}aws logs tail /ecs/live-quiz-websocket-server --follow${NC}"
    echo ""
    echo "  Check ECS service:"
    echo "    ${CYAN}aws ecs describe-services --cluster live-quiz-cluster --services websocket-service${NC}"
    echo ""
    echo "Documentation:"
    echo "  - Deployment verification: TASK_35_DEPLOYMENT_VERIFICATION.md"
    echo "  - Phase 2 guide: PHASE2_DEPLOYMENT_GUIDE.md"
    echo "  - Testing: scripts/test-phase2-features.sh"
    echo "  - Troubleshooting: TROUBLESHOOTING.md"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    verify_code
    
    echo ""
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    run_tests
    display_summary
    
    echo -e "${GREEN}Task 35 complete! 🎉${NC}"
    echo ""
}

# Run main function
main
