# 🚀 AMS Railway Quick Start Guide

Get your Asset Management System deployed on Railway in under 10 minutes!

## Prerequisites

- [Railway account](https://railway.app) (free tier available)
- [Railway CLI](https://docs.railway.app/develop/cli) installed
- Git repository access

## 🏃‍♂️ Quick Deployment (5 minutes)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Clone and Deploy
```bash
# Clone your repository (if not already done)
git clone <your-repo-url>
cd AMS

# Initialize Railway project
railway init

# Deploy the application
railway up
```

### 4. Set Up Database
```bash
# Add PostgreSQL service in Railway dashboard
# Then run migrations and seeding
railway run npm run db:deploy
railway run npm run db:seed:prod
```

### 5. Configure Environment Variables
```bash
# Run the setup script
./setup-env.sh
```

## 🎯 That's It!

Your AMS application is now live on Railway! 

- **Backend API**: Available at your Railway backend URL
- **Frontend**: Available at your Railway frontend URL
- **Database**: PostgreSQL running on Railway

## 🔑 Demo Login Credentials

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Property Manager | pm@demo.com | pm123 |
| Technician | tech@demo.com | tech123 |
| Resident | resident@demo.com | resident123 |
| Accountant | accountant@demo.com | accountant123 |
| Master | master@demo.com | master123 |

## 🛠️ What's Included

✅ **Backend API** (NestJS)
- Authentication & Authorization
- Property Management
- Maintenance & Work Orders
- Financial Management
- Communication System
- Document Management

✅ **Frontend** (Next.js)
- Modern React UI
- Responsive Design
- Real-time Updates
- Role-based Access

✅ **Database** (PostgreSQL)
- Production-ready schema
- Demo data included
- Automated migrations

✅ **Infrastructure** (Railway)
- Auto-scaling
- SSL certificates
- Health checks
- Monitoring

## 🔧 Customization

### Environment Variables
All configuration is done through Railway environment variables:

- **Required**: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **Optional**: AWS S3, SendGrid, Twilio, Payment providers

### Custom Domain
1. Go to Railway dashboard
2. Select your service
3. Go to Settings → Domains
4. Add your custom domain
5. Configure DNS as instructed

## 📊 Monitoring

Railway provides built-in monitoring:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Health Checks**: Automatic health monitoring
- **Alerts**: Email notifications for issues

## 💰 Cost

Railway offers:
- **Free Tier**: $5 credit monthly
- **Pro Plan**: $20/month for production use
- **Pay-as-you-go**: Only pay for what you use

## 🆘 Need Help?

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **AMS Documentation**: See `RAILWAY_DEPLOYMENT.md`

## 🎉 Next Steps

1. **Customize**: Update branding, colors, and features
2. **Integrate**: Add payment providers, email services
3. **Scale**: Configure auto-scaling and monitoring
4. **Backup**: Set up automated database backups
5. **Security**: Review and update security settings

---

**Happy Deploying! 🚀**

Your Asset Management System is now ready for production use on Railway.
