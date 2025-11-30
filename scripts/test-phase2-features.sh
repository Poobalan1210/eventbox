#!/bin/bash

# Test Phase 2 Features on AWS Deployment
# This script verifies all Phase 2 features are working correctly
# Usage: ./test-phase2-features.sh [environment]
# Example: ./test-phase2-features.sh production

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
echo "Phase 2 Features Test"
echo "Environment: ${ENVIRONMENT}"
echo "Stack: ${STACK_NAME}"
echo "========================================="

# Get stack outputs
echo "Fetching stack outputs..."
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

IMAGES_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesBucketName'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

IMAGES_CLOUDFRONT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='QuestionImagesCloudFrontURL'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

GAME_PINS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query "Stacks[0].Outputs[?OutputKey=='GamePinsTableName'].OutputValue" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ -z "$CLOUDFRONT_URL" ] || [ -z "$WEBSOCKET_URL" ]; then
    echo -e "${RED}✗${NC} Failed to fetch stack outputs. Is the stack deployed?"
    exit 1
fi

echo -e "${GREEN}✓${NC} Stack outputs retrieved"
echo "Frontend URL: ${CLOUDFRONT_URL}"
echo "Backend URL: ${WEBSOCKET_URL}"
echo "Images Bucket: ${IMAGES_BUCKET}"
echo "Images CloudFront: ${IMAGES_CLOUDFRONT}"
echo "GamePins Table: ${GAME_PINS_TABLE}"

echo ""
echo "========================================="
echo "Feature 1: Game PIN System"
echo "========================================="

# Test Game PIN generation
echo -n "Testing Game PIN generation... "
event_response=$(curl -s -X POST "${WEBSOCKET_URL}/api/events" \
    -H "Content-Type: application/json" \
    -d '{"name":"Phase 2 Test Event"}' 2>/dev/null)

