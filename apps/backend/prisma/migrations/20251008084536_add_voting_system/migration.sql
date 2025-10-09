-- CreateEnum
CREATE TYPE "public"."VoteType" AS ENUM ('YES_NO', 'MULTIPLE_CHOICE', 'RATING');

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "question" TEXT NOT NULL,
    "voteType" "public"."VoteType" NOT NULL DEFAULT 'YES_NO',
    "createdBy" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "requireAllVotes" BOOLEAN NOT NULL DEFAULT false,
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoteOption" (
    "id" SERIAL NOT NULL,
    "voteId" INTEGER NOT NULL,
    "optionText" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VoteOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoteResponse" (
    "id" SERIAL NOT NULL,
    "voteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "optionId" INTEGER,
    "response" BOOLEAN,
    "rating" INTEGER,
    "comment" TEXT,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vote_buildingId_idx" ON "public"."Vote"("buildingId");

-- CreateIndex
CREATE INDEX "Vote_isActive_idx" ON "public"."Vote"("isActive");

-- CreateIndex
CREATE INDEX "Vote_endDate_idx" ON "public"."Vote"("endDate");

-- CreateIndex
CREATE INDEX "VoteOption_voteId_idx" ON "public"."VoteOption"("voteId");

-- CreateIndex
CREATE INDEX "VoteResponse_voteId_idx" ON "public"."VoteResponse"("voteId");

-- CreateIndex
CREATE INDEX "VoteResponse_userId_idx" ON "public"."VoteResponse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteResponse_voteId_userId_key" ON "public"."VoteResponse"("voteId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoteOption" ADD CONSTRAINT "VoteOption_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "public"."Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoteResponse" ADD CONSTRAINT "VoteResponse_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "public"."Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoteResponse" ADD CONSTRAINT "VoteResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoteResponse" ADD CONSTRAINT "VoteResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."VoteOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
