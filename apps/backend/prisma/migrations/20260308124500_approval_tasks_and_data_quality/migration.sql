-- Create enums
CREATE TYPE "ApprovalTaskType" AS ENUM (
  'EXPENSE_APPROVAL',
  'WORK_ORDER_APPROVAL',
  'DOCUMENT_DELETE',
  'RESIDENT_BALANCE_ADJUSTMENT',
  'BUDGET_OVERRUN'
);

CREATE TYPE "ApprovalTaskStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Alter tables
ALTER TABLE "Building" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Unit" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create table
CREATE TABLE "ApprovalTask" (
  "id" SERIAL NOT NULL,
  "type" "ApprovalTaskType" NOT NULL,
  "status" "ApprovalTaskStatus" NOT NULL DEFAULT 'PENDING',
  "entityType" TEXT NOT NULL,
  "entityId" INTEGER,
  "buildingId" INTEGER,
  "residentId" INTEGER,
  "requestedById" INTEGER,
  "decidedById" INTEGER,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalTask_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ApprovalTask_status_type_createdAt_idx" ON "ApprovalTask"("status", "type", "createdAt");
CREATE INDEX "ApprovalTask_entityType_entityId_idx" ON "ApprovalTask"("entityType", "entityId");
CREATE INDEX "ApprovalTask_buildingId_status_idx" ON "ApprovalTask"("buildingId", "status");

-- Foreign keys
ALTER TABLE "ApprovalTask"
  ADD CONSTRAINT "ApprovalTask_buildingId_fkey"
  FOREIGN KEY ("buildingId") REFERENCES "Building"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalTask"
  ADD CONSTRAINT "ApprovalTask_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalTask"
  ADD CONSTRAINT "ApprovalTask_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalTask"
  ADD CONSTRAINT "ApprovalTask_decidedById_fkey"
  FOREIGN KEY ("decidedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
