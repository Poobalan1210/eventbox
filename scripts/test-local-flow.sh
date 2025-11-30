#!/bin/bash

# Test Complete Local Flow
# This script tests the entire quiz flow locally before deployment
# Usage: ./test-local-flow.sh

set -e

echo "========================================="
echo "Live Quiz Event - Local Flow Test"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
check_service() {
    local service=$1
    local port=$2
    local name=$3
    
    if curl -s "http://localhost:${port}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} ${name} is running on port ${port}"
        return 0
    else
        echo -e "${RED}✗${NC} ${name} is NOT running on port ${port}"
        return 1
    fi
}

# Test API endpoint
test_api() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4
    
    echo -n "Testing ${description}... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "http://localhost:3001${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    else
        response=$(curl -s "http://localhost:3001${endpoint}")
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
        echo "$response"
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

echo ""
echo "Step 1: Checking Prerequisites"
echo "========================================="

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    exit 1
fi

# Check if Docker is running
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
else
    echo -e "${RED}✗${NC} Docker daemon is not running"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed ($(node --version))"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    exit 1
fi

echo ""
echo "Step 2: Checking Running Services"
echo "========================================="

# Check DynamoDB
if docker ps | grep -q "live-quiz-dynamodb"; then
    echo -e "${GREEN}✓${NC} DynamoDB Local is running"
else
    echo -e "${YELLOW}!${NC} DynamoDB Local is not running"
    echo "Starting DynamoDB..."
    npm run db:start
fi

# Check Backend
BACKEND_RUNNING=false
if check_service "localhost" "3001" "Backend API"; then
    BACKEND_RUNNING=true
fi

# Check Frontend
FRONTEND_RUNNING=false
if check_service "localhost" "5173" "Frontend Dev Server"; then
    FRONTEND_RUNNING=true
fi

if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo ""
    echo -e "${YELLOW}Warning:${NC} Not all services are running."
    echo "Please run 'npm run dev' in a separate terminal to start all services."
    echo ""
    read -p "Press Enter when services are running, or Ctrl+C to exit..."
fi

echo ""
echo "Step 3: Testing Backend API"
echo "========================================="

