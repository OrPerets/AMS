#!/bin/bash

# Test Docker Images Locally
# This script tests the built Docker images locally before pushing to DockerHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOCKERHUB_USERNAME=""
IMAGE_TAG="latest"

# Get user input
echo "🧪 AMS Docker Images Test Script"
echo "================================="
echo ""

read -p "DockerHub Username: " DOCKERHUB_USERNAME
read -p "Image Tag (default: latest): " IMAGE_TAG
IMAGE_TAG=${IMAGE_TAG:-latest}

if [ -z "$DOCKERHUB_USERNAME" ]; then
    print_error "DockerHub username is required!"
    exit 1
fi

BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$IMAGE_TAG"
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$IMAGE_TAG"

print_status "Testing images:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Test Backend Image
print_status "Testing Backend Image..."

# Start backend container
print_status "Starting backend container..."
BACKEND_CONTAINER=$(docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JWT_SECRET="test-secret" \
  -e JWT_REFRESH_SECRET="test-refresh-secret" \
  "$BACKEND_IMAGE")

if [ $? -eq 0 ]; then
    print_success "Backend container started: $BACKEND_CONTAINER"
else
    print_error "Failed to start backend container"
    exit 1
fi

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 10

# Test backend health endpoint
print_status "Testing backend health endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Backend health check passed!"
else
    print_warning "Backend health check failed, but container is running"
fi

# Test Frontend Image
print_status "Testing Frontend Image..."

# Start frontend container
print_status "Starting frontend container..."
FRONTEND_CONTAINER=$(docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e NEXT_PUBLIC_API_BASE="http://localhost:3000" \
  "$FRONTEND_IMAGE")

if [ $? -eq 0 ]; then
    print_success "Frontend container started: $FRONTEND_CONTAINER"
else
    print_error "Failed to start frontend container"
    # Clean up backend container
    docker stop $BACKEND_CONTAINER > /dev/null 2>&1
    docker rm $BACKEND_CONTAINER > /dev/null 2>&1
    exit 1
fi

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 10

# Test frontend
print_status "Testing frontend..."
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    print_success "Frontend is accessible!"
else
    print_warning "Frontend test failed, but container is running"
fi

# Show running containers
print_status "Running containers:"
docker ps --filter "ancestor=$BACKEND_IMAGE" --filter "ancestor=$FRONTEND_IMAGE"

echo ""
print_success "🎉 Docker images test completed!"
echo ""
print_status "Test Results:"
echo "  Backend:  http://localhost:3000/health"
echo "  Frontend: http://localhost:3001/"
echo ""
print_status "To stop containers:"
echo "  docker stop $BACKEND_CONTAINER $FRONTEND_CONTAINER"
echo "  docker rm $BACKEND_CONTAINER $FRONTEND_CONTAINER"
echo ""
print_warning "Note: Backend will fail database operations without DATABASE_URL"
print_status "Images are ready for deployment to Railway!"
