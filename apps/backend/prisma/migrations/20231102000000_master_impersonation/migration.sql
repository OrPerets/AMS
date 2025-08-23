ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MASTER';

CREATE TABLE "ImpersonationEvent" (
  "id" SERIAL PRIMARY KEY,
  "masterUserId" INTEGER NOT NULL REFERENCES "User"("id"),
  "action" TEXT NOT NULL,
  "targetRole" "Role",
  "tenantId" INTEGER,
  "reason" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
