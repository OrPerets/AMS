#!/bin/bash

# AMS Environment Variables Setup Script for Railway
# This script helps set up environment variables for Railway deployment

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

print_status "🔧 Setting up AMS environment variables for Railway..."

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

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

print_status "Generated JWT secrets"

# Get user input for configuration
echo ""
print_status "Please provide the following information:"

read -p "Database URL (from Railway PostgreSQL service): " DATABASE_URL
read -p "Frontend URL (e.g., https://your-app.railway.app): " FRONTEND_URL
read -p "Backend URL (e.g., https://your-api.railway.app): " BACKEND_URL

echo ""
print_warning "Optional services (press Enter to skip):"

read -p "AWS Access Key ID (for S3 file uploads): " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "SendGrid API Key (for email notifications): " SENDGRID_API_KEY
read -p "SendGrid From Email: " SENDGRID_FROM_EMAIL

read -p "Twilio Account SID (for SMS): " TWILIO_ACCOUNT_SID
read -p "Twilio Auth Token: " TWILIO_AUTH_TOKEN
read -p "Twilio Phone Number: " TWILIO_PHONE_NUMBER

read -p "Tranzila Terminal ID (for payments): " TRANZILA_TERMINAL_ID
read -p "Tranzila Password: " TRANZILA_PASSWORD

read -p "Stripe Secret Key (for payments): " STRIPE_SECRET_KEY
read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET

echo ""
print_status "Setting environment variables in Railway..."

# Set required variables
railway variables --set "JWT_SECRET=$JWT_SECRET"
railway variables --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
railway variables --set "JWT_EXPIRES_IN=15m"
railway variables --set "JWT_REFRESH_EXPIRES_IN=7d"
railway variables --set "PORT=3000"
railway variables --set "NODE_ENV=production"
railway variables --set "DATABASE_URL=$DATABASE_URL"
railway variables --set "FRONTEND_URL=$FRONTEND_URL"
railway variables --set "API_BASE_URL=$BACKEND_URL"
railway variables --set "CORS_ORIGIN=$FRONTEND_URL"
railway variables --set "BCRYPT_ROUNDS=12"
railway variables --set "LOG_LEVEL=info"

# Set optional variables if provided
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    railway variables --set "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
    railway variables --set "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
    railway variables --set "AWS_REGION=$AWS_REGION"
fi

if [ ! -z "$SENDGRID_API_KEY" ]; then
    railway variables --set "SENDGRID_API_KEY=$SENDGRID_API_KEY"
    railway variables --set "SENDGRID_FROM_EMAIL=$SENDGRID_FROM_EMAIL"
fi

if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
    railway variables --set "TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID"
    railway variables --set "TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN"
    railway variables --set "TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER"
fi

if [ ! -z "$TRANZILA_TERMINAL_ID" ]; then
    railway variables --set "TRANZILA_TERMINAL_ID=$TRANZILA_TERMINAL_ID"
    railway variables --set "TRANZILA_PASSWORD=$TRANZILA_PASSWORD"
fi

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    railway variables --set "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    railway variables --set "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
fi

print_success "Environment variables set successfully!"

echo ""
print_status "Next steps:"
echo "1. Run database migrations: railway run npm run db:deploy"
echo "2. Seed the database: railway run npm run db:seed:prod"
echo "3. Test your deployment"

echo ""
print_status "Demo user credentials (after seeding):"
echo "Admin: admin@demo.com / admin123"
echo "PM: pm@demo.com / pm123"
echo "Tech: tech@demo.com / tech123"
echo "Resident: resident@demo.com / resident123"
echo "Accountant: accountant@demo.com / accountant123"
echo "Master: master@demo.com / master123"

print_success "🎉 Environment setup completed!"
