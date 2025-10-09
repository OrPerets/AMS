#!/bin/bash

# Ubuntu-Only Multi-Architecture Docker Build for Railway
# This script uses Ubuntu base for both architectures to avoid Prisma issues

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
BACK_IMAGE_TAG="railway-ubuntu"
FRONT_IMAGE_TAG="ubuntu"

print_status "Starting Ubuntu-Only Multi-Architecture Docker Build"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Clean up existing builders
print_status "Cleaning up existing builders..."
docker buildx rm multiarch-builder 2>/dev/null || true

# Create new multi-architecture builder
print_status "Creating new multi-architecture builder..."
docker buildx create --name multiarch-builder --use

# Get current Git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD)
if [ -z "$GIT_COMMIT" ]; then
    print_warning "Could not get Git commit hash. Using 'latest' for image tags."
    GIT_COMMIT="latest"
fi

BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG-$GIT_COMMIT"
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$FRONT_IMAGE_TAG-$GIT_COMMIT"

print_status "Backend Image: $BACKEND_IMAGE"
print_status "Frontend Image: $FRONTEND_IMAGE"
echo ""

# Build Backend Image (using Ubuntu for both architectures)
print_status "Building backend image with Ubuntu base for both architectures..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/backend/Dockerfile.railway-simple \
  -t "$BACKEND_IMAGE" \
  --no-cache \
  --push \
  .
print_success "Backend image built and pushed: $BACKEND_IMAGE"
echo ""

# Build Frontend Image
print_status "Building frontend image..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f apps/frontend/Dockerfile.railway \
  -t "$FRONTEND_IMAGE" \
  --no-cache \
  --push \
  .
print_success "Frontend image built and pushed: $FRONTEND_IMAGE"
echo ""

print_success "Ubuntu-only multi-architecture build and push complete!"
echo "You can now deploy these images to Railway."
echo ""
echo "Backend Image: $BACKEND_IMAGE"
echo "Frontend Image: $FRONTEND_IMAGE"
