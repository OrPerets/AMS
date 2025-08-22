CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "refreshTokenHash" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
