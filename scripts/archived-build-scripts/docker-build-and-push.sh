#!/bin/bash

# AMS Docker Build and Push Script
# This script builds Docker images for both backend and frontend and pushes them to DockerHub

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
VERSION_TAG=""
PUSH_IMAGES="y"

# Get user input
echo "🐳 AMS Docker Build and Push Script"
echo "====================================="
echo ""

read -p "DockerHub Username: " DOCKERHUB_USERNAME
read -p "Image Tag (default: latest): " IMAGE_TAG
IMAGE_TAG=${IMAGE_TAG:-latest}

read -p "Version Tag (optional, e.g., v1.0.0): " VERSION_TAG
read -p "Push to DockerHub? (y/n, default: y): " PUSH_IMAGES
PUSH_IMAGES=${PUSH_IMAGES:-y}

# Validate inputs
if [ -z "$DOCKERHUB_USERNAME" ]; then
    print_error "DockerHub username is required!"
    exit 1
fi

print_status "Configuration:"
echo "  DockerHub Username: $DOCKERHUB_USERNAME"
echo "  Image Tag: $IMAGE_TAG"
if [ ! -z "$VERSION_TAG" ]; then
    echo "  Version Tag: $VERSION_TAG"
fi
echo "  Push to DockerHub: $PUSH_IMAGES"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if user is logged in to DockerHub (only if pushing)
if [ "$PUSH_IMAGES" = "y" ] && ! docker info | grep -q "Username"; then
    print_warning "You may need to login to DockerHub:"
    echo "docker login"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Build Backend Image
print_status "Building Backend Docker Image..."
BACKEND_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$IMAGE_TAG"
docker build -f apps/backend/Dockerfile -t "$BACKEND_IMAGE" .

if [ ! -z "$VERSION_TAG" ]; then
    BACKEND_VERSION_IMAGE="$DOCKERHUB_USERNAME/ams-backend:$VERSION_TAG"
    docker tag "$BACKEND_IMAGE" "$BACKEND_VERSION_IMAGE"
    print_status "Tagged backend image as: $BACKEND_VERSION_IMAGE"
fi

print_success "Backend image built: $BACKEND_IMAGE"

# Build Frontend Image
print_status "Building Frontend Docker Image..."
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$IMAGE_TAG"
docker build -f apps/frontend/Dockerfile -t "$FRONTEND_IMAGE" .

if [ ! -z "$VERSION_TAG" ]; then
    FRONTEND_VERSION_IMAGE="$DOCKERHUB_USERNAME/ams-frontend:$VERSION_TAG"
    docker tag "$FRONTEND_IMAGE" "$FRONTEND_VERSION_IMAGE"
    print_status "Tagged frontend image as: $FRONTEND_VERSION_IMAGE"
fi

print_success "Frontend image built: $FRONTEND_IMAGE"

# Push images if requested
if [ "$PUSH_IMAGES" = "y" ]; then
    # Push Backend Image
    print_status "Pushing Backend Image to DockerHub..."
    docker push "$BACKEND_IMAGE"

    if [ ! -z "$VERSION_TAG" ]; then
        docker push "$BACKEND_VERSION_IMAGE"
        print_success "Pushed backend version image: $BACKEND_VERSION_IMAGE"
    fi

    print_success "Backend image pushed: $BACKEND_IMAGE"

    # Push Frontend Image
    print_status "Pushing Frontend Image to DockerHub..."
    docker push "$FRONTEND_IMAGE"

    if [ ! -z "$VERSION_TAG" ]; then
        docker push "$FRONTEND_VERSION_IMAGE"
        print_success "Pushed frontend version image: $FRONTEND_VERSION_IMAGE"
    fi

    print_success "Frontend image pushed: $FRONTEND_IMAGE"
fi

# Summary
echo ""
print_success "🎉 All images built successfully!"
if [ "$PUSH_IMAGES" = "y" ]; then
    print_success "All images pushed to DockerHub!"
fi
echo ""
print_status "Docker Images:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
if [ ! -z "$VERSION_TAG" ]; then
    echo "  Backend (versioned):  $BACKEND_VERSION_IMAGE"
    echo "  Frontend (versioned): $FRONTEND_VERSION_IMAGE"
fi
echo ""
print_status "Next steps:"
echo "1. Deploy using Docker Compose or your preferred container orchestration"
echo "2. Set environment variables for production"
echo "3. Configure your database connection"
echo "4. Test your deployment"
echo ""
print_status "Example Docker Compose usage:"
echo "  Backend:  $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"
