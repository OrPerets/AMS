#!/bin/bash

# Build Single Architecture Docker Images for Railway
# This script creates single-arch images as a fallback when multi-arch fails

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
BACK_IMAGE_TAG="railway-single"
FRONT_IMAGE_TAG="single"

print_status "Building Single Architecture Docker Images for Railway"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build Backend Image for Single Architecture (AMD64)
print_status "Building Backend Single Architecture Image (AMD64)..."
BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG"

docker build \
  -f apps/backend/Dockerfile.railway-runtime-prisma \
  -t "$BACKEND_IMAGE" \
  .

print_success "Backend single-arch image built: $BACKEND_IMAGE"

# Push the image
print_status "Pushing Backend image..."
docker push "$BACKEND_IMAGE"

# Build Frontend Image for Single Architecture (AMD64)
print_status "Building Frontend Single Architecture Image (AMD64)..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$FRONT_IMAGE_TAG"

docker build \
  -f apps/frontend/Dockerfile \
  -t "$FRONTEND_IMAGE" \
  .

print_success "Frontend single-arch image built: $FRONTEND_IMAGE"

# Push the image
print_status "Pushing Frontend image..."
docker push "$FRONTEND_IMAGE"

# Summary
echo ""
print_success "🎉 Single architecture images built and pushed successfully!"
echo ""
print_status "Docker Images (Single Architecture - AMD64):"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
echo ""
print_status "Use these image names in Railway:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
