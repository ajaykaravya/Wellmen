-- CreateEnum
CREATE TYPE "PetiCashTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateTable
CREATE TABLE "PetiCash" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transactionType" "PetiCashTransactionType" NOT NULL,
    "givenById" TEXT,
    "givenToId" TEXT,
    "companyId" TEXT,
    "projectId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetiCash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetiCash_transactionType_idx" ON "PetiCash"("transactionType");
CREATE INDEX "PetiCash_date_idx" ON "PetiCash"("date");
CREATE INDEX "PetiCash_givenById_idx" ON "PetiCash"("givenById");
CREATE INDEX "PetiCash_givenToId_idx" ON "PetiCash"("givenToId");
CREATE INDEX "PetiCash_companyId_idx" ON "PetiCash"("companyId");
CREATE INDEX "PetiCash_projectId_idx" ON "PetiCash"("projectId");

-- AddForeignKey
ALTER TABLE "PetiCash" ADD CONSTRAINT "PetiCash_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PetiCash" ADD CONSTRAINT "PetiCash_givenToId_fkey" FOREIGN KEY ("givenToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PetiCash" ADD CONSTRAINT "PetiCash_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PetiCash" ADD CONSTRAINT "PetiCash_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
