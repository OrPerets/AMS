# Production Database Users & Passwords

## Current Users in Production Database

| User ID | Email | Role | Tenant | Created | Password |
|---------|-------|------|--------|---------|----------|
| 1 | master@demo.com | MASTER | 1 | 2025-09-27 | **master123** |
| 2 | manager@demo.com | PM | 1 | 2025-09-27 | **password123** |
| 3 | tenant@demo.com | RESIDENT | 1 | 2025-09-27 | **password123** |
| 5 | amit.magen@demo.com | ADMIN | 1 | 2025-09-28 | **password123** |
| 6 | or.peretz@demo.com | ADMIN | 1 | 2025-09-28 | **password123** |
| 7 | maya@demo.com | PM | 1 | 2025-09-28 | **password123** |
| 8 | client@demo.com | RESIDENT | 1 | 2025-09-28 | **password123** |
| 9 | tech1@demo.com | TECH | 1 | 2025-09-28 | **password123** |
| 10 | tech2@demo.com | TECH | 1 | 2025-09-28 | **password123** |
| 11 | tech3@demo.com | TECH | 1 | 2025-09-28 | **password123** |

## Password Summary

- **master@demo.com**: `master123` (MASTER role)
- **All other users**: `password123` (various roles)

## Additional Notes

- Total users: 10
- All users belong to tenant ID 1
- Passwords are stored as bcrypt hashes in the database
- The `user@demo.com` account mentioned in create-special-users.ts is not present in production
- Two additional users exist in production that weren't in the original seed:
  - `manager@demo.com` (PM role)
  - `tenant@demo.com` (RESIDENT role)

## Database Connection

- **Host**: yamanote.proxy.rlwy.net:51560
- **Database**: railway
- **Connection**: postgresql://postgres:drmEkGEHiPgxbdUwAWpkHgOvqiKCvhhk@yamanote.proxy.rlwy.net:51560/railway

## Script Used

The list was generated using: `apps/backend/scripts/list-prod-users.ts`

---

*Generated on: $(date)*
*Database: Production Railway PostgreSQL*
