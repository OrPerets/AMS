# AMIT-PMS

Monorepo for AMIT Property Management System.

## Apps
- `apps/backend`: NestJS API server.
- `apps/frontend`: Next.js web application.

## Development
Install dependencies:
```
npm install
```

Run the backend server:
```
npm run dev:backend
```

Run the frontend app:
```
npm run dev:frontend
```

Run local tests:
```
npm test
```

## Environment Configuration
Create `.env` files for each app based on the provided examples:

- `apps/backend/.env` requires `DATABASE_URL`, `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- `apps/frontend/.env` requires `NEXT_PUBLIC_API_BASE` (URL of the backend).

The backend exposes a basic health check at `/health` for deployment monitoring.

## Database Seeding
Reset the database and generate deterministic mock data:

```
yarn db:reset
yarn seed:test            # uses SEED_SCALE=small by default
```

Set `SEED_SCALE` to `medium` or `large` for bigger datasets. The seeding process
prints a table of demo user credentials at the end. In development, emails are
logged to the console and placeholder images are used instead of real uploads.

**Common issues:** ensure `DATABASE_URL` is configured and Postgres is running
before executing the commands above.
