#!/bin/bash

# Separate Architecture Docker Build for Railway
# This script builds each architecture separately to avoid Prisma issues

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
BACK_IMAGE_TAG="railway-separate"
FRONT_IMAGE_TAG="separate"

print_status "Starting Separate Architecture Docker Build"
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

# Create a new builder instance
print_status "Creating new multi-architecture builder..."
docker buildx create --name multiarch-builder --use --bootstrap

# Build Backend Image for ARM64 only (this works)
print_status "Building Backend ARM64 Image..."
BACKEND_ARM64_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG-arm64"

docker buildx build \
  --platform linux/arm64 \
  -f apps/backend/Dockerfile.railway-simple \
  -t "$BACKEND_ARM64_IMAGE" \
  --push \
  .

print_success "Backend ARM64 image built and pushed: $BACKEND_ARM64_IMAGE"

# Build Backend Image for AMD64 using a different approach
print_status "Building Backend AMD64 Image with Alpine base..."
BACKEND_AMD64_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG-amd64"

# Use the Alpine-based Dockerfile for AMD64
docker buildx build \
  --platform linux/amd64 \
  -f apps/backend/Dockerfile.railway-final \
  -t "$BACKEND_AMD64_IMAGE" \
  --push \
  .

print_success "Backend AMD64 image built and pushed: $BACKEND_AMD64_IMAGE"

# Create a manifest that combines both architectures
print_status "Creating multi-architecture manifest..."
BACKEND_MULTI_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG"

docker buildx imagetools create \
  -t "$BACKEND_MULTI_IMAGE" \
  "$BACKEND_ARM64_IMAGE" \
  "$BACKEND_AMD64_IMAGE"

print_success "Backend multi-arch manifest created: $BACKEND_MULTI_IMAGE"

# Build Frontend Image for Multiple Architectures
print_status "Building Frontend Multi-Architecture Image..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$FRONT_IMAGE_TAG"

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
docker buildx imagetools inspect "$BACKEND_MULTI_IMAGE"
echo ""
echo "Frontend image platforms:"
docker buildx imagetools inspect "$FRONTEND_IMAGE"

# Clean up
print_status "Cleaning up builder..."
docker buildx rm multiarch-builder

# Summary
echo ""
print_success "🎉 Separate architecture images built and pushed successfully!"
echo ""
print_status "Docker Images (Multi-Architecture):"
echo "  Backend:  $BACKEND_MULTI_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""
print_status "Individual Architecture Images:"
echo "  Backend ARM64: $BACKEND_ARM64_IMAGE"
echo "  Backend AMD64: $BACKEND_AMD64_IMAGE"
echo ""
print_status "Use these image names in Railway:"
echo "  Backend:  $BACKEND_MULTI_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
