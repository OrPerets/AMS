# Scripts Directory

This directory contains utility scripts for the AMS project.

## Directory Structure

```
scripts/
├── archived-build-scripts/  # Old build scripts (kept for reference)
├── archived-dockerfiles/     # Old Dockerfile versions (kept for reference)
└── README.md                 # This file
```

## Current Active Files

All build and deployment commands have been moved to the root `Makefile`.
Use `make help` to see all available commands.

## Archived Files

The `archived-build-scripts/` and `archived-dockerfiles/` directories contain
older versions of build scripts and Dockerfiles. These are kept for reference
but are no longer actively used.

### Why were they archived?

- Multiple variations of the same script
- Trial-and-error Docker configurations
- Superseded by the Makefile approach

## Backend Scripts

Backend-specific scripts are located in `apps/backend/scripts/`:
- `create-special-users.ts` - Create special system users
- `production-seed.ts` - Seed production database
- `seed-remote-users.ts` - Seed remote database with users
- `upsert-buildings.ts` - Update or insert building data
- `upsert-demo-users.ts` - Update or insert demo users

Run these with: `npm --workspace apps/backend run ts-node scripts/<script-name>.ts`

