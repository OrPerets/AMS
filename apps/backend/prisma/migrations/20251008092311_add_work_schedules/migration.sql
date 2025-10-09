-- CreateEnum
CREATE TYPE "public"."ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('MAINTENANCE', 'INSPECTION', 'REPAIR', 'CLEANING', 'EMERGENCY', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."WorkSchedule" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "buildingId" INTEGER,
    "title" TEXT,
    "description" TEXT,
    "createdBy" INTEGER NOT NULL,
    "status" "public"."ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledTask" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "taskType" "public"."TaskType" NOT NULL DEFAULT 'MAINTENANCE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "estimatedTime" INTEGER,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "notes" TEXT,
    "ticketId" INTEGER,
    "workOrderId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSchedule_date_idx" ON "public"."WorkSchedule"("date");

-- CreateIndex
CREATE INDEX "WorkSchedule_buildingId_idx" ON "public"."WorkSchedule"("buildingId");

-- CreateIndex
CREATE INDEX "WorkSchedule_status_idx" ON "public"."WorkSchedule"("status");

-- CreateIndex
CREATE INDEX "ScheduledTask_scheduleId_idx" ON "public"."ScheduledTask"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduledTask_assignedTo_idx" ON "public"."ScheduledTask"("assignedTo");

-- CreateIndex
CREATE INDEX "ScheduledTask_status_idx" ON "public"."ScheduledTask"("status");

-- CreateIndex
CREATE INDEX "ScheduledTask_taskType_idx" ON "public"."ScheduledTask"("taskType");

-- AddForeignKey
ALTER TABLE "public"."WorkSchedule" ADD CONSTRAINT "WorkSchedule_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSchedule" ADD CONSTRAINT "WorkSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledTask" ADD CONSTRAINT "ScheduledTask_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledTask" ADD CONSTRAINT "ScheduledTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledTask" ADD CONSTRAINT "ScheduledTask_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledTask" ADD CONSTRAINT "ScheduledTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
