ALTER TABLE "DailyExpense" ADD COLUMN "projectId" TEXT;
ALTER TABLE "DailyExpense" ADD COLUMN "paymentMode" "CashPaymentMode";

CREATE INDEX "DailyExpense_projectId_idx" ON "DailyExpense"("projectId");
CREATE INDEX "DailyExpense_paymentMode_idx" ON "DailyExpense"("paymentMode");

ALTER TABLE "DailyExpense"
  ADD CONSTRAINT "DailyExpense_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
