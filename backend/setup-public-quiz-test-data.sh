#!/bin/bash

# Setup test data for public quiz discovery testing
# Creates several public quizzes with different statuses

set -e

API_BASE_URL=${API_BASE_URL:-http://localhost:3001}

echo "🔧 Setting up test data for public quiz discovery"
echo "=================================================="
echo ""

# Function to create a quiz
create_quiz() {
  local name=$1
  local status=$2
  local visibility=$3
  
  echo "Creating: $name..."
  
  # Create event
  EVENT_ID=$(curl -s -X POST "$API_BASE_URL/api/events" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\"}" | jq -r '.eventId')
  
  if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ]; then
    echo "❌ Failed to create event: $name"
    return 1
  fi
  
  # Update visibility
  curl -s -X PATCH "$API_BASE_URL/api/events/$EVENT_ID/visibility" \
    -H "Content-Type: application/json" \
    -d "{\"visibility\":\"$visibility\"}" > /dev/null
  
  # Update status
  curl -s -X PATCH "$API_BASE_URL/api/events/$EVENT_ID/status" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"$status\"}" > /dev/null
  
  echo "✅ Created: $name ($status, $visibility) - ID: $EVENT_ID"
}

# Create test quizzes
create_quiz "Live Math Quiz" "live" "public"
create_quiz "Live Science Quiz" "live" "public"
create_quiz "Upcoming History Quiz" "setup" "public"
create_quiz "Upcoming Geography Quiz" "draft" "public"
create_quiz "Private Math Quiz" "live" "private"
create_quiz "Completed Quiz" "completed" "public"

echo ""
echo "✅ Test data setup complete!"
echo ""
echo "You can now test the public quiz discovery endpoint:"
echo "  curl http://localhost:3001/api/events/public | jq '.'"
