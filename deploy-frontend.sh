#!/bin/bash

# AMS Frontend Railway Deployment Script
# This script deploys only the frontend service to Railway

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

print_status "🚀 Starting AMS Frontend Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "You are not logged in to Railway. Please run:"
    echo "railway login"
    exit 1
fi

# Use frontend-specific Railway config
print_status "Configuring for frontend deployment..."
cp railway-frontend.json railway.json

# Deploy to Railway
print_status "Deploying frontend to Railway..."
railway up

print_success "Frontend deployment initiated!"

# Get deployment URL
print_status "Getting deployment information..."
railway status

print_success "🎉 AMS Frontend has been deployed to Railway!"
print_status "Next steps:"
echo "1. Set up your environment variables:"
echo "   railway variables set NEXT_PUBLIC_API_BASE=\"https://your-backend-url.railway.app\""
echo "   railway variables set NODE_ENV=\"production\""
echo ""
echo "2. Test your frontend:"
echo "   Visit https://your-frontend-url.railway.app"

print_status "Frontend deployment completed successfully!"
