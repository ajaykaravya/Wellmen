/*
  Warnings:

  - You are about to drop the column `userId` on the `ExpenseType` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ExpenseType` DROP FOREIGN KEY `ExpenseType_userId_fkey`;

-- DropIndex
DROP INDEX `ExpenseType_userId_fkey` ON `ExpenseType`;

-- AlterTable
ALTER TABLE `ExpenseType` DROP COLUMN `userId`;

-- CreateTable
CREATE TABLE `ExpenseTypeUser` (
    `expenseTypeId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,

    INDEX `ExpenseTypeUser_userId_fkey`(`userId`),
    PRIMARY KEY (`expenseTypeId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExpenseTypeUser` ADD CONSTRAINT `ExpenseTypeUser_expenseTypeId_fkey` FOREIGN KEY (`expenseTypeId`) REFERENCES `ExpenseType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseTypeUser` ADD CONSTRAINT `ExpenseTypeUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
