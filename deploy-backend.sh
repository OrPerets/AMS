#!/bin/bash

# AMS Backend Railway Deployment Script
# This script deploys only the backend service to Railway

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

print_status "🚀 Starting AMS Backend Railway Deployment..."

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

# Use backend-specific Railway config
print_status "Configuring for backend deployment..."
cp railway-backend.json railway.json

# Deploy to Railway
print_status "Deploying backend to Railway..."
railway up

print_success "Backend deployment initiated!"

# Get deployment URL
print_status "Getting deployment information..."
railway status

print_success "🎉 AMS Backend has been deployed to Railway!"
print_status "Next steps:"
echo "1. Set up your environment variables:"
echo "   railway variables set DATABASE_URL=\"your-postgresql-url\""
echo "   railway variables set JWT_SECRET=\"$(openssl rand -base64 32)\""
echo "   railway variables set JWT_REFRESH_SECRET=\"$(openssl rand -base64 32)\""
echo "   railway variables set NODE_ENV=\"production\""
echo ""
echo "2. Set up your database:"
echo "   railway run npm run db:deploy"
echo "   railway run npm run db:seed:prod"
echo ""
echo "3. Test your backend:"
echo "   curl https://your-backend-url.railway.app/health"

print_status "Backend deployment completed successfully!"
