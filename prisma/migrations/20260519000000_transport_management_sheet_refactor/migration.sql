ALTER TABLE "TransportLog"
ADD COLUMN "referenceNumber" TEXT;

UPDATE "TransportLog"
SET
  "referenceNumber" = COALESCE("referenceNumber", "dcNumber", "courierNumber"),
  "description" = COALESCE("description", "tripDescription", "materialDescription");

ALTER TABLE "TransportLog"
DROP COLUMN IF EXISTS "dcNumber",
DROP COLUMN IF EXISTS "tripDescription",
DROP COLUMN IF EXISTS "courierNumber",
DROP COLUMN IF EXISTS "materialDescription";
