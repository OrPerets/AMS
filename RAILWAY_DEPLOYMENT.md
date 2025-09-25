# AMS Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Asset Management System (AMS) to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   ```
3. **PostgreSQL Database**: Railway provides PostgreSQL databases
4. **Environment Variables**: Prepare all required environment variables

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

2. **Follow the prompts** and set up your environment variables in the Railway dashboard.

### Option 2: Manual Deployment

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Initialize Railway project**:
   ```bash
   railway init
   ```

3. **Deploy the application**:
   ```bash
   railway up
   ```

## Environment Variables Setup

### Backend Environment Variables

Set these in your Railway project dashboard under "Variables":

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production

# Application URLs
FRONTEND_URL=https://your-frontend-domain.railway.app
API_BASE_URL=https://your-backend-domain.railway.app
```

#### Optional Variables
```bash
# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Payment Providers
TRANZILA_TERMINAL_ID=your-tranzila-terminal-id
TRANZILA_PASSWORD=your-tranzila-password
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

### Frontend Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://your-backend-domain.railway.app

# Application Configuration
NEXT_PUBLIC_APP_NAME=AMS - Asset Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

## Database Setup

### 1. Add PostgreSQL Service

1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database

### 2. Run Database Migrations

```bash
# Connect to your Railway project
railway link

# Run migrations
railway run npm run db:deploy

# Seed the database with initial data
railway run npm run db:seed
```

### 3. Verify Database Connection

```bash
# Check database status
railway run npx prisma db pull
```

## Deployment Architecture

### Monorepo Structure
```
AMS/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js Frontend
├── railway.json          # Railway configuration
├── railway.toml          # Railway configuration (alternative)
└── deploy.sh            # Deployment script
```

### Service Configuration

#### Backend Service
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Health Check**: `/health`
- **Port**: 3000

#### Frontend Service
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Port**: 3001

## Post-Deployment Steps

### 1. Verify Deployment

1. **Check backend health**:
   ```bash
   curl https://your-backend-domain.railway.app/health
   ```

2. **Test frontend**:
   Visit `https://your-frontend-domain.railway.app`

### 2. Set Up Custom Domains (Optional)

1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### 3. Configure SSL Certificates

Railway automatically provides SSL certificates for all deployments.

### 4. Set Up Monitoring

1. **Railway Metrics**: Built-in monitoring in Railway dashboard
2. **Health Checks**: Configured in `railway.json`
3. **Logs**: Available in Railway dashboard

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
railway logs

# Common fixes:
# - Ensure all dependencies are in package.json
# - Check TypeScript compilation errors
# - Verify environment variables are set
```

#### 2. Database Connection Issues
```bash
# Verify DATABASE_URL format
# Should be: postgresql://username:password@host:port/database

# Test connection
railway run npx prisma db pull
```

#### 3. Frontend API Connection Issues
```bash
# Verify NEXT_PUBLIC_API_BASE is set correctly
# Should point to your backend Railway URL

# Check CORS configuration in backend
```

#### 4. Environment Variable Issues
```bash
# List all environment variables
railway variables

# Set missing variables
railway variables set VARIABLE_NAME=value
```

### Debug Commands

```bash
# View logs
railway logs

# Connect to service shell
railway shell

# Run commands in service
railway run <command>

# Check service status
railway status
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use Railway's secure environment variable storage
- Rotate secrets regularly

### 2. Database Security
- Use strong passwords for database connections
- Enable SSL for database connections
- Regularly backup your database

### 3. API Security
- Use strong JWT secrets
- Implement rate limiting
- Enable CORS for specific origins only

## Scaling and Performance

### 1. Horizontal Scaling
- Railway automatically handles scaling
- Configure resource limits in Railway dashboard

### 2. Database Optimization
- Use connection pooling
- Implement database indexing
- Monitor query performance

### 3. Caching
- Implement Redis for session storage
- Use CDN for static assets
- Cache API responses where appropriate

## Backup and Recovery

### 1. Database Backups
```bash
# Create database backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### 2. Application Backups
- Railway automatically backs up your code
- Use version control for code backups
- Document configuration changes

## Cost Optimization

### 1. Resource Management
- Monitor resource usage in Railway dashboard
- Optimize Docker images
- Use appropriate instance sizes

### 2. Database Optimization
- Use connection pooling
- Optimize queries
- Clean up unused data

## Support and Resources

### Railway Resources
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### AMS Resources
- [Project Repository](https://github.com/your-org/ams)
- [API Documentation](./docs/api.md)
- [User Guide](./docs/user-guide.md)

## Maintenance

### Regular Tasks
1. **Weekly**: Check application logs and performance
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and optimize database performance
4. **Annually**: Review and update security configurations

### Updates and Deployments
```bash
# Deploy updates
git push origin main
railway up

# Rollback if needed
railway rollback
```

---

**Note**: This deployment guide assumes you have the necessary permissions and access to Railway services. Always test deployments in a staging environment before deploying to production.
