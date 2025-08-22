-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "buildingId" INTEGER NOT NULL REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable (implicit many-to-many)
CREATE TABLE "_ResidentToUnit" (
    "A" INTEGER NOT NULL REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "B" INTEGER NOT NULL REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ResidentToUnit_AB_unique" ON "_ResidentToUnit"("A", "B");
CREATE INDEX "_ResidentToUnit_B_index" ON "_ResidentToUnit"("B");
