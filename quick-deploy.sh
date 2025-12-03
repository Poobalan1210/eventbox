#!/bin/bash

echo "🔍 Checking Docker status..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again:"
    echo "1. Open Docker Desktop application"
    echo "2. Wait for it to start (you'll see the whale icon in your menu bar)"
    echo "3. Run this script again: ./quick-deploy.sh"
    echo ""
    exit 1
fi

echo "✅ Docker is running!"
echo ""

# Run the deployment
./deploy-backend.sh
