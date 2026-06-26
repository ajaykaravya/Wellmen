ALTER TABLE `PetiCash`
  ADD COLUMN `isAdvance` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `FinanceTransaction`
  ADD COLUMN `petiCashId` CHAR(36) NULL;

CREATE UNIQUE INDEX `FinanceTransaction_petiCashId_key`
  ON `FinanceTransaction`(`petiCashId`);

CREATE INDEX `FinanceTransaction_petiCashId_idx`
  ON `FinanceTransaction`(`petiCashId`);

ALTER TABLE `FinanceTransaction`
  ADD CONSTRAINT `FinanceTransaction_petiCashId_fkey`
  FOREIGN KEY (`petiCashId`) REFERENCES `PetiCash`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
