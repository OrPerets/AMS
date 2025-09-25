# 🔧 Manual Environment Variables Setup for Railway

Since the Railway CLI requires service linking, here's how to set up your environment variables manually through the Railway dashboard.

## Step 1: Access Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Login to your account
3. Find your AMS project
4. Click on your backend service

## Step 2: Set Environment Variables

In the Railway dashboard, go to your service and click on the **"Variables"** tab.

### Required Variables (Set These First):

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-32-chars-min
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-32-chars-min
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production

# Database (from Railway PostgreSQL service)
DATABASE_URL=postgresql://username:password@host:port/database

# Application URLs (update with your actual Railway URLs)
FRONTEND_URL=https://your-frontend-url.railway.app
API_BASE_URL=https://your-backend-url.railway.app
CORS_ORIGIN=https://your-frontend-url.railway.app

# Security
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

### Optional Variables (Set if you need these features):

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
```

## Step 3: Generate Secure Secrets

For the JWT secrets, use these commands to generate secure random strings:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET  
openssl rand -base64 32
```

## Step 4: Get Database URL

1. In Railway dashboard, go to your PostgreSQL service
2. Click on the **"Connect"** tab
3. Copy the **"Connection String"** 
4. Use this as your `DATABASE_URL`

## Step 5: Set Frontend Variables (if deploying frontend separately)

If you're deploying the frontend as a separate service:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_API_BASE=https://your-backend-url.railway.app
NODE_ENV=production
```

## Step 6: Deploy and Test

After setting all variables:

1. **Redeploy your service:**
   ```bash
   railway up
   ```

2. **Check logs:**
   ```bash
   railway logs
   ```

3. **Test health endpoint:**
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

4. **Set up database:**
   ```bash
   railway run npm run db:deploy
   railway run npm run db:seed:prod
   ```

## Quick Setup Commands (if CLI works)

If you can get the CLI working with service linking:

```bash
# Link to your service first
railway service your-service-name

# Then set variables
railway variables --set "JWT_SECRET=$(openssl rand -base64 32)"
railway variables --set "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=3000"
railway variables --set "DATABASE_URL=your-database-url"
```

## Troubleshooting

### Variables Not Taking Effect?
- Redeploy your service after setting variables
- Check that variable names are exactly correct (case-sensitive)
- Ensure no extra spaces in variable values

### Database Connection Issues?
- Verify DATABASE_URL format: `postgresql://username:password@host:port/database`
- Check that PostgreSQL service is running
- Test connection: `railway run npx prisma db pull`

### Health Check Still Failing?
- Check Railway logs for startup errors
- Verify all required environment variables are set
- Ensure backend starts successfully before health check timeout

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

---

**The manual dashboard approach is often more reliable than CLI for setting environment variables!** 🚀
