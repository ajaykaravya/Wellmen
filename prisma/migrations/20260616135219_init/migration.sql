-- CreateTable
CREATE TABLE `Todo` (
    `id` CHAR(36) NOT NULL,
    `description` VARCHAR(191) NULL,
    `comments` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `completedDate` DATETIME(3) NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED') NOT NULL DEFAULT 'TODO',
    `projectId` CHAR(36) NULL,
    `assigneeId` CHAR(36) NULL,
    `type` ENUM('PROJECT', 'OFFICE', 'SERVICE') NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `subCategory` VARCHAR(191) NULL,
    `createdById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Todo_type_idx`(`type`),
    INDEX `Todo_priority_idx`(`priority`),
    INDEX `Todo_categoryId_idx`(`categoryId`),
    INDEX `Todo_projectId_idx`(`projectId`),
    INDEX `Todo_completedDate_idx`(`completedDate`),
    INDEX `Todo_assigneeId_fkey`(`assigneeId`),
    INDEX `Todo_createdById_fkey`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PENDING',
    `createdById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_createdById_fkey`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyReport` (
    `id` CHAR(36) NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `categoryId` CHAR(36) NULL,
    `description` VARCHAR(191) NOT NULL,
    `imageUrls` JSON NULL,
    `videoUrls` JSON NULL,
    `createdById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DailyReport_createdById_reportDate_idx`(`createdById`, `reportDate`),
    INDEX `DailyReport_projectId_reportDate_idx`(`projectId`, `reportDate`),
    INDEX `DailyReport_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Company_name_key`(`name`),
    UNIQUE INDEX `Company_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` CHAR(36) NOT NULL,
    `permissionId` CHAR(36) NOT NULL,

    INDEX `RolePermission_permissionId_fkey`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categories` (
    `id` CHAR(36) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Categories_category_name_key`(`category`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpenseType` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExpenseType_name_key`(`name`),
    INDEX `ExpenseType_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IncomeType` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IncomeType_name_key`(`name`),
    INDEX `IncomeType_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceTransaction` (
    `id` CHAR(36) NOT NULL,
    `transactionType` ENUM('INCOME', 'EXPENSE') NOT NULL DEFAULT 'EXPENSE',
    `amount` DECIMAL(14, 2) NOT NULL,
    `expenseTypeId` CHAR(36) NULL,
    `expenseById` CHAR(36) NULL,
    `expenseCompanyId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CHEQUE', 'UPI', 'NEFT_RTGS') NULL,
    `date` DATETIME(3) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceTransaction_transactionType_idx`(`transactionType`),
    INDEX `FinanceTransaction_date_idx`(`date`),
    INDEX `FinanceTransaction_expenseTypeId_idx`(`expenseTypeId`),
    INDEX `FinanceTransaction_expenseById_idx`(`expenseById`),
    INDEX `FinanceTransaction_expenseCompanyId_idx`(`expenseCompanyId`),
    INDEX `FinanceTransaction_projectId_idx`(`projectId`),
    INDEX `FinanceTransaction_paymentMode_idx`(`paymentMode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PetiCash` (
    `id` CHAR(36) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `transactionType` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `givenById` CHAR(36) NULL,
    `givenToId` CHAR(36) NULL,
    `companyId` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `expenseTypeId` CHAR(36) NULL,
    `date` DATETIME(3) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PetiCash_transactionType_idx`(`transactionType`),
    INDEX `PetiCash_date_idx`(`date`),
    INDEX `PetiCash_givenById_idx`(`givenById`),
    INDEX `PetiCash_givenToId_idx`(`givenToId`),
    INDEX `PetiCash_companyId_idx`(`companyId`),
    INDEX `PetiCash_projectId_idx`(`projectId`),
    INDEX `PetiCash_expenseTypeId_idx`(`expenseTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IncomeTransaction` (
    `id` CHAR(36) NOT NULL,
    `transactionType` ENUM('INCOME', 'EXPENSE') NOT NULL DEFAULT 'INCOME',
    `amount` DECIMAL(14, 2) NOT NULL,
    `incomeTypeId` CHAR(36) NULL,
    `incomeCompanyId` CHAR(36) NULL,
    `receivedById` CHAR(36) NULL,
    `projectId` CHAR(36) NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CHEQUE', 'UPI', 'NEFT_RTGS') NULL,
    `date` DATETIME(3) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `IncomeTransaction_transactionType_idx`(`transactionType`),
    INDEX `IncomeTransaction_date_idx`(`date`),
    INDEX `IncomeTransaction_incomeTypeId_idx`(`incomeTypeId`),
    INDEX `IncomeTransaction_incomeCompanyId_idx`(`incomeCompanyId`),
    INDEX `IncomeTransaction_receivedById_idx`(`receivedById`),
    INDEX `IncomeTransaction_projectId_idx`(`projectId`),
    INDEX `IncomeTransaction_paymentMode_idx`(`paymentMode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportLog` (
    `id` CHAR(36) NOT NULL,
    `serialNo` INTEGER NOT NULL,
    `transportType` ENUM('BOLERO_DELIVERY', 'BOLERO_RETURN_DC', 'COURIER_DAILY', 'PORTER_DAILY', 'CNG_RICKSHAW', 'LOADING_VEHICLE') NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `locationType` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `kmStart` INTEGER NOT NULL DEFAULT 0,
    `kmEnd` INTEGER NOT NULL DEFAULT 0,
    `totalKm` INTEGER NOT NULL DEFAULT 0,
    `loadType` VARCHAR(191) NULL,
    `driverWages` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `otherExpenses` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `floorRent` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `returnMaterialFreight` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `fromLocation` VARCHAR(191) NULL,
    `toLocation` VARCHAR(191) NULL,
    `mobileNumber` VARCHAR(191) NULL,
    `noOfCovers` INTEGER NOT NULL DEFAULT 0,
    `totalWeight` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `weightCharge` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `coverCharge` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `vehicleNumber` VARCHAR(191) NULL,
    `baseAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `gstAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `tripType` VARCHAR(191) NULL,
    `tripCharge` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `vehicleType` VARCHAR(191) NULL,
    `loadingCharges` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `returnMaterialCharges` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `transportCharges` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `paymentMode` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransportLog_transportType_idx`(`transportType`),
    INDEX `TransportLog_date_idx`(`date`),
    INDEX `TransportLog_status_idx`(`status`),
    INDEX `TransportLog_paymentMode_idx`(`paymentMode`),
    INDEX `TransportLog_createdById_idx`(`createdById`),
    UNIQUE INDEX `TransportLog_transportType_serialNo_key`(`transportType`, `serialNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportConfig` (
    `id` CHAR(36) NOT NULL,
    `transportType` ENUM('BOLERO_DELIVERY', 'BOLERO_RETURN_DC', 'COURIER_DAILY', 'PORTER_DAILY', 'CNG_RICKSHAW', 'LOADING_VEHICLE') NOT NULL,
    `configType` ENUM('DRIVER_WAGE_SLAB', 'FLOOR_RENT', 'COURIER_WEIGHT_RATE', 'COURIER_COVER_RATE', 'CNG_TRIP_SLAB') NOT NULL,
    `configKey` VARCHAR(191) NOT NULL,
    `configData` JSON NOT NULL,
    `floor` VARCHAR(191) NULL,
    `loadType` VARCHAR(191) NULL,
    `tripType` VARCHAR(191) NULL,
    `minKm` INTEGER NULL,
    `maxKm` INTEGER NULL,
    `rate` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransportConfig_transportType_configType_idx`(`transportType`, `configType`),
    INDEX `TransportConfig_isActive_idx`(`isActive`),
    UNIQUE INDEX `TransportConfig_transportType_configType_configKey_key`(`transportType`, `configType`, `configKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QueryManagement` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `category` ENUM('REMARKS', 'URGENCY', 'DECISION_PENDING') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    `imageUrls` JSON NULL,
    `videoUrls` JSON NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QueryManagement_projectId_idx`(`projectId`),
    INDEX `QueryManagement_category_idx`(`category`),
    INDEX `QueryManagement_status_idx`(`status`),
    INDEX `QueryManagement_priority_idx`(`priority`),
    INDEX `QueryManagement_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceToken` (
    `id` CHAR(36) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NULL,
    `deviceId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeviceToken_token_key`(`token`),
    INDEX `DeviceToken_userId_idx`(`userId`),
    INDEX `DeviceToken_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectForm` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `ProjectForm_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fullName` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `username` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_mobileNumber_key`(`mobileNumber`),
    INDEX `User_roleId_fkey`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceTransaction` ADD CONSTRAINT `FinanceTransaction_expenseById_fkey` FOREIGN KEY (`expenseById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceTransaction` ADD CONSTRAINT `FinanceTransaction_expenseCompanyId_fkey` FOREIGN KEY (`expenseCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceTransaction` ADD CONSTRAINT `FinanceTransaction_expenseTypeId_fkey` FOREIGN KEY (`expenseTypeId`) REFERENCES `ExpenseType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceTransaction` ADD CONSTRAINT `FinanceTransaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetiCash` ADD CONSTRAINT `PetiCash_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetiCash` ADD CONSTRAINT `PetiCash_expenseTypeId_fkey` FOREIGN KEY (`expenseTypeId`) REFERENCES `ExpenseType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetiCash` ADD CONSTRAINT `PetiCash_givenById_fkey` FOREIGN KEY (`givenById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetiCash` ADD CONSTRAINT `PetiCash_givenToId_fkey` FOREIGN KEY (`givenToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PetiCash` ADD CONSTRAINT `PetiCash_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IncomeTransaction` ADD CONSTRAINT `IncomeTransaction_incomeCompanyId_fkey` FOREIGN KEY (`incomeCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IncomeTransaction` ADD CONSTRAINT `IncomeTransaction_incomeTypeId_fkey` FOREIGN KEY (`incomeTypeId`) REFERENCES `IncomeType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IncomeTransaction` ADD CONSTRAINT `IncomeTransaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IncomeTransaction` ADD CONSTRAINT `IncomeTransaction_receivedById_fkey` FOREIGN KEY (`receivedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportLog` ADD CONSTRAINT `TransportLog_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueryManagement` ADD CONSTRAINT `QueryManagement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueryManagement` ADD CONSTRAINT `QueryManagement_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceToken` ADD CONSTRAINT `DeviceToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
