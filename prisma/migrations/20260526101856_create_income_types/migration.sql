-- AlterTable
ALTER TABLE "DailyExpense" ADD COLUMN     "incomeTypeId" TEXT;

-- CreateTable
CREATE TABLE "IncomeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExpenseTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomeType_name_key" ON "IncomeType"("name");

-- CreateIndex
CREATE INDEX "IncomeType_status_idx" ON "IncomeType"("status");

-- CreateIndex
CREATE INDEX "DailyExpense_incomeTypeId_idx" ON "DailyExpense"("incomeTypeId");

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_incomeTypeId_fkey" FOREIGN KEY ("incomeTypeId") REFERENCES "IncomeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
