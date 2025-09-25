# 🚀 AMS Railway Deployment - Fixed Version

## The Issue
The previous deployment failed because Railway was trying to build both backend and frontend together, causing Prisma generation issues.

## Solution: Deploy Services Separately

### Option 1: Deploy Backend Only (Recommended for API)

1. **Create Backend Service:**
   ```bash
   railway login
   railway init
   ```

2. **Copy backend-specific Railway config:**
   ```bash
   cp railway-backend.json railway.json
   ```

3. **Deploy Backend:**
   ```bash
   railway up
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="your-postgresql-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set JWT_REFRESH_SECRET="your-refresh-secret"
   railway variables set NODE_ENV="production"
   railway variables set PORT="3000"
   ```

5. **Set up Database:**
   ```bash
   railway run npm run db:deploy
   railway run npm run db:seed:prod
   ```

### Option 2: Deploy Frontend Separately

1. **Create Frontend Service:**
   ```bash
   railway init
   ```

2. **Copy frontend-specific Railway config:**
   ```bash
   cp railway-frontend.json railway.json
   ```

3. **Deploy Frontend:**
   ```bash
   railway up
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set NEXT_PUBLIC_API_BASE="https://your-backend-url.railway.app"
   railway variables set NODE_ENV="production"
   ```

## Alternative: Use Railway's Monorepo Support

### Deploy as Single Service (Backend + Frontend)

1. **Use the main railway.json:**
   ```bash
   railway init
   railway up
   ```

2. **Set all environment variables:**
   ```bash
   # Backend variables
   railway variables set DATABASE_URL="your-postgresql-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set JWT_REFRESH_SECRET="your-refresh-secret"
   railway variables set NODE_ENV="production"
   railway variables set PORT="3000"
   
   # Frontend variables
   railway variables set NEXT_PUBLIC_API_BASE="https://your-backend-url.railway.app"
   ```

## Quick Fix Commands

### For Backend Only:
```bash
# 1. Login and initialize
railway login
railway init

# 2. Use backend config
cp railway-backend.json railway.json

# 3. Deploy
railway up

# 4. Set environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"

# 5. Set up database
railway run npm run db:deploy
railway run npm run db:seed:prod
```

### For Frontend Only:
```bash
# 1. Create new service
railway init

# 2. Use frontend config
cp railway-frontend.json railway.json

# 3. Deploy
railway up

# 4. Set environment variables
railway variables set NEXT_PUBLIC_API_BASE="https://your-backend-url.railway.app"
railway variables set NODE_ENV="production"
```

## Environment Variables Reference

### Backend Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `JWT_REFRESH_SECRET` - JWT refresh secret (32+ characters)
- `NODE_ENV` - Set to "production"
- `PORT` - Server port (default: 3000)

### Frontend Required:
- `NEXT_PUBLIC_API_BASE` - Backend API URL
- `NODE_ENV` - Set to "production"

### Optional Backend:
- `AWS_ACCESS_KEY_ID` - For S3 file uploads
- `AWS_SECRET_ACCESS_KEY` - For S3 file uploads
- `SENDGRID_API_KEY` - For email notifications
- `TWILIO_ACCOUNT_SID` - For SMS notifications
- `TRANZILA_TERMINAL_ID` - For payment processing
- `STRIPE_SECRET_KEY` - For payment processing

## Troubleshooting

### Build Still Fails?
1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Try building locally first:**
   ```bash
   npm run build
   ```

3. **Check environment variables:**
   ```bash
   railway variables
   ```

### Database Issues?
1. **Verify DATABASE_URL format:**
   ```
   postgresql://username:password@host:port/database
   ```

2. **Test connection:**
   ```bash
   railway run npx prisma db pull
   ```

### Frontend Can't Connect to Backend?
1. **Check NEXT_PUBLIC_API_BASE is set correctly**
2. **Verify backend is running and accessible**
3. **Check CORS configuration in backend**

## Success Indicators

✅ **Backend deployed successfully**
- Health check passes: `https://your-backend.railway.app/health`
- API endpoints respond correctly

✅ **Frontend deployed successfully**
- Frontend loads without errors
- Can connect to backend API

✅ **Database working**
- Migrations applied successfully
- Demo data seeded
- Can login with demo credentials

## Demo Credentials (after seeding)
- **Admin**: admin@demo.com / admin123
- **PM**: pm@demo.com / pm123
- **Tech**: tech@demo.com / tech123
- **Resident**: resident@demo.com / resident123
- **Accountant**: accountant@demo.com / accountant123
- **Master**: master@demo.com / master123

---

**This approach should resolve the deployment issues you encountered!** 🚀
