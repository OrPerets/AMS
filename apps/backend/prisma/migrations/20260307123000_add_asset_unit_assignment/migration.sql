-- AlterTable
ALTER TABLE "public"."Asset"
ADD COLUMN "unitId" INTEGER;

-- CreateIndex
CREATE INDEX "Asset_unitId_idx" ON "public"."Asset"("unitId");

-- AddForeignKey
ALTER TABLE "public"."Asset"
ADD CONSTRAINT "Asset_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
