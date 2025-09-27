# AMS - Asset Management System

A comprehensive Property Management System built with NestJS backend and Next.js frontend.

## Architecture

- **Backend**: NestJS API server with Prisma ORM and PostgreSQL
- **Frontend**: Next.js web application with TypeScript
- **Database**: PostgreSQL with comprehensive schema for property management

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL database (or use Docker)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd AMS
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Backend environment
   cp backend.env.example apps/backend/.env
   # Edit apps/backend/.env with your database URL and JWT secrets
   
   # Frontend environment
   cp frontend.env.example apps/frontend/.env
   # Edit apps/frontend/.env with your backend URL
   ```

3. **Database Setup**
   ```bash
   npm run db:reset
   npm run seed:test
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

5. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

## Docker Deployment

### Building and Pushing Images

1. **Quick Build & Push**
   ```bash
   chmod +x docker-build-and-push.sh
   ./docker-build-and-push.sh
   ```
   
   The script will prompt for:
   - DockerHub username
   - Image tag (default: latest)
   - Version tag (optional)
   - Whether to push to DockerHub

2. **Manual Build**
   ```bash
   # Build backend image
   docker build -f apps/backend/Dockerfile -t your-username/ams-backend:latest .
   
   # Build frontend image
   docker build -f apps/frontend/Dockerfile -t your-username/ams-frontend:latest .
   
   # Push to DockerHub
   docker push your-username/ams-backend:latest
   docker push your-username/ams-frontend:latest
   ```

### Local Docker Testing

1. **Full Stack with Database**
   ```bash
   docker-compose up -d
   ```
   
   This starts:
   - PostgreSQL database
   - Backend API
   - Frontend application

2. **Access Services**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - Database: localhost:5432

### Production Deployment

1. **Prepare Environment**
   ```bash
   cp production.env.example .env.production
   # Edit .env.production with your production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

3. **Environment Variables Required**
   ```bash
   DOCKERHUB_USERNAME=your-dockerhub-username
   IMAGE_TAG=latest
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   NEXT_PUBLIC_API_BASE=https://your-backend-domain.com
   ```

### Deployment Options

#### Option 1: Docker Compose (Recommended for VPS/Cloud)
```bash
# Clone repository on your server
git clone <repository-url>
cd AMS

# Set up environment
cp production.env.example .env.production
nano .env.production  # Edit with your values

# Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

#### Option 2: Individual Containers
```bash
# Backend
docker run -d \
  --name ams-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  your-username/ams-backend:latest

# Frontend
docker run -d \
  --name ams-frontend \
  -p 3001:3001 \
  -e NEXT_PUBLIC_API_BASE=http://localhost:3000 \
  your-username/ams-frontend:latest
```

#### Option 3: Cloud Platforms
- **Railway**: Use the provided Docker images
- **Heroku**: Use container deployment
- **AWS ECS/Fargate**: Use the Docker images
- **Google Cloud Run**: Use the Docker images

## Environment Configuration

### Backend Environment (`apps/backend/.env`)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ams
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
```

### Frontend Environment (`apps/frontend/.env`)
```bash
NEXT_PUBLIC_API_BASE=http://localhost:3000
```

### Production Environment (`.env.production`)
See `production.env.example` for all required variables.

## Database Management

### Reset and Seed
```bash
npm run db:reset          # Reset database schema
npm run seed:test         # Seed with test data
```

### Migration Commands
```bash
cd apps/backend
npx prisma migrate dev    # Run migrations in development
npx prisma migrate deploy # Run migrations in production
npx prisma generate       # Generate Prisma client
```

## Health Checks

- **Backend**: `GET /health` - Returns `{"status":"ok"}`
- **Frontend**: `GET /` - Returns the application

## Monitoring

The Docker containers include health checks:
- Backend: Checks `/health` endpoint
- Frontend: Checks root path
- Database: Checks PostgreSQL connection

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -f apps/backend/Dockerfile -t ams-backend .
   ```

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Ensure database is accessible
   - Check firewall settings

3. **Frontend Build Issues**
   - Ensure `NEXT_PUBLIC_API_BASE` is set correctly
   - Check for TypeScript errors: `npm run build`

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x docker-build-and-push.sh
   ```

### Logs
```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View specific service logs
docker logs ams-backend
docker logs ams-frontend
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets (32+ characters)
   - Rotate secrets regularly

2. **Database**
   - Use strong database passwords
   - Enable SSL connections in production
   - Regular backups

3. **Docker Images**
   - Keep base images updated
   - Scan images for vulnerabilities
   - Use non-root users (already configured)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

## License

[Add your license information here]
