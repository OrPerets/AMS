#!/bin/bash

# AMS Railway Deployment Script
# This script prepares and deploys the AMS application to Railway

set -e

echo "🚀 Starting AMS Railway Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_status "Checking project structure..."

# Verify required files exist
required_files=(
    "package.json"
    "apps/backend/package.json"
    "apps/frontend/package.json"
    "apps/backend/prisma/schema.prisma"
    "railway.json"
    "railway.toml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "Project structure verified"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

print_success "Build completed successfully"

# Check if Railway project exists
print_status "Checking Railway project..."

if railway status &> /dev/null; then
    print_success "Railway project found"
else
    print_warning "No Railway project found. Creating new project..."
    railway init
fi

# Deploy to Railway
print_status "Deploying to Railway..."
railway up

print_success "Deployment completed successfully!"

# Get deployment URL
print_status "Getting deployment information..."
railway status

print_success "🎉 AMS has been successfully deployed to Railway!"
print_status "Next steps:"
echo "1. Set up your environment variables in Railway dashboard"
echo "2. Configure your database connection"
echo "3. Run database migrations: railway run npm run db:deploy"
echo "4. Seed the database: railway run npm run db:seed"
echo "5. Test your deployment"

print_status "Environment variables needed:"
echo "- DATABASE_URL"
echo "- JWT_SECRET"
echo "- JWT_REFRESH_SECRET"
echo "- NEXT_PUBLIC_API_BASE (for frontend)"
echo "- AWS credentials (if using S3)"
echo "- SendGrid API key (if using email)"
echo "- Twilio credentials (if using SMS)"
