-- AlterEnum

-- Rename table
ALTER TABLE "DailyExpense" RENAME TO "FinanceTransaction";

ALTER TABLE "FinanceTransaction" RENAME CONSTRAINT "DailyExpense_pkey" TO "FinanceTransaction_pkey";

ALTER INDEX "DailyExpense_transactionType_idx" RENAME TO "FinanceTransaction_transactionType_idx";
ALTER INDEX "DailyExpense_date_idx" RENAME TO "FinanceTransaction_date_idx";
ALTER INDEX "DailyExpense_expenseTypeId_idx" RENAME TO "FinanceTransaction_expenseTypeId_idx";
ALTER INDEX "DailyExpense_incomeTypeId_idx" RENAME TO "FinanceTransaction_incomeTypeId_idx";
ALTER INDEX "DailyExpense_expenseById_idx" RENAME TO "FinanceTransaction_expenseById_idx";
ALTER INDEX "DailyExpense_expenseCompanyId_idx" RENAME TO "FinanceTransaction_expenseCompanyId_idx";
ALTER INDEX "DailyExpense_projectId_idx" RENAME TO "FinanceTransaction_projectId_idx";
ALTER INDEX "DailyExpense_paymentMode_idx" RENAME TO "FinanceTransaction_paymentMode_idx";

-- AlterTable
ALTER TABLE "FinanceTransaction"
  ADD COLUMN "cashGivenToId" TEXT,
  ADD COLUMN "cashGivenById" TEXT,
  ADD COLUMN "cashGivenFromCompanyId" TEXT;

-- CreateIndex
CREATE INDEX "FinanceTransaction_cashGivenToId_idx" ON "FinanceTransaction"("cashGivenToId");
CREATE INDEX "FinanceTransaction_cashGivenById_idx" ON "FinanceTransaction"("cashGivenById");
CREATE INDEX "FinanceTransaction_cashGivenFromCompanyId_idx" ON "FinanceTransaction"("cashGivenFromCompanyId");

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_cashGivenToId_fkey" FOREIGN KEY ("cashGivenToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_cashGivenById_fkey" FOREIGN KEY ("cashGivenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_cashGivenFromCompanyId_fkey" FOREIGN KEY ("cashGivenFromCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate CashIn rows into the shared table
INSERT INTO "FinanceTransaction" (
  "id",
  "transactionType",
  "amount",
  "expenseTypeId",
  "incomeTypeId",
  "expenseById",
  "expenseCompanyId",
  "projectId",
  "cashGivenToId",
  "cashGivenById",
  "cashGivenFromCompanyId",
  "paymentMode",
  "date",
  "remark",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'CASH',
  "amount",
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  "cashGivenToId",
  "cashGivenById",
  "cashGivenFromCompanyId",
  "paymentMode",
  "date",
  NULL,
  "createdAt",
  "updatedAt"
FROM "CashIn";

DROP TABLE "CashIn";
