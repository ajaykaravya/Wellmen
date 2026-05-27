-- CreateTable
CREATE TABLE "IncomeTransaction" (
  "id" TEXT NOT NULL,
  "transactionType" "TransactionType" NOT NULL DEFAULT 'INCOME',
  "amount" DECIMAL(14,2) NOT NULL,
  "incomeTypeId" TEXT,
  "incomeCompanyId" TEXT,
  "receivedById" TEXT,
  "projectId" TEXT,
  "paymentMode" "CashPaymentMode",
  "date" TIMESTAMP(3) NOT NULL,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IncomeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeTransaction_transactionType_idx" ON "IncomeTransaction"("transactionType");
CREATE INDEX "IncomeTransaction_date_idx" ON "IncomeTransaction"("date");
CREATE INDEX "IncomeTransaction_incomeTypeId_idx" ON "IncomeTransaction"("incomeTypeId");
CREATE INDEX "IncomeTransaction_incomeCompanyId_idx" ON "IncomeTransaction"("incomeCompanyId");
CREATE INDEX "IncomeTransaction_receivedById_idx" ON "IncomeTransaction"("receivedById");
CREATE INDEX "IncomeTransaction_projectId_idx" ON "IncomeTransaction"("projectId");
CREATE INDEX "IncomeTransaction_paymentMode_idx" ON "IncomeTransaction"("paymentMode");

-- AddForeignKey
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_incomeTypeId_fkey" FOREIGN KEY ("incomeTypeId") REFERENCES "IncomeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_incomeCompanyId_fkey" FOREIGN KEY ("incomeCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncomeTransaction" ADD CONSTRAINT "IncomeTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate INCOME rows into the dedicated table
INSERT INTO "IncomeTransaction" (
  "id",
  "transactionType",
  "amount",
  "incomeTypeId",
  "incomeCompanyId",
  "receivedById",
  "projectId",
  "paymentMode",
  "date",
  "remark",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'INCOME',
  "amount",
  "incomeTypeId",
  "expenseCompanyId",
  "expenseById",
  "projectId",
  "paymentMode",
  "date",
  "remark",
  "createdAt",
  "updatedAt"
FROM "FinanceTransaction"
WHERE "transactionType" = 'INCOME';

DELETE FROM "FinanceTransaction"
WHERE "transactionType" = 'INCOME';

-- Remove income-specific columns from the shared expense/cash table
ALTER TABLE "FinanceTransaction"
DROP CONSTRAINT IF EXISTS "FinanceTransaction_incomeTypeId_fkey";

ALTER TABLE "FinanceTransaction"
DROP CONSTRAINT IF EXISTS "DailyExpense_incomeTypeId_fkey";
DROP INDEX "FinanceTransaction_incomeTypeId_idx";
ALTER TABLE "FinanceTransaction" DROP COLUMN "incomeTypeId";
