-- CreateTable
CREATE TABLE "BoleroDeliveryLog" (
    "id" TEXT NOT NULL,
    "tripDate" TIMESTAMP(3) NOT NULL,
    "tripDescription" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "city" TEXT,
    "floor" TEXT NOT NULL,
    "kmStart" DECIMAL(10,2) NOT NULL,
    "kmEnd" DECIMAL(10,2) NOT NULL,
    "totalKm" DECIMAL(10,2) NOT NULL,
    "loadType" TEXT NOT NULL,
    "driverWages" DECIMAL(14,2) NOT NULL,
    "otherExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "floorRent" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "dcNumber" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoleroDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoleroDeliveryLog_tripDate_idx" ON "BoleroDeliveryLog"("tripDate");

-- CreateIndex
CREATE INDEX "BoleroDeliveryLog_locationType_idx" ON "BoleroDeliveryLog"("locationType");

-- CreateIndex
CREATE INDEX "BoleroDeliveryLog_floor_idx" ON "BoleroDeliveryLog"("floor");

-- CreateIndex
CREATE INDEX "BoleroDeliveryLog_loadType_idx" ON "BoleroDeliveryLog"("loadType");

-- CreateIndex
CREATE INDEX "BoleroDeliveryLog_city_idx" ON "BoleroDeliveryLog"("city");
