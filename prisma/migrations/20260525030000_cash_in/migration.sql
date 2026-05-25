-- CreateEnum
CREATE TYPE "CashPaymentMode" AS ENUM ('CASH', 'BANK');

-- CreateTable
CREATE TABLE "CashIn" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cashGivenToId" TEXT NOT NULL,
    "cashGivenById" TEXT NOT NULL,
    "cashGivenFromCompanyId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMode" "CashPaymentMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashIn_date_idx" ON "CashIn"("date");

-- CreateIndex
CREATE INDEX "CashIn_cashGivenToId_idx" ON "CashIn"("cashGivenToId");

-- CreateIndex
CREATE INDEX "CashIn_cashGivenById_idx" ON "CashIn"("cashGivenById");

-- CreateIndex
CREATE INDEX "CashIn_cashGivenFromCompanyId_idx" ON "CashIn"("cashGivenFromCompanyId");

-- CreateIndex
CREATE INDEX "CashIn_paymentMode_idx" ON "CashIn"("paymentMode");

-- AddForeignKey
ALTER TABLE "CashIn" ADD CONSTRAINT "CashIn_cashGivenToId_fkey" FOREIGN KEY ("cashGivenToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIn" ADD CONSTRAINT "CashIn_cashGivenById_fkey" FOREIGN KEY ("cashGivenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIn" ADD CONSTRAINT "CashIn_cashGivenFromCompanyId_fkey" FOREIGN KEY ("cashGivenFromCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
