-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "completedDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Todo_completedDate_idx" ON "Todo"("completedDate");
