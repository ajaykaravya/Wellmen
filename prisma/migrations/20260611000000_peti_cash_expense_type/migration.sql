-- AlterTable
ALTER TABLE "PetiCash" ADD COLUMN "expenseTypeId" TEXT;

-- CreateIndex
CREATE INDEX "PetiCash_expenseTypeId_idx" ON "PetiCash"("expenseTypeId");

-- AddForeignKey
ALTER TABLE "PetiCash" ADD CONSTRAINT "PetiCash_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
