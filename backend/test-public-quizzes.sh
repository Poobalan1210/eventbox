#!/bin/bash

# Test script for public quiz discovery endpoint
# Usage: ./test-public-quizzes.sh

set -e

echo "🧪 Testing Public Quiz Discovery Endpoint"
echo "=========================================="
echo ""

# Set API base URL
export API_BASE_URL=${API_BASE_URL:-http://localhost:3001}

echo "API Base URL: $API_BASE_URL"
echo ""

# Run the TypeScript test file
cd "$(dirname "$0")"
npx tsx test-public-quizzes.ts
