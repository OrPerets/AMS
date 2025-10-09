.PHONY: help install dev dev-backend dev-frontend build docker-build docker-push docker-deploy clean test lint format db-reset db-seed db-migrate

# Configuration
DOCKERHUB_USERNAME := orperetz
BACKEND_IMAGE := $(DOCKERHUB_USERNAME)/ams-backend:railway-fixed
FRONTEND_IMAGE := $(DOCKERHUB_USERNAME)/ams-frontend:latest
PLATFORM := linux/amd64

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

##@ Help
help: ## Display this help message
	@echo "$(CYAN)AMS - Asset Management System$(NC)"
	@echo "$(CYAN)================================$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development
install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install
	npm --workspace apps/backend install
	npm --workspace apps/frontend install

dev: ## Run both backend and frontend in development mode
	@echo "$(GREEN)Starting development servers...$(NC)"
	npm run dev

dev-backend: ## Run only backend in development mode
	@echo "$(GREEN)Starting backend server...$(NC)"
	npm run dev:backend

dev-frontend: ## Run only frontend in development mode
	@echo "$(GREEN)Starting frontend server...$(NC)"
	npm run dev:frontend

build: ## Build both backend and frontend
	@echo "$(GREEN)Building backend...$(NC)"
	cd apps/backend && npm run build
	@echo "$(GREEN)Building frontend...$(NC)"
	cd apps/frontend && npm run build

##@ Database
db-reset: ## Reset database (WARNING: Deletes all data)
	@echo "$(YELLOW)Resetting database...$(NC)"
	npm run db:reset

db-seed: ## Seed database with test data
	@echo "$(GREEN)Seeding database...$(NC)"
	npm run seed:test

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	npm --workspace apps/backend run prisma:deploy

db-studio: ## Open Prisma Studio
	@echo "$(GREEN)Opening Prisma Studio...$(NC)"
	cd apps/backend && npx prisma studio

##@ Docker
docker-build: ## Build Docker images for Railway (AMD64)
	@echo "$(GREEN)Building Docker images for Railway...$(NC)"
	@echo "Backend: $(BACKEND_IMAGE)"
	@echo "Frontend: $(FRONTEND_IMAGE)"
	@echo ""
	docker build \
		--platform $(PLATFORM) \
		-f apps/backend/Dockerfile.railway-runtime-amd64 \
		-t $(BACKEND_IMAGE) \
		.
	docker build \
		--platform $(PLATFORM) \
		-f apps/frontend/Dockerfile.railway \
		-t $(FRONTEND_IMAGE) \
		.
	@echo "$(GREEN)✓ Docker images built successfully!$(NC)"

docker-build-backend: ## Build only backend Docker image
	@echo "$(GREEN)Building backend image...$(NC)"
	docker build \
		--platform $(PLATFORM) \
		-f apps/backend/Dockerfile.railway-runtime-amd64 \
		-t $(BACKEND_IMAGE) \
		.
	@echo "$(GREEN)✓ Backend image built!$(NC)"

docker-build-frontend: ## Build only frontend Docker image
	@echo "$(GREEN)Building frontend image...$(NC)"
	docker build \
		--platform $(PLATFORM) \
		-f apps/frontend/Dockerfile.railway \
		-t $(FRONTEND_IMAGE) \
		.
	@echo "$(GREEN)✓ Frontend image built!$(NC)"

docker-push: docker-build ## Build and push Docker images to Docker Hub
	@echo "$(GREEN)Pushing images to Docker Hub...$(NC)"
	docker push $(BACKEND_IMAGE)
	docker push $(FRONTEND_IMAGE)
	@echo "$(GREEN)✓ Images pushed successfully!$(NC)"
	@echo ""
	@echo "$(CYAN)Images ready for deployment:$(NC)"
	@echo "  Backend:  $(BACKEND_IMAGE)"
	@echo "  Frontend: $(FRONTEND_IMAGE)"

