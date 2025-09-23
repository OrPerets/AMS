-- Create Role enum type used by User.role and other relations
CREATE TYPE "Role" AS ENUM ('ADMIN','PM','TECH','RESIDENT','ACCOUNTANT');

CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "refreshTokenHash" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
