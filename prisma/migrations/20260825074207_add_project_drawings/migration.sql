-- CreateTable
CREATE TABLE `DrawingCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DrawingCategory_name_key`(`name`),
    INDEX `DrawingCategory_isActive_idx`(`isActive`),
    INDEX `DrawingCategory_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectDrawing` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `drawingCategoryId` CHAR(36) NOT NULL,
    `fileType` ENUM('PDF', 'PPT', 'IMAGE', 'AUTOCAD') NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `uploadedById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectDrawing_projectId_idx`(`projectId`),
    INDEX `ProjectDrawing_drawingCategoryId_idx`(`drawingCategoryId`),
    INDEX `ProjectDrawing_fileType_idx`(`fileType`),
    INDEX `ProjectDrawing_uploadedById_fkey`(`uploadedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectDrawing` ADD CONSTRAINT `ProjectDrawing_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDrawing` ADD CONSTRAINT `ProjectDrawing_drawingCategoryId_fkey` FOREIGN KEY (`drawingCategoryId`) REFERENCES `DrawingCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDrawing` ADD CONSTRAINT `ProjectDrawing_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