docker-push-backend: docker-build-backend ## Build and push only backend image
	@echo "$(GREEN)Pushing backend image...$(NC)"
	docker push $(BACKEND_IMAGE)
	@echo "$(GREEN)✓ Backend image pushed!$(NC)"

docker-push-frontend: docker-build-frontend ## Build and push only frontend image
	@echo "$(GREEN)Pushing frontend image...$(NC)"
	docker push $(FRONTEND_IMAGE)
	@echo "$(GREEN)✓ Frontend image pushed!$(NC)"

docker-run-local: ## Run Docker containers locally with docker-compose
	@echo "$(GREEN)Starting local Docker containers...$(NC)"
	docker-compose up -d

docker-stop: ## Stop local Docker containers
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	docker-compose down

docker-logs: ## View Docker container logs
	docker-compose logs -f

##@ Testing & Quality
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	npm test

test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd apps/backend && npm test

lint: ## Run linting
	@echo "$(GREEN)Running linters...$(NC)"
	npx eslint apps/frontend --ext .ts,.tsx
	npx eslint apps/backend --ext .ts

lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	npx eslint apps/frontend --ext .ts,.tsx --fix
	npx eslint apps/backend --ext .ts --fix

format: ## Format code with Prettier
	@echo "$(GREEN)Formatting code...$(NC)"
	npx prettier --write "apps/**/*.{ts,tsx,js,jsx,json,css,md}"

audit: ## Run security audit
	@echo "$(GREEN)Running security audit...$(NC)"
	npm audit
	npm --workspace apps/backend audit
	npm --workspace apps/frontend audit

##@ Deployment
deploy-info: ## Show deployment information
	@echo "$(CYAN)Deployment Information$(NC)"
	@echo "======================"
	@echo ""
	@echo "$(YELLOW)Docker Images:$(NC)"
	@echo "  Backend:  $(BACKEND_IMAGE)"
	@echo "  Frontend: $(FRONTEND_IMAGE)"
	@echo ""
	@echo "$(YELLOW)Steps:$(NC)"
	@echo "  1. Run: make docker-push"
	@echo "  2. Go to Railway dashboard"
	@echo "  3. Redeploy services to pull latest images"
	@echo ""
	@echo "$(YELLOW)Environment Variables:$(NC)"
	@echo "  Backend:  DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET"
	@echo "  Frontend: NEXT_PUBLIC_API_BASE"

##@ Cleanup
clean: ## Clean build artifacts and node_modules
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf node_modules
	rm -rf apps/backend/node_modules apps/backend/dist
	rm -rf apps/frontend/node_modules apps/frontend/.next
	@echo "$(GREEN)✓ Cleaned!$(NC)"

clean-docker: ## Clean Docker images and containers
	@echo "$(YELLOW)Cleaning Docker artifacts...$(NC)"
	docker-compose down -v
	docker rmi $(BACKEND_IMAGE) $(FRONTEND_IMAGE) 2>/dev/null || true
	@echo "$(GREEN)✓ Docker cleaned!$(NC)"

##@ Utilities
check-env: ## Check if environment files exist
	@echo "$(GREEN)Checking environment files...$(NC)"
	@test -f apps/backend/.env && echo "$(GREEN)✓$(NC) Backend .env exists" || echo "$(RED)✗$(NC) Backend .env missing"
	@test -f apps/frontend/.env && echo "$(GREEN)✓$(NC) Frontend .env exists" || echo "$(YELLOW)⚠$(NC) Frontend .env missing (optional)"

logs-backend: ## Show backend logs (local)
	npm run dev:backend

logs-frontend: ## Show frontend logs (local)
	npm run dev:frontend

ps: ## Show running processes
	@echo "$(CYAN)Docker Processes:$(NC)"
	@docker ps --filter "name=ams" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(CYAN)Node Processes:$(NC)"
	@ps aux | grep -E "node|npm" | grep -v grep || echo "No Node processes running"

