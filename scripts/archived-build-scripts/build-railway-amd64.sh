#!/bin/bash

# Build AMD64 Docker Images for Railway
# This script builds AMD64-only images for Railway deployment

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
BACK_IMAGE_TAG="railway-fixed"
FRONT_IMAGE_TAG="latest"

print_status "Building AMD64 Docker Images for Railway"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Get current Git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD)
if [ -z "$GIT_COMMIT" ]; then
    print_warning "Could not get Git commit hash. Using 'latest' for image tags."
    GIT_COMMIT="latest"
fi

BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$BACK_IMAGE_TAG"
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$FRONT_IMAGE_TAG"

print_status "Backend Image: $BACKEND_IMAGE"
print_status "Frontend Image: $FRONTEND_IMAGE"
echo ""

# Build Backend Image for AMD64
print_status "Building backend image for AMD64..."
docker build \
  --platform linux/amd64 \
  -f apps/backend/Dockerfile.railway \
  -t "$BACKEND_IMAGE" \
  .
print_success "Backend image built: $BACKEND_IMAGE"
echo ""

# Build Frontend Image for AMD64
print_status "Building frontend image for AMD64..."
docker build \
  --platform linux/amd64 \
  -f apps/frontend/Dockerfile.railway \
  -t "$FRONTEND_IMAGE" \
  .
print_success "Frontend image built: $FRONTEND_IMAGE"
echo ""

# Push Images
print_status "Pushing backend image to Docker Hub..."
docker push "$BACKEND_IMAGE"
print_success "Backend image pushed."
echo ""

print_status "Pushing frontend image to Docker Hub..."
docker push "$FRONTEND_IMAGE"
print_success "Frontend image pushed."
echo ""

print_success "AMD64 build and push complete!"
echo "You can now deploy these images to Railway."
