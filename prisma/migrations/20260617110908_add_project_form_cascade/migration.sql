-- DropForeignKey
ALTER TABLE `ProjectFormSubmission` DROP FOREIGN KEY `ProjectFormSubmission_projectFormId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectFormSubmission` DROP FOREIGN KEY `ProjectFormSubmission_projectId_fkey`;

-- DropIndex
DROP INDEX `ProjectFormSubmission_projectFormId_fkey` ON `ProjectFormSubmission`;

-- AddForeignKey
ALTER TABLE `ProjectFormSubmission` ADD CONSTRAINT `ProjectFormSubmission_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFormSubmission` ADD CONSTRAINT `ProjectFormSubmission_projectFormId_fkey` FOREIGN KEY (`projectFormId`) REFERENCES `ProjectForm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