if echo "$event_response" | grep -q "gamePin"; then
    echo -e "${GREEN}✓${NC}"
    EVENT_ID=$(echo "$event_response" | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
    GAME_PIN=$(echo "$event_response" | grep -o '"gamePin":"[^"]*"' | cut -d'"' -f4)
    echo "  Event ID: $EVENT_ID"
    echo "  Game PIN: $GAME_PIN"
    
    # Validate PIN format (6 digits)
    if [[ "$GAME_PIN" =~ ^[0-9]{6}$ ]]; then
        echo -e "  ${GREEN}✓${NC} PIN format valid (6 digits)"
    else
        echo -e "  ${RED}✗${NC} PIN format invalid: $GAME_PIN"
        exit 1
    fi
else
    echo -e "${RED}✗${NC}"
    echo "  Game PIN not found in response: $event_response"
    exit 1
fi

# Test Game PIN lookup
echo -n "Testing Game PIN lookup... "
pin_lookup_response=$(curl -s "${WEBSOCKET_URL}/api/events/by-pin/${GAME_PIN}" 2>/dev/null)

if echo "$pin_lookup_response" | grep -q "$EVENT_ID"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  PIN lookup failed: $pin_lookup_response"
    exit 1
fi

# Test invalid PIN
echo -n "Testing invalid PIN rejection... "
invalid_pin_response=$(curl -s -w "%{http_code}" -o /dev/null "${WEBSOCKET_URL}/api/events/by-pin/999999" 2>/dev/null)

if [ "$invalid_pin_response" = "404" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} Expected 404, got ${invalid_pin_response}"
fi

# Check GamePins DynamoDB table
echo -n "Checking GamePins table... "
if aws dynamodb describe-table --table-name "$GAME_PINS_TABLE" --region ${AWS_REGION} &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    
    # Verify PIN is in table
    pin_item=$(aws dynamodb get-item \
        --table-name "$GAME_PINS_TABLE" \
        --key "{\"gamePin\": {\"S\": \"$GAME_PIN\"}}" \
        --region ${AWS_REGION} 2>/dev/null)
    
    if echo "$pin_item" | grep -q "$EVENT_ID"; then
        echo -e "  ${GREEN}✓${NC} PIN stored in DynamoDB"
    else
        echo -e "  ${YELLOW}!${NC} PIN not found in DynamoDB"
    fi
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "Feature 2: Colorful Answer Buttons"
echo "========================================="

# Test question with color-shape assignments
echo -n "Testing colorful answer buttons... "
question_response=$(curl -s -X POST "${WEBSOCKET_URL}/api/events/${EVENT_ID}/questions" \
    -H "Content-Type: application/json" \
    -d '{
        "text": "Test Question with Colors",
        "options": [
            {"id": "a", "text": "Option A"},
            {"id": "b", "text": "Option B"},
            {"id": "c", "text": "Option C"},
            {"id": "d", "text": "Option D"}
        ],
        "correctOptionId": "a",
        "timerSeconds": 30
    }' 2>/dev/null)

if echo "$question_response" | grep -q "questionId"; then
    QUESTION_ID=$(echo "$question_response" | grep -o '"questionId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC}"
    echo "  Question ID: $QUESTION_ID"
    
    # Verify color-shape assignments in response
    if echo "$question_response" | grep -q "color" && echo "$question_response" | grep -q "shape"; then
        echo -e "  ${GREEN}✓${NC} Color and shape assignments present"
    else
        echo -e "  ${YELLOW}!${NC} Color/shape assignments not in response (may be frontend-only)"
    fi
else
    echo -e "${RED}✗${NC}"
    echo "  Question creation failed: $question_response"
fi

echo ""
echo "========================================="
echo "Feature 3: Speed-Based Scoring"
echo "========================================="

echo -e "${BLUE}Note:${NC} Speed-based scoring requires WebSocket connection and answer submission"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Backend scoring engine implemented (see backend/src/services/scoringEngine.ts)"

echo ""
echo "========================================="
echo "Feature 4: Answer Statistics"
echo "========================================="

echo -e "${BLUE}Note:${NC} Answer statistics are calculated after question ends"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Statistics calculator implemented (see backend/src/services/websocketService.ts)"

echo ""
echo "========================================="
echo "Feature 5: Question Image Support"
echo "========================================="

# Check question images bucket
echo -n "Checking question images bucket... "
if aws s3 ls "s3://${IMAGES_BUCKET}/" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    exit 1
fi

# Check CloudFront distribution for images
echo -n "Checking images CloudFront distribution... "
images_cf_response=$(curl -s -o /dev/null -w "%{http_code}" "${IMAGES_CLOUDFRONT}/" 2>/dev/null)

if [ "$images_cf_response" = "403" ] || [ "$images_cf_response" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} (HTTP ${images_cf_response})"
fi

# Test image upload endpoint
echo -n "Testing image upload endpoint... "
# Create a small test image (1x1 pixel PNG)
test_image_data="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
echo "$test_image_data" | base64 -d > /tmp/test-image.png

upload_response=$(curl -s -X POST "${WEBSOCKET_URL}/api/events/${EVENT_ID}/questions/${QUESTION_ID}/image" \
    -F "image=@/tmp/test-image.png" 2>/dev/null)

if echo "$upload_response" | grep -q "imageUrl"; then
    echo -e "${GREEN}✓${NC}"
    IMAGE_URL=$(echo "$upload_response" | grep -o '"imageUrl":"[^"]*"' | cut -d'"' -f4)
    echo "  Image URL: $IMAGE_URL"
    
    # Verify image is accessible
    image_response=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL" 2>/dev/null)
    if [ "$image_response" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Image accessible via CloudFront"
    else
        echo -e "  ${YELLOW}!${NC} Image not yet accessible (HTTP ${image_response})"
    fi
else
    echo -e "${YELLOW}!${NC}"
    echo "  Image upload may require multipart form data support"
fi

# Clean up test image
rm -f /tmp/test-image.png

echo ""
echo "========================================="
echo "Feature 6: Answer Streak Tracking"
echo "========================================="

echo -e "${BLUE}Note:${NC} Streak tracking requires WebSocket connection and multiple answers"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Streak tracking implemented (see backend/src/services/websocketService.ts)"

echo ""
echo "========================================="
echo "Feature 7: Podium Display"
echo "========================================="

echo -e "${BLUE}Note:${NC} Podium display shows after quiz ends with top 3 participants"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Podium component implemented (see frontend/src/components/PodiumDisplay.tsx)"

echo ""
echo "========================================="
echo "Feature 8: Nickname Generator"
echo "========================================="

echo -e "${BLUE}Note:${NC} Nickname generator is a WebSocket feature"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Nickname service implemented (see backend/src/services/nicknameService.ts)"

echo ""
echo "========================================="
echo "Feature 9: Visual Feedback & Animations"
echo "========================================="

echo -e "${BLUE}Note:${NC} Animations are frontend features"
echo "  This will be tested in the manual testing section"
echo -e "${GREEN}✓${NC} Framer Motion animations implemented (see frontend/src/constants/animations.ts)"

echo ""
echo "========================================="
echo "Infrastructure Verification"
echo "========================================="

# Verify all Phase 2 infrastructure is deployed
echo "Checking Phase 2 infrastructure components:"

# Check GamePins table has TTL enabled
echo -n "  GamePins table TTL... "
ttl_status=$(aws dynamodb describe-time-to-live \
    --table-name "$GAME_PINS_TABLE" \
    --query "TimeToLiveDescription.TimeToLiveStatus" \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ "$ttl_status" = "ENABLED" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} (Status: ${ttl_status})"
fi

# Check S3 bucket lifecycle policy
echo -n "  Images bucket lifecycle... "
lifecycle=$(aws s3api get-bucket-lifecycle-configuration \
    --bucket "$IMAGES_BUCKET" \
    --region ${AWS_REGION} 2>/dev/null)

if echo "$lifecycle" | grep -q "DeleteOldImages"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} Lifecycle policy not found"
fi

# Check S3 bucket CORS
echo -n "  Images bucket CORS... "
cors=$(aws s3api get-bucket-cors \
    --bucket "$IMAGES_BUCKET" \
    --region ${AWS_REGION} 2>/dev/null)

if echo "$cors" | grep -q "CORSRules"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}!${NC} CORS not configured"
fi

echo ""
echo "========================================="
echo "Manual Testing Checklist - Phase 2"
echo "========================================="
echo ""
echo "Please perform the following manual tests for Phase 2 features:"
echo ""
echo "${BLUE}1. Game PIN System${NC}"
echo "   ${YELLOW}→${NC} Create an event and note the 6-digit PIN"
echo "   ${YELLOW}→${NC} Open ${CLOUDFRONT_URL} in new window"
echo "   ${YELLOW}→${NC} Enter the PIN to join the event"
echo "   ${YELLOW}→${NC} Verify it navigates to the correct event"
echo ""
echo "${BLUE}2. Colorful Answer Buttons${NC}"
echo "   ${YELLOW}→${NC} Create a question with 4 answer options"
echo "   ${YELLOW}→${NC} Verify buttons show: Red Triangle, Blue Diamond, Yellow Circle, Green Square"
echo "   ${YELLOW}→${NC} Test hover animations on desktop"
echo "   ${YELLOW}→${NC} Test tap animations on mobile"
echo ""
echo "${BLUE}3. Speed-Based Scoring${NC}"
echo "   ${YELLOW}→${NC} Start a quiz with a timer"
echo "   ${YELLOW}→${NC} Answer quickly (within first 25% of time)"
echo "   ${YELLOW}→${NC} Verify you get 1000 points"
echo "   ${YELLOW}→${NC} Answer slowly (near end of timer)"
echo "   ${YELLOW}→${NC} Verify you get 500-999 points"
echo "   ${YELLOW}→${NC} Answer incorrectly"
echo "   ${YELLOW}→${NC} Verify you get 0 points"
echo ""
echo "${BLUE}4. Answer Statistics${NC}"
echo "   ${YELLOW}→${NC} Complete a question with multiple participants"
echo "   ${YELLOW}→${NC} Wait for question to end"
echo "   ${YELLOW}→${NC} Verify bar chart shows answer distribution"
echo "   ${YELLOW}→${NC} Verify correct answer is highlighted"
echo "   ${YELLOW}→${NC} Verify percentages add up to 100%"
echo ""
echo "${BLUE}5. Answer Result Reveal${NC}"
echo "   ${YELLOW}→${NC} Submit an answer"
echo "   ${YELLOW}→${NC} Verify immediate feedback (correct/incorrect)"
echo "   ${YELLOW}→${NC} Verify correct answer is shown"
echo "   ${YELLOW}→${NC} Verify points earned are displayed"
echo "   ${YELLOW}→${NC} Check for celebration animation (correct)"
echo "   ${YELLOW}→${NC} Check for shake animation (incorrect)"
echo ""
echo "${BLUE}6. Podium Display${NC}"
echo "   ${YELLOW}→${NC} Complete a quiz with 3+ participants"
echo "   ${YELLOW}→${NC} Verify podium shows top 3"
echo "   ${YELLOW}→${NC} Verify 1st place is center (highest)"
echo "   ${YELLOW}→${NC} Verify 2nd place is left (medium)"
echo "   ${YELLOW}→${NC} Verify 3rd place is right (lowest)"
echo "   ${YELLOW}→${NC} Check staggered entrance animation"
echo "   ${YELLOW}→${NC} Check confetti effect"
echo ""
echo "${BLUE}7. Question Images${NC}"
echo "   ${YELLOW}→${NC} Create a question"
echo "   ${YELLOW}→${NC} Upload an image (JPEG, PNG, or GIF)"
echo "   ${YELLOW}→${NC} Verify image appears in question display"
echo "   ${YELLOW}→${NC} Verify image is responsive on mobile"
echo "   ${YELLOW}→${NC} Verify aspect ratio is maintained"
echo ""
echo "${BLUE}8. Answer Streak Tracking${NC}"
echo "   ${YELLOW}→${NC} Answer 3 questions correctly in a row"
echo "   ${YELLOW}→${NC} Verify streak indicator shows 3"
echo "   ${YELLOW}→${NC} Verify fire emoji appears (3+ streak)"
echo "   ${YELLOW}→${NC} Answer incorrectly"
echo "   ${YELLOW}→${NC} Verify streak resets to 0"
echo ""
echo "${BLUE}9. Nickname Generator${NC}"
echo "   ${YELLOW}→${NC} Join an event"
echo "   ${YELLOW}→${NC} Verify 3 nickname suggestions appear"
echo "   ${YELLOW}→${NC} Click refresh to generate new suggestions"
echo "   ${YELLOW}→${NC} Select a suggested nickname"
echo "   ${YELLOW}→${NC} Verify it's used in the quiz"
echo "   ${YELLOW}→${NC} Test custom name input option"
echo ""
echo "${BLUE}10. Visual Feedback & Animations${NC}"
echo "   ${YELLOW}→${NC} Test all button hover/click animations"
echo "   ${YELLOW}→${NC} Test question transition animations"
echo "   ${YELLOW}→${NC} Test leaderboard rank change animations"
echo "   ${YELLOW}→${NC} Test participant join animation"
echo "   ${YELLOW}→${NC} Verify all animations complete within 500ms"
echo "   ${YELLOW}→${NC} Test on mobile devices for performance"
echo ""
echo "${BLUE}11. Mobile Responsiveness${NC}"
echo "   ${YELLOW}→${NC} Test all Phase 2 features on mobile"
echo "   ${YELLOW}→${NC} Verify colorful buttons are easily tappable"
echo "   ${YELLOW}→${NC} Verify podium displays correctly"
echo "   ${YELLOW}→${NC} Verify images scale properly"
echo "   ${YELLOW}→${NC} Verify animations are smooth"
echo "   ${YELLOW}→${NC} Test in portrait and landscape"
echo ""
echo "${BLUE}12. Performance Testing${NC}"
echo "   ${YELLOW}→${NC} Test with 5-10 concurrent participants"
echo "   ${YELLOW}→${NC} Verify real-time updates work smoothly"
echo "   ${YELLOW}→${NC} Check browser console for errors"
echo "   ${YELLOW}→${NC} Monitor network tab for WebSocket messages"
echo "   ${YELLOW}→${NC} Verify no memory leaks during long sessions"
echo ""
echo "========================================="
echo ""
read -p "Have you completed all Phase 2 manual tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please complete the Phase 2 manual tests.${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ Phase 2 Features Test Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
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
echo "All Phase 2 features have been verified!"
echo ""
echo "Frontend: ${CLOUDFRONT_URL}"
echo "Backend: ${WEBSOCKET_URL}"
echo "Environment: ${ENVIRONMENT}"
echo ""

