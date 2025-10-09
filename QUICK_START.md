# AMS Quick Start Guide

## 🚀 Essential Commands

### Development
```bash
make install           # First time setup - install dependencies
make dev               # Start both backend and frontend
make check-env         # Verify environment files
```

### Database
```bash
make db-reset          # Reset database (deletes all data!)
make db-seed           # Seed with test data
make db-studio         # Open Prisma Studio GUI
```

### Docker & Deployment
```bash
make docker-push       # Build & push images to Docker Hub
make docker-run-local  # Run locally with docker-compose
make deploy-info       # Show deployment information
```

### Code Quality
```bash
make lint              # Check code style
make lint-fix          # Auto-fix linting issues
make format            # Format code with Prettier
make test              # Run all tests
```

## 📦 Project Structure

```
AMS/
├── Makefile               # All commands here!
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/          # Source code
│   │   ├── prisma/       # Database schema
│   │   └── Dockerfile.*  # Docker configs
│   └── frontend/         # Next.js app
│       ├── pages/        # Routes
│       ├── components/   # React components
│       └── Dockerfile.*  # Docker configs
├── scripts/              # Utility scripts
└── .github/              # GitHub configs
```

## 🌐 Default URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | http://localhost:3001 | Your Railway URL |
| Backend | http://localhost:3000 | Your Railway URL |
| Health Check | http://localhost:3000/health | Your Railway URL/health |

## 🔐 Demo Users

After seeding, you can login with:
- **Master**: master@demo.com / master123
- **Manager**: manager@demo.com / manager123
- **Resident**: resident@demo.com / resident123

## 🐳 Docker Images

Current images pushed to Docker Hub:
- Backend: `orperetz/ams-backend:railway-fixed`
- Frontend: `orperetz/ams-frontend:latest`

## 💡 Tips

1. **Always run `make help`** to see all available commands
2. **Use `make check-env`** before starting development
3. **Run `make db-seed`** after resetting database
4. **Use `make docker-push`** when ready to deploy
5. **Check `make deploy-info`** for deployment instructions

## 🆘 Common Issues

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
make ps

# Verify .env file
make check-env
```

### "Port already in use"
```bash
# Kill processes on ports 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### "Docker build fails"
```bash
# Clean and rebuild
make clean-docker
make docker-build
```

## 📚 More Help

- Full README: `README.md`
- All commands: `make help`
- Changelog: `CHANGELOG.md`
- Deployment guide: See AGENTS.md

