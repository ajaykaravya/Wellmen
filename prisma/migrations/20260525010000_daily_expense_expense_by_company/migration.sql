-- AlterTable
ALTER TABLE "DailyExpense" ADD COLUMN "expenseById" TEXT;

-- AlterTable
ALTER TABLE "DailyExpense" ADD COLUMN "expenseCompanyId" TEXT;

-- AlterTable
ALTER TABLE "DailyExpense" ALTER COLUMN "transactionType" SET DEFAULT 'EXPENSE';

-- CreateIndex
CREATE INDEX "DailyExpense_expenseById_idx" ON "DailyExpense"("expenseById");

-- CreateIndex
CREATE INDEX "DailyExpense_expenseCompanyId_idx" ON "DailyExpense"("expenseCompanyId");

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_expenseById_fkey" FOREIGN KEY ("expenseById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_expenseCompanyId_fkey" FOREIGN KEY ("expenseCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
