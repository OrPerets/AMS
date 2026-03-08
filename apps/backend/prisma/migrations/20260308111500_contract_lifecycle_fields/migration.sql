-- AlterTable
ALTER TABLE "public"."Contract"
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "ownerUserId" INTEGER,
ADD COLUMN "renewalReminderDays" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "Contract_ownerUserId_idx" ON "public"."Contract"("ownerUserId");

-- AddForeignKey
ALTER TABLE "public"."Contract"
ADD CONSTRAINT "Contract_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
