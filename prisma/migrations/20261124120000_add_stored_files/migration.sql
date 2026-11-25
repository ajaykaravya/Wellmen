-- CreateTable
-- Holds uploaded file bytes so uploads work on Vercel (no writable disk).
-- Purely additive: no existing table is touched.
CREATE TABLE `StoredFile` (
    `id` CHAR(36) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `data` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
