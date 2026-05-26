/*
  Warnings:

  - The values [BANK] on the enum `CashPaymentMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CashPaymentMode_new" AS ENUM ('CASH', 'CHEQUE', 'UPI', 'NEFT_RTGS');
ALTER TABLE "DailyExpense" ALTER COLUMN "paymentMode" TYPE "CashPaymentMode_new" USING ("paymentMode"::text::"CashPaymentMode_new");
ALTER TABLE "CashIn" ALTER COLUMN "paymentMode" TYPE "CashPaymentMode_new" USING ("paymentMode"::text::"CashPaymentMode_new");
ALTER TYPE "CashPaymentMode" RENAME TO "CashPaymentMode_old";
ALTER TYPE "CashPaymentMode_new" RENAME TO "CashPaymentMode";
DROP TYPE "public"."CashPaymentMode_old";
COMMIT;
