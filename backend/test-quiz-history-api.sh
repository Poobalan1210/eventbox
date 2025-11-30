#!/bin/bash

# Test script for Quiz History and Status Management API endpoints
# Make sure the backend server is running before executing this script

BASE_URL="http://localhost:3001/api"
ORGANIZER_ID="test-organizer-123"

echo "Testing Quiz History and Status Management API Endpoints"
echo "=========================================================="
echo ""

# Test 1: Get all quizzes for organizer
echo "1. GET /api/events/organizer/:organizerId"
echo "   Getting all quizzes for organizer..."
curl -s -X GET "${BASE_URL}/events/organizer/${ORGANIZER_ID}" | jq '.'
echo ""

# Test 2: Update event status
echo "2. PATCH /api/events/:eventId/status"
echo "   Updating event status to 'live'..."
curl -s -X PATCH "${BASE_URL}/events/event-draft-1/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "live"}' | jq '.'
echo ""

# Test 3: Update event visibility
echo "3. PATCH /api/events/:eventId/visibility"
echo "   Updating event visibility to 'public'..."
curl -s -X PATCH "${BASE_URL}/events/event-setup-1/visibility" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "public"}' | jq '.'
echo ""

# Test 4: Verify updates by getting organizer quizzes again
echo "4. Verifying updates..."
echo "   Getting all quizzes for organizer again..."
curl -s -X GET "${BASE_URL}/events/organizer/${ORGANIZER_ID}" | jq '.'
echo ""

# Test 5: Try to update visibility of a live quiz (should fail)
echo "5. Testing validation - trying to update visibility of live quiz..."
curl -s -X PATCH "${BASE_URL}/events/event-live-1/visibility" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "private"}' | jq '.'
echo ""

# Test 6: Try invalid status (should fail)
echo "6. Testing validation - trying to set invalid status..."
curl -s -X PATCH "${BASE_URL}/events/event-draft-1/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid"}' | jq '.'
echo ""

echo "=========================================================="
echo "API endpoint tests completed!"
