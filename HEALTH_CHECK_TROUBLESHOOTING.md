# 🏥 Railway Health Check Troubleshooting Guide

## The Problem
Railway deployment is failing with health check errors:
```
Attempt #1 failed with service unavailable. Continuing to retry for 1m37s
...
1/1 replicas never became healthy!
Healthcheck failed!
```

## Common Causes & Solutions

### 1. **Backend Not Starting Properly**

**Symptoms:**
- Health check fails immediately
- No logs showing successful startup

**Solutions:**
```bash
# Check Railway logs
railway logs

# Look for startup errors like:
# - Database connection issues
# - Missing environment variables
# - Port binding problems
```

### 2. **Database Connection Issues**

**Symptoms:**
- Backend starts but crashes on database operations
- Prisma connection errors

**Solutions:**
```bash
# Set DATABASE_URL correctly
railway variables set DATABASE_URL="postgresql://username:password@host:port/database"

# Test database connection
railway run npx prisma db pull
```

### 3. **Missing Environment Variables**

**Symptoms:**
- Backend starts but fails on JWT operations
- Console warnings about missing variables

**Solutions:**
```bash
# Set required environment variables
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### 4. **Port Configuration Issues**

**Symptoms:**
- Backend starts but health check can't reach it
- Port conflicts

**Solutions:**
```bash
# Ensure PORT is set correctly
railway variables set PORT="3000"

# Check if Railway is using the correct port
railway variables
```

### 5. **Build Issues**

**Symptoms:**
- Build fails during deployment
- Prisma client not generated

**Solutions:**
```bash
# Test build locally first
npm run build

# Check if Prisma client is generated
ls -la apps/backend/node_modules/@prisma/client
```

## Step-by-Step Debugging

### Step 1: Check Railway Logs
```bash
railway logs
```

Look for:
- ✅ `[bootstrap] Listening on 0.0.0.0:3000` - Backend started successfully
- ❌ Database connection errors
- ❌ Missing environment variable warnings
- ❌ Port binding errors

### Step 2: Test Health Endpoint Manually
```bash
# Get your Railway URL
railway status

# Test health endpoint
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{"status":"ok"}
```

### Step 3: Check Environment Variables
```bash
railway variables
```

Required variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`
- `PORT=3000`

### Step 4: Test Database Connection
```bash
railway run npx prisma db pull
```

This should connect to your database without errors.

## Quick Fixes

### Fix 1: Simplified Startup
```bash
# Update railway.json to use simpler startup
{
  "deploy": {
    "startCommand": "cd apps/backend && npm run start"
  }
}
```

### Fix 2: Set All Required Variables
```bash
# Set all required environment variables
railway variables set DATABASE_URL="your-postgresql-url"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### Fix 3: Run Database Setup Separately
```bash
# Don't run migrations during startup
# Run them separately after deployment
railway run npm run db:deploy
railway run npm run db:seed:prod
```

## Testing Locally

### Test Backend Startup
```bash
cd apps/backend
npm run start:dev
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test with Production Build
```bash
npm run build
npm run start
curl http://localhost:3000/health
```

## Railway-Specific Issues

### Issue: Railway Auto-Detects Wrong Port
**Solution:** Explicitly set PORT=3000

### Issue: Database URL from Railway PostgreSQL
**Solution:** Use the DATABASE_URL provided by Railway PostgreSQL service

### Issue: Build Fails on Railway
**Solution:** Use the updated railway.json with proper build command

## Success Indicators

✅ **Backend starts successfully:**
```
[bootstrap] NODE_ENV=production PORT=3000 resolvedPort=3000
[bootstrap] Listening on 0.0.0.0:3000
```

✅ **Health check passes:**
```bash
curl https://your-backend-url.railway.app/health
# Returns: {"status":"ok"}
```

✅ **Database connection works:**
```bash
railway run npx prisma db pull
# No errors
```

## Emergency Rollback

If deployment continues to fail:

```bash
# Rollback to previous version
railway rollback

# Or redeploy with fixes
railway up
```

## Getting Help

1. **Check Railway logs:** `railway logs`
2. **Test locally:** `npm run build && npm run start`
3. **Verify environment:** `railway variables`
4. **Test database:** `railway run npx prisma db pull`

---

**The key is to ensure the backend starts successfully and the health endpoint responds before Railway's health check times out!** 🚀
