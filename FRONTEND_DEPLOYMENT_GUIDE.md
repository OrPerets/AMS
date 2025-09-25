# 🎨 Deploy Frontend to Same Railway Project

## Overview
You can deploy the frontend as a **separate service** in the same Railway project as your backend. This gives you:
- ✅ Separate scaling for frontend and backend
- ✅ Independent deployments
- ✅ Better resource management
- ✅ Easier debugging

## Method 1: Railway Dashboard (Recommended)

### Step 1: Add New Service
1. Go to your Railway project dashboard
2. Click **"New Service"**
3. Select **"GitHub Repo"** (or your git provider)
4. Choose the **same repository** (your AMS repo)

### Step 2: Configure Frontend Service
1. **Service Name**: `ams-frontend` (or similar)
2. **Root Directory**: `apps/frontend`
3. **Build Command**: `npm ci && cd apps/frontend && npm run build`
4. **Start Command**: `cd apps/frontend && npm run start:prod`
5. **Port**: `3001` (or let Railway auto-detect)

### Step 3: Set Environment Variables
In the frontend service, set these variables:

```bash
# Required
NEXT_PUBLIC_API_BASE=https://ams-production-5b83.up.railway.app
NODE_ENV=production

# Optional
NEXT_PUBLIC_APP_NAME=AMS - Asset Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete
3. Get your frontend URL

## Method 2: CLI (Alternative)

If you want to try CLI approach:

```bash
# Create new service (this might prompt for options)
railway add

# Or try to create service directly
railway service create ams-frontend
```

## Method 3: Manual Configuration

### Step 1: Create Frontend Service
1. In Railway dashboard, click **"New Service"**
2. Select **"Empty Service"**
3. Name it `ams-frontend`

### Step 2: Connect to Git
1. Click **"Connect GitHub"**
2. Select your AMS repository
3. Set **Root Directory** to `apps/frontend`

### Step 3: Configure Build Settings
1. Go to **"Settings"** → **"Build"**
2. Set **Build Command**: `npm ci && cd apps/frontend && npm run build`
3. Set **Start Command**: `cd apps/frontend && npm run start:prod`

### Step 4: Set Environment Variables
```bash
NEXT_PUBLIC_API_BASE=https://ams-production-5b83.up.railway.app
NODE_ENV=production
```

## Environment Variables Reference

### Frontend Required Variables:
```bash
NEXT_PUBLIC_API_BASE=https://your-backend-url.railway.app
NODE_ENV=production
```

### Frontend Optional Variables:
```bash
NEXT_PUBLIC_APP_NAME=AMS - Asset Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

## Project Structure After Deployment

```
Railway Project: AMS
├── Backend Service (ams-backend)
│   ├── URL: https://ams-production-5b83.up.railway.app
│   ├── Port: 3000
│   └── Health: /health
└── Frontend Service (ams-frontend)
    ├── URL: https://ams-frontend-xxxx.up.railway.app
    ├── Port: 3001
    └── Health: /
```

## Testing the Setup

### 1. Test Backend
```bash
curl https://ams-production-5b83.up.railway.app/health
# Should return: {"status":"ok"}
```

### 2. Test Frontend
```bash
curl https://your-frontend-url.railway.app
# Should return HTML page
```

### 3. Test Integration
1. Visit your frontend URL
2. Try to login with demo credentials
3. Check that API calls work

## Custom Domain Setup

### For Frontend:
1. Go to frontend service settings
2. Click **"Domains"**
3. Add your custom domain
4. Configure DNS as instructed

### For Backend:
1. Go to backend service settings
2. Click **"Domains"**
3. Add your API subdomain (e.g., `api.yourdomain.com`)

## Troubleshooting

### Frontend Build Fails?
```bash
# Check build logs in Railway dashboard
# Common issues:
# - Missing environment variables
# - Build command incorrect
# - Dependencies not installed
```

### Frontend Can't Connect to Backend?
```bash
# Check NEXT_PUBLIC_API_BASE is set correctly
# Should be: https://ams-production-5b83.up.railway.app
# Not: http://localhost:3000
```

### CORS Issues?
```bash
# In backend service, set:
CORS_ORIGIN=https://your-frontend-url.railway.app
```

## Cost Considerations

- **Free Tier**: $5 credit monthly (covers both services)
- **Pro Plan**: $20/month for production use
- **Pay-as-you-go**: Only pay for what you use

## Success Checklist

✅ **Backend deployed and healthy**
✅ **Frontend deployed and accessible**
✅ **Environment variables set correctly**
✅ **Frontend can connect to backend API**
✅ **Login functionality works**
✅ **All pages load without errors**

---

**Deploying frontend as a separate service gives you better control and scalability!** 🚀
