-- CreateTable
CREATE TABLE "TransportConfig" (
    "id" TEXT NOT NULL,
    "transportType" "TransportType" NOT NULL,
    "configKey" TEXT NOT NULL,
    "configData" JSONB NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportConfig_transportType_idx" ON "TransportConfig"("transportType");

-- CreateIndex
CREATE INDEX "TransportConfig_isActive_idx" ON "TransportConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TransportConfig_transportType_configKey_key" ON "TransportConfig"("transportType", "configKey");
