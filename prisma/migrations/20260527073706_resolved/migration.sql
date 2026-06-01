-- RenameForeignKey
ALTER TABLE "FinanceTransaction" RENAME CONSTRAINT "DailyExpense_expenseById_fkey" TO "FinanceTransaction_expenseById_fkey";

-- RenameForeignKey
ALTER TABLE "FinanceTransaction" RENAME CONSTRAINT "DailyExpense_expenseCompanyId_fkey" TO "FinanceTransaction_expenseCompanyId_fkey";

-- RenameForeignKey
ALTER TABLE "FinanceTransaction" RENAME CONSTRAINT "DailyExpense_expenseTypeId_fkey" TO "FinanceTransaction_expenseTypeId_fkey";

-- RenameForeignKey
ALTER TABLE "FinanceTransaction" RENAME CONSTRAINT "DailyExpense_projectId_fkey" TO "FinanceTransaction_projectId_fkey";
