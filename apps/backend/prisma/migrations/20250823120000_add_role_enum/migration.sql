-- Create Role enum if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT');
  END IF;
END
$$;

-- Ensure User.role uses the Role enum (safe if already set)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'role' AND udt_name <> 'Role'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
  END IF;
END
$$;


