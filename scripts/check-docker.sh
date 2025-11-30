#!/bin/bash

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo ""
    echo "On macOS:"
    echo "  1. Open Docker Desktop from Applications"
    echo "  2. Wait for Docker to start (whale icon in menu bar)"
    echo "  3. Run this command again"
    exit 1
fi

echo "✅ Docker is running"
exit 0
