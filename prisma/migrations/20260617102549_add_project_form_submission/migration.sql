/*
  Warnings:

  - You are about to drop the column `status` on the `ProjectForm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ProjectForm` DROP COLUMN `status`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `template` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ProjectFormSubmission` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `projectFormId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `formData` JSON NULL,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectFormSubmission_projectId_projectFormId_key`(`projectId`, `projectFormId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectFormSubmission` ADD CONSTRAINT `ProjectFormSubmission_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFormSubmission` ADD CONSTRAINT `ProjectFormSubmission_projectFormId_fkey` FOREIGN KEY (`projectFormId`) REFERENCES `ProjectForm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
