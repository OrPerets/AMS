ALTER TABLE "Supplier"
  ADD COLUMN "complianceDocumentExpiry" TIMESTAMP(3),
  ADD COLUMN "lastComplianceReminderAt" TIMESTAMP(3);

ALTER TABLE "Contract"
  ADD COLUMN "lastRenewalReminderAt" TIMESTAMP(3);
