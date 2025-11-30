#!/bin/bash

# Test script for raffle activity API endpoints
# Usage: ./test-raffle-endpoints.sh

API_URL="${API_URL:-http://localhost:3001}"

echo "🎯 Testing Raffle Activity API Endpoints"
echo "API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Create an event
echo -e "${BLUE}1️⃣  Creating event...${NC}"
CREATE_EVENT_RESPONSE=$(curl -s -X POST "$API_URL/api/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raffle Test Event",
    "organizerId": "test-organizer-'$(date +%s)'",
    "visibility": "private"
  }')

EVENT_ID=$(echo $CREATE_EVENT_RESPONSE | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
GAME_PIN=$(echo $CREATE_EVENT_RESPONSE | grep -o '"gamePin":"[^"]*"' | cut -d'"' -f4)

if [ -z "$EVENT_ID" ]; then
  echo -e "${RED}❌ Failed to create event${NC}"
  echo $CREATE_EVENT_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Event created: $EVENT_ID${NC}"
echo "   Game PIN: $GAME_PIN"
echo ""

# Step 2: Create a raffle activity
echo -e "${BLUE}2️⃣  Creating raffle activity...${NC}"
CREATE_ACTIVITY_RESPONSE=$(curl -s -X POST "$API_URL/api/events/$EVENT_ID/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grand Prize Raffle",
    "type": "raffle"
  }')

ACTIVITY_ID=$(echo $CREATE_ACTIVITY_RESPONSE | grep -o '"activityId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACTIVITY_ID" ]; then
  echo -e "${RED}❌ Failed to create activity${NC}"
  echo $CREATE_ACTIVITY_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Raffle activity created: $ACTIVITY_ID${NC}"
echo ""

# Step 3: Configure the raffle
echo -e "${BLUE}3️⃣  Configuring raffle...${NC}"
CONFIGURE_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/configure-raffle" \
  -H "Content-Type: application/json" \
  -d '{
    "prizeDescription": "iPad Pro 12.9-inch with Apple Pencil",
    "entryMethod": "manual",
    "winnerCount": 3
  }')

if echo $CONFIGURE_RESPONSE | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Raffle configured${NC}"
  echo "   Prize: iPad Pro 12.9-inch with Apple Pencil"
  echo "   Entry Method: manual"
  echo "   Winner Count: 3"
else
  echo -e "${RED}❌ Failed to configure raffle${NC}"
  echo $CONFIGURE_RESPONSE
  exit 1
fi
echo ""

# Step 4: Start the raffle
echo -e "${BLUE}4️⃣  Starting raffle...${NC}"
START_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/start-raffle")

if echo $START_RESPONSE | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Raffle started${NC}"
else
  echo -e "${RED}❌ Failed to start raffle${NC}"
  echo $START_RESPONSE
  exit 1
fi
echo ""

# Step 5: Add entries
echo -e "${BLUE}5️⃣  Adding raffle entries...${NC}"
PARTICIPANTS=("Alice Johnson" "Bob Smith" "Charlie Brown" "Diana Prince" "Eve Wilson" "Frank Miller" "Grace Lee" "Henry Davis")

for i in "${!PARTICIPANTS[@]}"; do
  PARTICIPANT_ID="p$((i+1))"
  PARTICIPANT_NAME="${PARTICIPANTS[$i]}"
  
  ENTER_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/enter" \
    -H "Content-Type: application/json" \
    -d "{
      \"participantId\": \"$PARTICIPANT_ID\",
      \"participantName\": \"$PARTICIPANT_NAME\"
    }")
  
  if echo $ENTER_RESPONSE | grep -q '"success":true'; then
    echo -e "${GREEN}✅ $PARTICIPANT_NAME entered the raffle${NC}"
  else
    echo -e "${RED}❌ Failed to enter $PARTICIPANT_NAME${NC}"
  fi
done
echo ""

# Step 6: Test duplicate entry
echo -e "${BLUE}6️⃣  Testing duplicate entry prevention...${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/enter" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "p1",
    "participantName": "Alice Johnson"
  }')

if echo $DUPLICATE_RESPONSE | grep -q '"error"'; then
  echo -e "${GREEN}✅ Duplicate entry correctly rejected${NC}"
else
  echo -e "${RED}❌ Duplicate entry should have been rejected${NC}"
fi
echo ""

# Step 7: Draw winners
echo -e "${BLUE}7️⃣  Drawing winners...${NC}"
DRAW_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/draw-winners" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3
  }')

if echo $DRAW_RESPONSE | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Winners drawn${NC}"
  echo "$DRAW_RESPONSE" | grep -o '"participantName":"[^"]*"' | cut -d'"' -f4 | nl
else
  echo -e "${RED}❌ Failed to draw winners${NC}"
  echo $DRAW_RESPONSE
  exit 1
fi
echo ""

# Step 8: End the raffle
echo -e "${BLUE}8️⃣  Ending raffle...${NC}"
END_RESPONSE=$(curl -s -X POST "$API_URL/api/activities/$ACTIVITY_ID/end-raffle")

if echo $END_RESPONSE | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Raffle ended${NC}"
  echo "   Final Results:"
  TOTAL_ENTRIES=$(echo $END_RESPONSE | grep -o '"totalEntries":[0-9]*' | cut -d':' -f2)
  WINNER_COUNT=$(echo $END_RESPONSE | grep -o '"winnerCount":[0-9]*' | cut -d':' -f2)
  echo "   - Total Entries: $TOTAL_ENTRIES"
  echo "   - Winner Count: $WINNER_COUNT"
  echo "   - Winners:"
  echo "$END_RESPONSE" | grep -o '"participantName":"[^"]*"' | cut -d'"' -f4 | nl
else
  echo -e "${RED}❌ Failed to end raffle${NC}"
  echo $END_RESPONSE
  exit 1
fi
echo ""

echo -e "${GREEN}🎉 All raffle endpoint tests completed successfully!${NC}"
