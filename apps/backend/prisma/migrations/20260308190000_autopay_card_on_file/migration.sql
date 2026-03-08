-- AlterTable
ALTER TABLE "public"."Resident"
ADD COLUMN "autopayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autopayRetrySchedule" INTEGER[] DEFAULT ARRAY[1,3,7]::INTEGER[],
ADD COLUMN "autopayConsentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."RecurringInvoice"
ADD COLUMN "autopayEnabled" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."PaymentMethod"
ADD COLUMN "networkTokenized" BOOLEAN NOT NULL DEFAULT false;
