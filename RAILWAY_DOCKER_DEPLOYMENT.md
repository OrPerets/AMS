# 🐳 Railway Docker Deployment Guide

This guide shows how to deploy AMS using Docker images from DockerHub to Railway.

## Overview

Instead of building from source code, we'll:
1. Build Docker images locally
2. Push them to DockerHub
3. Deploy from DockerHub to Railway

## Benefits

✅ **Faster deployments** - No build time on Railway
✅ **Consistent environments** - Same image everywhere
✅ **Version control** - Tag images with versions
✅ **Rollback capability** - Easy to revert to previous versions
✅ **Local testing** - Test images locally before deployment

## Step 1: Build and Push Docker Images

### Option A: Use the Automated Script
```bash
./docker-build-and-push.sh
```

### Option B: Manual Build and Push

#### Build Backend Image
```bash
# Build backend image
docker build -f apps/backend/Dockerfile -t your-username/ams-backend:latest .

# Tag with version (optional)
docker tag your-username/ams-backend:latest your-username/ams-backend:v1.0.0

# Push to DockerHub
docker push your-username/ams-backend:latest
docker push your-username/ams-backend:v1.0.0
```

#### Build Frontend Image
```bash
# Build frontend image
docker build -f apps/frontend/Dockerfile -t your-username/ams-frontend:latest .

# Tag with version (optional)
docker tag your-username/ams-frontend:latest your-username/ams-frontend:v1.0.0

# Push to DockerHub
docker push your-username/ams-frontend:latest
docker push your-username/ams-frontend:v1.0.0
```

## Step 2: Deploy to Railway

### Method 1: Railway Dashboard (Recommended)

#### Deploy Backend
1. Go to Railway dashboard
2. Create new service or use existing
3. Select **"Deploy from Docker Hub"**
4. Enter image: `your-username/ams-backend:latest`
5. Configure:
   - **Port**: 3000
   - **Health Check Path**: `/health`

#### Deploy Frontend
1. Create another service
2. Select **"Deploy from Docker Hub"**
3. Enter image: `your-username/ams-frontend:latest`
4. Configure:
   - **Port**: 3001
   - **Health Check Path**: `/`

### Method 2: Railway CLI

#### Deploy Backend
```bash
# Create backend service
railway service create ams-backend

# Deploy from DockerHub
railway up --dockerfile your-username/ams-backend:latest
```

#### Deploy Frontend
```bash
# Create frontend service
railway service create ams-frontend

# Deploy from DockerHub
railway up --dockerfile your-username/ams-frontend:latest
```

## Step 3: Set Environment Variables

### Backend Environment Variables
```bash
# Required
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
NODE_ENV=production
PORT=3000

# Optional
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TRANZILA_TERMINAL_ID=your-tranzila-terminal-id
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Frontend Environment Variables
```bash
# Required
NEXT_PUBLIC_API_BASE=https://your-backend-url.railway.app
NODE_ENV=production

# Optional
NEXT_PUBLIC_APP_NAME=AMS - Asset Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Step 4: Set Up Database

### Add PostgreSQL Service
1. In Railway dashboard, add PostgreSQL service
2. Copy the connection string
3. Set as `DATABASE_URL` in backend service

### Run Migrations
```bash
# Connect to backend service
railway service ams-backend

# Run migrations
railway run npm run db:deploy

# Seed database
railway run npm run db:seed:prod
```

## Step 5: Test Deployment

### Test Backend
```bash
# Health check
curl https://your-backend-url.railway.app/health

# Expected response: {"status":"ok"}
```

### Test Frontend
```bash
# Visit frontend URL
curl https://your-frontend-url.railway.app

# Should return HTML page
```

### Test Integration
1. Visit frontend URL in browser
2. Try to login with demo credentials
3. Verify API calls work

## Docker Image Management

### Versioning Strategy
```bash
# Build with version tags
docker build -t your-username/ams-backend:v1.0.0 .
docker build -t your-username/ams-frontend:v1.0.0 .

# Push versioned images
docker push your-username/ams-backend:v1.0.0
docker push your-username/ams-frontend:v1.0.0

# Keep latest tag updated
docker tag your-username/ams-backend:v1.0.0 your-username/ams-backend:latest
docker push your-username/ams-backend:latest
```

### Local Testing
```bash
# Test backend locally
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  your-username/ams-backend:latest

# Test frontend locally
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_BASE="http://localhost:3000" \
  your-username/ams-frontend:latest
```

## Troubleshooting

### Image Build Fails
```bash
# Check Dockerfile syntax
docker build --no-cache -f apps/backend/Dockerfile .

# Check build logs
docker build -f apps/backend/Dockerfile . 2>&1 | tee build.log
```

### Push to DockerHub Fails
```bash
# Login to DockerHub
docker login

# Check image exists
docker images | grep ams-backend

# Try push again
docker push your-username/ams-backend:latest
```

### Railway Deployment Fails
```bash
# Check Railway logs
railway logs

# Verify image exists on DockerHub
# Visit: https://hub.docker.com/r/your-username/ams-backend
```

### Health Check Fails
```bash
# Check if container is running
docker ps

# Check container logs
docker logs container-id

# Test health endpoint
curl http://localhost:3000/health
```

## Best Practices

### Security
- Use non-root users in Dockerfiles
- Don't include secrets in images
- Use multi-stage builds to reduce image size
- Regularly update base images

### Performance
- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching
- Use Alpine Linux for smaller images
- Optimize build context

### Monitoring
- Set up health checks
- Monitor image sizes
- Track deployment history
- Set up alerts for failures

## Project Structure

```
Railway Project: AMS
├── Backend Service (Docker)
│   ├── Image: your-username/ams-backend:latest
│   ├── URL: https://ams-backend-xxxx.up.railway.app
│   └── Health: /health
├── Frontend Service (Docker)
│   ├── Image: your-username/ams-frontend:latest
│   ├── URL: https://ams-frontend-xxxx.up.railway.app
│   └── Health: /
└── PostgreSQL Database
    └── Connection: DATABASE_URL
```

## Cost Optimization

- **DockerHub**: Free for public repos, paid for private
- **Railway**: Pay only for running services
- **Image size**: Smaller images = faster deployments
- **Caching**: Use Docker layer caching to speed up builds

---

**Docker deployment provides better control, consistency, and deployment speed!** 🚀
