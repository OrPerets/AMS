CREATE TYPE "GardensPlanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'NEEDS_CHANGES');

CREATE TABLE "GardensWorkerProfile" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "displayName" TEXT NOT NULL,
  "teamName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GardensWorkerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GardensMonth" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "title" TEXT,
  "submissionDeadline" TIMESTAMP(3),
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GardensMonth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GardensWorkerPlan" (
  "id" SERIAL NOT NULL,
  "monthId" INTEGER NOT NULL,
  "workerProfileId" INTEGER NOT NULL,
  "status" "GardensPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" INTEGER,
  "reviewNote" TEXT,
  "lastReminderAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GardensWorkerPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GardensAssignment" (
  "id" SERIAL NOT NULL,
  "workerPlanId" INTEGER NOT NULL,
  "workDate" TIMESTAMP(3) NOT NULL,
  "location" TEXT NOT NULL,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GardensAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GardensWorkerProfile_userId_key" ON "GardensWorkerProfile"("userId");
CREATE INDEX "GardensWorkerProfile_isActive_idx" ON "GardensWorkerProfile"("isActive");
CREATE INDEX "GardensWorkerProfile_displayName_idx" ON "GardensWorkerProfile"("displayName");

CREATE UNIQUE INDEX "GardensMonth_tenantId_year_month_key" ON "GardensMonth"("tenantId", "year", "month");
CREATE INDEX "GardensMonth_tenantId_year_month_idx" ON "GardensMonth"("tenantId", "year", "month");
CREATE INDEX "GardensMonth_isLocked_idx" ON "GardensMonth"("isLocked");

CREATE UNIQUE INDEX "GardensWorkerPlan_monthId_workerProfileId_key" ON "GardensWorkerPlan"("monthId", "workerProfileId");
CREATE INDEX "GardensWorkerPlan_status_idx" ON "GardensWorkerPlan"("status");
CREATE INDEX "GardensWorkerPlan_reviewedById_idx" ON "GardensWorkerPlan"("reviewedById");

CREATE UNIQUE INDEX "GardensAssignment_workerPlanId_workDate_key" ON "GardensAssignment"("workerPlanId", "workDate");
CREATE INDEX "GardensAssignment_workDate_idx" ON "GardensAssignment"("workDate");

ALTER TABLE "GardensWorkerProfile"
  ADD CONSTRAINT "GardensWorkerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GardensMonth"
  ADD CONSTRAINT "GardensMonth_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GardensWorkerPlan"
  ADD CONSTRAINT "GardensWorkerPlan_monthId_fkey"
  FOREIGN KEY ("monthId") REFERENCES "GardensMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GardensWorkerPlan"
  ADD CONSTRAINT "GardensWorkerPlan_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "GardensWorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GardensWorkerPlan"
  ADD CONSTRAINT "GardensWorkerPlan_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GardensAssignment"
  ADD CONSTRAINT "GardensAssignment_workerPlanId_fkey"
  FOREIGN KEY ("workerPlanId") REFERENCES "GardensWorkerPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
