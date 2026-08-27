-- AlterTable
ALTER TABLE `Company` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `contactNumber` VARCHAR(191) NULL,
    ADD COLUMN `contactPerson` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `logoUrl` TEXT NULL;
