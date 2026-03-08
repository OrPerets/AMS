-- CreateEnum
CREATE TYPE "public"."InvoiceReminderState" AS ENUM ('NONE', 'UPCOMING', 'SENT', 'PROMISED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."CollectionStatus" AS ENUM ('CURRENT', 'PAST_DUE', 'IN_COLLECTIONS', 'PROMISE_TO_PAY', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."ActivitySeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- AlterTable
ALTER TABLE "public"."Invoice"
ADD COLUMN "collectionNotes" TEXT,
ADD COLUMN "collectionStatus" "public"."CollectionStatus" NOT NULL DEFAULT 'CURRENT',
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "lastReminderAt" TIMESTAMP(3),
ADD COLUMN "lateFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "promiseToPayDate" TIMESTAMP(3),
ADD COLUMN "reminderState" "public"."InvoiceReminderState" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "public"."RecurringInvoice"
ADD COLUMN "dueDaysAfterIssue" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "graceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lateFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "public"."Supplier"
ADD COLUMN "complianceNotes" TEXT,
ADD COLUMN "contactName" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "buildingId" INTEGER,
  "residentId" INTEGER,
  "entityType" TEXT NOT NULL,
  "entityId" INTEGER,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "severity" "public"."ActivitySeverity" NOT NULL DEFAULT 'INFO',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "public"."ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_buildingId_createdAt_idx" ON "public"."ActivityLog"("buildingId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_residentId_createdAt_idx" ON "public"."ActivityLog"("residentId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "public"."ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."ActivityLog"
ADD CONSTRAINT "ActivityLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog"
ADD CONSTRAINT "ActivityLog_buildingId_fkey"
FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog"
ADD CONSTRAINT "ActivityLog_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
