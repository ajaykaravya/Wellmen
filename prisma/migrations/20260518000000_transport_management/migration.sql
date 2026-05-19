CREATE TYPE "TransportType" AS ENUM (
    'BOLERO_DELIVERY',
    'BOLERO_RETURN_DC',
    'COURIER_DAILY',
    'PORTER_DAILY',
    'CNG_RICKSHAW',
    'LOADING_VEHICLE'
);

CREATE TABLE "TransportLog" (
    "id" TEXT NOT NULL,
    "serialNo" INTEGER NOT NULL,
    "transportType" "TransportType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dcNumber" TEXT,
    "tripDescription" TEXT,
    "locationType" TEXT,
    "city" TEXT,
    "floor" TEXT,
    "kmStart" INTEGER NOT NULL DEFAULT 0,
    "kmEnd" INTEGER NOT NULL DEFAULT 0,
    "totalKm" INTEGER NOT NULL DEFAULT 0,
    "loadType" TEXT,
    "driverWages" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "floorRent" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "returnMaterialFreight" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "courierNumber" TEXT,
    "description" TEXT,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "mobileNumber" TEXT,
    "noOfCovers" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "weightCharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "coverCharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "materialDescription" TEXT,
    "vehicleNumber" TEXT,
    "baseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tripType" TEXT,
    "tripCharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vehicleType" TEXT,
    "loadingCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "returnMaterialCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "transportCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentMode" TEXT,
    "status" TEXT,
    "remark" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransportLog_transportType_serialNo_key" ON "TransportLog"("transportType", "serialNo");
CREATE INDEX "TransportLog_transportType_idx" ON "TransportLog"("transportType");
CREATE INDEX "TransportLog_date_idx" ON "TransportLog"("date");
CREATE INDEX "TransportLog_status_idx" ON "TransportLog"("status");
CREATE INDEX "TransportLog_paymentMode_idx" ON "TransportLog"("paymentMode");
CREATE INDEX "TransportLog_createdById_idx" ON "TransportLog"("createdById");

ALTER TABLE "TransportLog"
ADD CONSTRAINT "TransportLog_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
