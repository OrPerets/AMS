#!/bin/bash

# Build Multi-Architecture Docker Images for Railway
# This script creates proper multi-arch images that Railway can use

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
IMAGE_TAG="railway"

print_status "Building Multi-Architecture Docker Images for Railway"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create a new builder instance for multi-arch
print_status "Setting up multi-architecture builder..."
docker buildx create --name multiarch-builder --use --bootstrap

# Build Backend Image for Multiple Architectures
print_status "Building Backend Multi-Architecture Image..."
BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$IMAGE_TAG"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/backend/Dockerfile \
  -t "$BACKEND_IMAGE" \
  --push \
  .

print_success "Backend multi-arch image built and pushed: $BACKEND_IMAGE"

# Build Frontend Image for Multiple Architectures
print_status "Building Frontend Multi-Architecture Image..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$IMAGE_TAG"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/frontend/Dockerfile \
  -t "$FRONTEND_IMAGE" \
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
print_success "🎉 Multi-architecture images built and pushed successfully!"
echo ""
print_status "Docker Images (Multi-Architecture):"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""
print_status "These images now support both linux/amd64 and linux/arm64 architectures."
echo ""
print_status "Use these image names in Railway:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
