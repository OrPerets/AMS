#!/bin/bash

# Deploy Frontend to Same Railway Project
# This script helps deploy the frontend as a separate service

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

print_status "🎨 Deploying Frontend to Same Railway Project..."

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

print_status "Current project status:"
railway status

echo ""
print_warning "To deploy frontend to the same project, you have two options:"
echo ""
echo "Option 1: Railway Dashboard (Recommended)"
echo "1. Go to railway.app and find your AMS project"
echo "2. Click 'New Service'"
echo "3. Select 'GitHub Repo' and choose your AMS repository"
echo "4. Configure:"
echo "   - Name: ams-frontend"
echo "   - Root Directory: apps/frontend"
echo "   - Build Command: npm ci && cd apps/frontend && npm run build"
echo "   - Start Command: cd apps/frontend && npm run start:prod"
echo ""
echo "Option 2: Try CLI (may not work in this environment)"
echo "railway add"
echo ""

print_status "Frontend Environment Variables to Set:"
echo "NEXT_PUBLIC_API_BASE=https://ams-production-5b83.up.railway.app"
echo "NODE_ENV=production"
echo ""

print_status "After deployment, test with:"
echo "curl https://your-frontend-url.railway.app"
echo ""

print_success "Frontend deployment guide created!"
print_status "See FRONTEND_DEPLOYMENT_GUIDE.md for detailed instructions"
