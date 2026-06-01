-- DropForeignKey
ALTER TABLE "FinanceTransaction" DROP CONSTRAINT "FinanceTransaction_cashGivenFromCompanyId_fkey";

-- DropIndex
DROP INDEX "FinanceTransaction_cashGivenFromCompanyId_idx";

-- AlterTable
ALTER TABLE "FinanceTransaction" DROP COLUMN "cashGivenFromCompanyId";
