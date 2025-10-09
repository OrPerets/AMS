# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-10-08

### Added
- **Makefile** - Comprehensive build and development commands
  - `make help` - Show all available commands
  - `make docker-push` - Build and push Docker images
  - `make dev` - Run development servers
  - `make db-reset` - Reset database
  - And 25+ more commands for common tasks
- **Scripts Organization** - Archived old build scripts and Dockerfiles
  - Created `scripts/archived-build-scripts/` for old scripts
  - Created `scripts/archived-dockerfiles/` for old Dockerfiles
  - Added `scripts/README.md` for documentation
- **PR Template** - Added GitHub pull request template

### Changed
- **Docker Build Process** - Fixed cross-platform compatibility
  - Backend: Runtime Prisma generation to avoid ARM64→AMD64 build issues
  - Frontend: Fixed Next.js standalone build path issues
  - Both images now build successfully on Apple Silicon for Railway deployment
- **README.md** - Updated with Makefile commands
  - Added Make commands section
  - Updated Docker deployment instructions
  - Simplified quick start guide
- **Component Fixes**
  - Created missing `table.tsx` UI component
  - Fixed TypeScript errors in Layout and ExpenseBreakdownChart

### Fixed
- **Frontend Build Errors**
  - Fixed missing `table.tsx` component
  - Fixed toast action `altText` TypeScript error
  - Fixed `percent` undefined error in charts
- **Docker Deployment**
  - Fixed backend Prisma generation during build
  - Fixed frontend server.js path in standalone build
  - Both images now deploy successfully to Railway

### Removed
- Moved 10+ old build scripts to archive
- Moved 15+ old Dockerfiles to archive
- Cleaned up root directory clutter

## Project Structure After Cleanup

```
AMS/
├── Makefile                    # ✨ NEW: All build commands
├── README.md                   # Updated with Make commands
├── CHANGELOG.md                # ✨ NEW: This file
├── apps/
│   ├── backend/
│   │   ├── Dockerfile          # Active: Local development
│   │   └── Dockerfile.railway-runtime-amd64  # Active: Railway deployment
│   └── frontend/
│       ├── Dockerfile          # Active: Local development
│       └── Dockerfile.railway  # Active: Railway deployment
├── scripts/
│   ├── README.md               # ✨ NEW: Documentation
│   ├── archived-build-scripts/ # ✨ NEW: Old scripts
│   └── archived-dockerfiles/   # ✨ NEW: Old Dockerfiles
└── .github/
    └── PULL_REQUEST_TEMPLATE.md  # ✨ NEW: PR template
```

## Docker Images

- **Backend**: `orperetz/ams-backend:railway-fixed`
  - Platform: linux/amd64
  - Runtime Prisma generation
  - Runtime TypeScript compilation
  
- **Frontend**: `orperetz/ams-frontend:latest`
  - Platform: linux/amd64
  - Next.js standalone build
  - Fixed server.js path

## Migration Guide

### Before (Multiple Scripts)
```bash
./build-railway-amd64.sh
./docker-build-and-push.sh
npm run dev:backend
npm run db:reset
```

### After (Makefile)
```bash
make docker-push
make dev
make db-reset
```

## Known Issues

None at this time. All Docker builds working correctly.

## Future Improvements

- [ ] Add automated testing in CI/CD
- [ ] Add Docker health checks
- [ ] Optimize Docker layer caching
- [ ] Add Kubernetes deployment configs
- [ ] Add performance monitoring

