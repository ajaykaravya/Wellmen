-- CreateEnum
CREATE TYPE "TransportConfigType" AS ENUM (
    'DRIVER_WAGE_SLAB',
    'FLOOR_RENT',
    'COURIER_WEIGHT_RATE',
    'COURIER_COVER_RATE',
    'CNG_TRIP_SLAB'
);

-- AlterTable
ALTER TABLE "TransportConfig"
ADD COLUMN "configType" "TransportConfigType" NOT NULL DEFAULT 'FLOOR_RENT',
ADD COLUMN "floor" TEXT,
ADD COLUMN "loadType" TEXT,
ADD COLUMN "tripType" TEXT,
ADD COLUMN "minKm" INTEGER,
ADD COLUMN "maxKm" INTEGER;

-- Backfill new columns from existing config data
UPDATE "TransportConfig"
SET
  "floor" = COALESCE("floor", "configData"->>'floor'),
  "loadType" = COALESCE("loadType", "configData"->>'loadType'),
  "tripType" = COALESCE("tripType", "configData"->>'tripType'),
  "minKm" = COALESCE("minKm", NULLIF("configData"->>'minKm', '')::INTEGER),
  "maxKm" = COALESCE("maxKm", NULLIF("configData"->>'maxKm', '')::INTEGER)
WHERE TRUE;

-- Indexes
DROP INDEX IF EXISTS "TransportConfig_transportType_configKey_key";
DROP INDEX IF EXISTS "TransportConfig_transportType_idx";

CREATE UNIQUE INDEX "TransportConfig_transportType_configType_configKey_key"
ON "TransportConfig"("transportType", "configType", "configKey");

CREATE INDEX "TransportConfig_transportType_configType_idx"
ON "TransportConfig"("transportType", "configType");

ALTER TABLE "TransportConfig"
ALTER COLUMN "configType" DROP DEFAULT;
