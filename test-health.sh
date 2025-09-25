#!/bin/bash

# Test backend health endpoint locally

echo "Testing backend health endpoint..."

# Start backend in background
cd apps/backend
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:3000/health || echo "Health check failed"

# Clean up
kill $BACKEND_PID
echo "Backend stopped"
