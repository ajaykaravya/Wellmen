-- Remove any leftover legacy cash rows before dropping the enum value.
DELETE FROM "FinanceTransaction"
WHERE "transactionType" = 'CASH';

-- Drop legacy cash relations from FinanceTransaction.
ALTER TABLE "FinanceTransaction" DROP CONSTRAINT IF EXISTS "FinanceTransaction_cashGivenToId_fkey";
ALTER TABLE "FinanceTransaction" DROP CONSTRAINT IF EXISTS "FinanceTransaction_cashGivenById_fkey";

DROP INDEX IF EXISTS "FinanceTransaction_cashGivenToId_idx";
DROP INDEX IF EXISTS "FinanceTransaction_cashGivenById_idx";

ALTER TABLE "FinanceTransaction" DROP COLUMN IF EXISTS "cashGivenToId";
ALTER TABLE "FinanceTransaction" DROP COLUMN IF EXISTS "cashGivenById";

-- Drop defaults before enum replacement
ALTER TABLE "FinanceTransaction"
ALTER COLUMN "transactionType" DROP DEFAULT;

ALTER TABLE "IncomeTransaction"
ALTER COLUMN "transactionType" DROP DEFAULT;

-- Rebuild TransactionType without CASH so the schema only keeps income/expense.
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";

CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

ALTER TABLE "FinanceTransaction"
ALTER COLUMN "transactionType"
TYPE "TransactionType"
USING ("transactionType"::text::"TransactionType");

ALTER TABLE "IncomeTransaction"
ALTER COLUMN "transactionType"
TYPE "TransactionType"
USING ("transactionType"::text::"TransactionType");

-- Restore valid defaults
ALTER TABLE "FinanceTransaction"
ALTER COLUMN "transactionType"
SET DEFAULT 'EXPENSE';

ALTER TABLE "IncomeTransaction"
ALTER COLUMN "transactionType"
SET DEFAULT 'INCOME';

DROP TYPE "TransactionType_old";
