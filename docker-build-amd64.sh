#!/bin/bash

# AMS Docker Build for AMD64 Architecture (Railway Compatible)
# This script builds Docker images specifically for linux/amd64 architecture

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
DOCKERHUB_USERNAME="orperetz"
IMAGE_TAG="latest"
PLATFORM="linux/amd64"

print_status "Building AMS Docker Images for AMD64 Architecture"
echo "=================================================="
echo ""

print_status "Configuration:"
echo "  DockerHub Username: $DOCKERHUB_USERNAME"
echo "  Image Tag: $IMAGE_TAG"
echo "  Platform: $PLATFORM"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if user is logged in to DockerHub
if ! docker info | grep -q "Username"; then
    print_warning "You may need to login to DockerHub:"
    echo "docker login"
    echo ""
fi

# Build Backend Image for AMD64
print_status "Building Backend Docker Image for AMD64..."
BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$IMAGE_TAG"

# Use buildx to build for specific platform
docker buildx build --platform $PLATFORM -f apps/backend/Dockerfile -t "$BACKEND_IMAGE" --push .

print_success "Backend image built and pushed: $BACKEND_IMAGE"

# Build Frontend Image for AMD64
print_status "Building Frontend Docker Image for AMD64..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$IMAGE_TAG"

# Use buildx to build for specific platform
docker buildx build --platform $PLATFORM -f apps/frontend/Dockerfile -t "$FRONTEND_IMAGE" --push .

print_success "Frontend image built and pushed: $FRONTEND_IMAGE"

# Verify the images
print_status "Verifying image architectures..."
echo "Backend image platforms:"
docker manifest inspect "$BACKEND_IMAGE" | grep -A 3 '"platform"'
echo ""
echo "Frontend image platforms:"
docker manifest inspect "$FRONTEND_IMAGE" | grep -A 3 '"platform"'

# Summary
echo ""
print_success "🎉 All images built and pushed successfully for AMD64!"
echo ""
print_status "Docker Images (AMD64 Compatible):"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""
print_status "These images are now compatible with Railway's linux/amd64 architecture."
echo ""
print_status "Next steps:"
echo "1. Deploy backend to Railway using: $BACKEND_IMAGE"
echo "2. Deploy frontend to Railway using: $FRONTEND_IMAGE"
echo "3. Set environment variables in Railway"
echo "4. Test your deployment"
