-- CreateEnum
CREATE TYPE "public"."CodeType" AS ENUM ('ENTRANCE', 'SERVICE', 'ELEVATOR', 'GATE', 'PARKING', 'WIFI', 'ALARM', 'OTHER');

-- CreateTable
CREATE TABLE "public"."BuildingCode" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "codeType" "public"."CodeType" NOT NULL DEFAULT 'ENTRANCE',
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingCode_buildingId_idx" ON "public"."BuildingCode"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingCode_isActive_idx" ON "public"."BuildingCode"("isActive");

-- AddForeignKey
ALTER TABLE "public"."BuildingCode" ADD CONSTRAINT "BuildingCode_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuildingCode" ADD CONSTRAINT "BuildingCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
