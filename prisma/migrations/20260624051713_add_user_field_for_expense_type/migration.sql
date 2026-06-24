-- AlterTable
ALTER TABLE `ExpenseType` ADD COLUMN `userId` CHAR(36) NULL;

-- CreateIndex
CREATE INDEX `ExpenseType_userId_fkey` ON `ExpenseType`(`userId`);

-- AddForeignKey
ALTER TABLE `ExpenseType` ADD CONSTRAINT `ExpenseType_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
