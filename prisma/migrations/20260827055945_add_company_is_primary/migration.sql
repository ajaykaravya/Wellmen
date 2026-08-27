-- AlterTable
ALTER TABLE `Company` ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Company_isPrimary_idx` ON `Company`(`isPrimary`);
