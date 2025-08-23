-- Create Role enum and alter User.role to use it
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";


