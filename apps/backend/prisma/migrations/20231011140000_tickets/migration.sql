-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL PRIMARY KEY,
    "unitId" INTEGER NOT NULL REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "severity" "TicketSeverity" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "slaDue" TIMESTAMP(3),
    "photos" TEXT[],
    "assignedToId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
