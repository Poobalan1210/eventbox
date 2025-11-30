#!/bin/bash

# Deploy Organizer UX Improvements
# This script deploys the organizer UX features including database migration
# Usage: ./deploy-organizer-ux.sh [environment]
# Example: ./deploy-organizer-ux.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get environment from argument (default: production)
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be one of: development, staging, production${NC}"
    exit 1
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Deploying Organizer UX Improvements${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}=========================================${NC}"

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="LiveQuizEventStack-${ENVIRONMENT}"

# Use production stack name if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="LiveQuizEventStack"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify required tools
echo -e "\n${YELLOW}Verifying required tools...${NC}"
if ! command_exists aws; then
    echo -e "${RED}Error: AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Error: Node.js not found. Please install it first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Error: npm not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required tools found${NC}"

# Verify AWS credentials
echo -e "\n${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}Error: AWS credentials not configured or invalid${NC}"
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials verified${NC}"

# Step 0: Pre-deployment checks
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 0: Pre-deployment Checks${NC}"
echo -e "${BLUE}=========================================${NC}"

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
cd backend
if npm run test -- --run; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed. Aborting deployment.${NC}"
    exit 1
fi
cd ..

# Step 1: Create Database Backup
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 1: Creating Database Backup${NC}"
echo -e "${BLUE}=========================================${NC}"

BACKUP_NAME="pre-organizer-ux-deployment-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}Creating backup: ${BACKUP_NAME}${NC}"

aws dynamodb create-backup \
    --table-name live-quiz-events \
    --backup-name "${BACKUP_NAME}" \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ Database backup created${NC}"

# Step 2: Deploy Backend
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 2: Deploying Backend${NC}"
echo -e "${BLUE}=========================================${NC}"

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Backend built${NC}"

# Build and push Docker image
echo -e "${YELLOW}Building and pushing Docker image...${NC}"
cd infrastructure
./scripts/build-and-push.sh backend
echo -e "${GREEN}✓ Docker image pushed${NC}"

# Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure...${NC}"
npm run build
cdk deploy ${STACK_NAME} --require-approval never
echo -e "${GREEN}✓ Infrastructure deployed${NC}"

# Update ECS service
echo -e "${YELLOW}Updating ECS service...${NC}"
./scripts/update-ecs-service.sh
echo -e "${GREEN}✓ ECS service updated${NC}"

cd ..

# Wait for backend to be healthy
echo -e "${YELLOW}Waiting for backend to be healthy...${NC}"
BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='WebSocketALBURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "${BACKEND_URL}/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}Waiting for backend... (${RETRY_COUNT}/${MAX_RETRIES})${NC}"
    sleep 10
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Backend health check failed${NC}"
    exit 1
fi

# Step 3: Run Database Migration
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 3: Running Database Migration${NC}"
echo -e "${BLUE}=========================================${NC}"

# Dry run first
echo -e "${YELLOW}Running migration dry run...${NC}"
cd scripts
if DRY_RUN=true ts-node migrate-events.ts; then
    echo -e "${GREEN}✓ Dry run successful${NC}"
else
    echo -e "${RED}✗ Dry run failed. Aborting deployment.${NC}"
    exit 1
fi

# Confirm before actual migration
echo -e "\n${YELLOW}Ready to run actual migration. Continue? (yes/no)${NC}"
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Migration cancelled. Deployment aborted.${NC}"
    exit 1
fi

# Run actual migration
echo -e "${YELLOW}Running migration...${NC}"
if ts-node migrate-events.ts; then
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    echo -e "${YELLOW}Attempting rollback...${NC}"
    ts-node rollback-migration.ts
    exit 1
fi

# Verify migration
echo -e "${YELLOW}Verifying migration...${NC}"
if ts-node test-migration.ts; then
    echo -e "${GREEN}✓ Migration verified${NC}"
else
    echo -e "${RED}✗ Migration verification failed${NC}"
    echo -e "${YELLOW}Consider running rollback: ts-node rollback-migration.ts${NC}"
    exit 1
fi

cd ..

# Step 4: Deploy Frontend
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 4: Deploying Frontend${NC}"
echo -e "${BLUE}=========================================${NC}"

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"

# Deploy to S3 and invalidate CloudFront
echo -e "${YELLOW}Deploying to S3...${NC}"
cd infrastructure
./scripts/deploy-frontend.sh ${ENVIRONMENT}
echo -e "${GREEN}✓ Frontend deployed${NC}"
cd ..

# Step 5: Enable Feature Flags
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 5: Enabling Feature Flags${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Enabling organizer UX features...${NC}"
aws ssm put-parameter \
    --name /app/features/organizer-ux \
    --value "enabled" \
    --overwrite \
    --region ${AWS_REGION} >/dev/null 2>&1 || true

aws ssm put-parameter \
    --name /app/features/templates \
    --value "enabled" \
    --overwrite \
    --region ${AWS_REGION} >/dev/null 2>&1 || true

aws ssm put-parameter \
    --name /app/features/public-browser \
    --value "enabled" \
    --overwrite \
    --region ${AWS_REGION} >/dev/null 2>&1 || true

echo -e "${GREEN}✓ Feature flags enabled${NC}"

# Step 6: Verification
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Step 6: Running Verification Tests${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Testing API endpoints...${NC}"

# Test organizer quizzes endpoint
if curl -sf "${BACKEND_URL}/api/events/organizer/test" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Organizer quizzes endpoint working${NC}"
else
    echo -e "${YELLOW}⚠ Organizer quizzes endpoint test inconclusive${NC}"
fi

# Test public quizzes endpoint
if curl -sf "${BACKEND_URL}/api/events/public" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Public quizzes endpoint working${NC}"
else
    echo -e "${YELLOW}⚠ Public quizzes endpoint test inconclusive${NC}"
fi

# Test templates endpoint
if curl -sf "${BACKEND_URL}/api/templates/public" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Templates endpoint working${NC}"
else
    echo -e "${YELLOW}⚠ Templates endpoint test inconclusive${NC}"
fi

# Get deployment URLs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION})

# Final Summary
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e ""
echo -e "${BLUE}Frontend URL:${NC} ${CLOUDFRONT_URL}"
echo -e "${BLUE}Backend URL:${NC} ${BACKEND_URL}"
echo -e "${BLUE}Database Backup:${NC} ${BACKUP_NAME}"
echo -e ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Test the new features in the UI"
echo -e "2. Monitor CloudWatch logs for errors"
echo -e "3. Check CloudWatch metrics for performance"
echo -e "4. Notify users about new features"
echo -e "5. Monitor user feedback"
echo -e ""
echo -e "${YELLOW}Rollback Instructions:${NC}"
echo -e "If issues occur, run: ${BLUE}cd scripts && ts-node rollback-migration.ts${NC}"
echo -e ""
echo -e "${GREEN}Happy Quizzing! 🎉${NC}"
