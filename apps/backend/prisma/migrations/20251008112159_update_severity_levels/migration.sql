-- CreateEnum for new TicketSeverity values
CREATE TYPE "TicketSeverity_new" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- AlterTable: Update existing data and change type
-- First, add a temporary column with the new enum type
ALTER TABLE "Ticket" ADD COLUMN "severity_new" "TicketSeverity_new";

-- Update data: Map old values to new values
-- LOW → NORMAL
-- MEDIUM → HIGH  
-- HIGH → URGENT
UPDATE "Ticket" 
SET "severity_new" = CASE 
    WHEN "severity"::text = 'LOW' THEN 'NORMAL'::"TicketSeverity_new"
    WHEN "severity"::text = 'MEDIUM' THEN 'HIGH'::"TicketSeverity_new"
    WHEN "severity"::text = 'HIGH' THEN 'URGENT'::"TicketSeverity_new"
    ELSE 'NORMAL'::"TicketSeverity_new"
END;

-- Drop old column
ALTER TABLE "Ticket" DROP COLUMN "severity";

-- Rename new column to original name
ALTER TABLE "Ticket" RENAME COLUMN "severity_new" TO "severity";

-- Drop old enum type
DROP TYPE "TicketSeverity";

-- Rename new enum type to original name
ALTER TYPE "TicketSeverity_new" RENAME TO "TicketSeverity";

-- Set NOT NULL constraint on severity column
ALTER TABLE "Ticket" ALTER COLUMN "severity" SET NOT NULL;

