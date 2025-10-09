#!/bin/bash

# Clean Multi-Architecture Docker Build for Railway
# This script ensures a completely clean build

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
BACK_IMAGE_TAG="railway-clean"
FRONT_IMAGE_TAG="clean"

print_status "Starting Clean Multi-Architecture Docker Build"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Clean up any existing builders
print_status "Cleaning up existing builders..."
docker buildx ls | grep multiarch-builder && docker buildx rm multiarch-builder || echo "No existing builder found"

# Clean Docker cache
print_status "Cleaning Docker build cache..."
docker builder prune -f

# Create a new builder instance
print_status "Creating new multi-architecture builder..."
docker buildx create --name multiarch-builder --use --bootstrap

# Build Backend Image for Multiple Architectures
print_status "Building Backend Multi-Architecture Image..."
BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG"

# Build with no cache to ensure clean build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/backend/Dockerfile.railway-final \
  -t "$BACKEND_IMAGE" \
  --no-cache \
  --push \
  .

print_success "Backend multi-arch image built and pushed: $BACKEND_IMAGE"

# Build Frontend Image for Multiple Architectures
print_status "Building Frontend Multi-Architecture Image..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$FRONT_IMAGE_TAG"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/frontend/Dockerfile \
  -t "$FRONTEND_IMAGE" \
  --no-cache \
  --push \
  .

print_success "Frontend multi-arch image built and pushed: $FRONTEND_IMAGE"

# Verify the images
print_status "Verifying multi-architecture images..."
echo "Backend image platforms:"
docker buildx imagetools inspect "$BACKEND_IMAGE"
echo ""
echo "Frontend image platforms:"
docker buildx imagetools inspect "$FRONTEND_IMAGE"

# Clean up
print_status "Cleaning up builder..."
docker buildx rm multiarch-builder

# Summary
echo ""
print_success "🎉 Clean multi-architecture images built and pushed successfully!"
echo ""
print_status "Docker Images (Multi-Architecture):"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""
print_status "Use these image names in Railway:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