# Test health endpoint
echo -n "Testing health endpoint... "
health_response=$(curl -s http://localhost:3001/health)
if echo "$health_response" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Health check failed: $health_response"
    exit 1
fi

# Test event creation
echo -n "Testing event creation... "
event_response=$(curl -s -X POST http://localhost:3001/api/events \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Event"}')

if echo "$event_response" | grep -q "eventId"; then
    echo -e "${GREEN}✓${NC}"
    EVENT_ID=$(echo "$event_response" | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
    echo "Created event: $EVENT_ID"
else
    echo -e "${RED}✗${NC}"
    echo "Event creation failed: $event_response"
    exit 1
fi

# Test question creation
echo -n "Testing question creation... "
question_response=$(curl -s -X POST "http://localhost:3001/api/events/${EVENT_ID}/questions" \
    -H "Content-Type: application/json" \
    -d '{
        "text": "What is 2+2?",
        "options": [
            {"id": "a", "text": "3"},
            {"id": "b", "text": "4"},
            {"id": "c", "text": "5"}
        ],
        "correctOptionId": "b",
        "timerSeconds": 30
    }')

if echo "$question_response" | grep -q "questionId"; then
    echo -e "${GREEN}✓${NC}"
    QUESTION_ID=$(echo "$question_response" | grep -o '"questionId":"[^"]*"' | cut -d'"' -f4)
    echo "Created question: $QUESTION_ID"
else
    echo -e "${RED}✗${NC}"
    echo "Question creation failed: $question_response"
    exit 1
fi

# Test event retrieval
echo -n "Testing event retrieval... "
get_event_response=$(curl -s "http://localhost:3001/api/events/${EVENT_ID}")

if echo "$get_event_response" | grep -q "$EVENT_ID"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Event retrieval failed: $get_event_response"
    exit 1
fi

echo ""
echo "Step 4: Testing DynamoDB Tables"
echo "========================================="

# Check if tables exist
tables=("LiveQuizEvents" "LiveQuizQuestions" "LiveQuizParticipants" "LiveQuizAnswers")
for table in "${tables[@]}"; do
    echo -n "Checking table ${table}... "
    if aws dynamodb describe-table --table-name "$table" --endpoint-url http://localhost:8000 --region us-east-1 &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo "Table $table does not exist. Run 'npm run setup:local-db'"
        exit 1
    fi
done

echo ""
echo "Step 5: Manual Testing Checklist"
echo "========================================="
echo ""
echo "Please perform the following manual tests:"
echo ""
echo "1. Open http://localhost:5173 in your browser"
echo "   ${YELLOW}→${NC} Verify the home page loads"
echo ""
echo "2. Click 'Create Event'"
echo "   ${YELLOW}→${NC} Fill in event name: 'Integration Test'"
echo "   ${YELLOW}→${NC} Add 2-3 questions with multiple choice answers"
echo "   ${YELLOW}→${NC} Set timer for each question (e.g., 30 seconds)"
echo "   ${YELLOW}→${NC} Click 'Create Event'"
echo ""
echo "3. Copy the join link or scan QR code"
echo "   ${YELLOW}→${NC} Open join link in a new browser window/tab"
echo "   ${YELLOW}→${NC} Enter participant name: 'Test Participant 1'"
echo "   ${YELLOW}→${NC} Verify waiting screen appears"
echo ""
echo "4. Open another participant window"
echo "   ${YELLOW}→${NC} Join with name: 'Test Participant 2'"
echo ""
echo "5. In organizer dashboard:"
echo "   ${YELLOW}→${NC} Verify both participants appear in the list"
echo "   ${YELLOW}→${NC} Click 'Start Quiz'"
echo "   ${YELLOW}→${NC} Verify quiz starts for all participants"
echo ""
echo "6. In participant windows:"
echo "   ${YELLOW}→${NC} Verify question appears"
echo "   ${YELLOW}→${NC} Verify timer counts down"
echo "   ${YELLOW}→${NC} Select an answer and submit"
echo "   ${YELLOW}→${NC} Verify submission confirmation"
echo ""
echo "7. In organizer dashboard:"
echo "   ${YELLOW}→${NC} Click 'Next Question'"
echo "   ${YELLOW}→${NC} Verify leaderboard appears"
echo "   ${YELLOW}→${NC} Verify correct ranking"
echo ""
echo "8. Repeat for all questions"
echo ""
echo "9. After last question:"
echo "   ${YELLOW}→${NC} Click 'End Quiz'"
echo "   ${YELLOW}→${NC} Verify final leaderboard appears"
echo "   ${YELLOW}→${NC} Verify correct final rankings"
echo ""
echo "10. Test mobile responsiveness:"
echo "   ${YELLOW}→${NC} Open browser DevTools (F12)"
echo "   ${YELLOW}→${NC} Toggle device toolbar (Ctrl+Shift+M)"
echo "   ${YELLOW}→${NC} Test on iPhone SE (375px)"
echo "   ${YELLOW}→${NC} Test on iPad (768px)"
echo "   ${YELLOW}→${NC} Verify all elements are readable and clickable"
echo "   ${YELLOW}→${NC} Verify no horizontal scrolling"
echo ""
echo "========================================="
echo ""
read -p "Have you completed all manual tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please complete the manual tests before proceeding.${NC}"
    exit 1
fi

echo ""
echo "Step 6: Testing WebSocket Connection"
echo "========================================="
echo ""
echo "WebSocket testing requires manual verification:"
echo "1. Open browser DevTools → Network tab"
echo "2. Filter by 'WS' (WebSocket)"
echo "3. Join an event as a participant"
echo "4. Verify WebSocket connection is established"
echo "5. Start quiz and verify real-time messages"
echo ""
read -p "Is WebSocket connection working? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}WebSocket connection issue detected.${NC}"
    echo "Check backend logs for errors."
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ All Local Tests Passed!${NC}"
echo "========================================="
echo ""
echo "Your application is ready for deployment to AWS."
echo ""
echo "Next steps:"
echo "1. Review deployment checklist: infrastructure/DEPLOYMENT_CHECKLIST.md"
echo "2. Deploy to AWS: npm run deploy:all production"
echo "3. Run this script again against AWS deployment"
echo ""
