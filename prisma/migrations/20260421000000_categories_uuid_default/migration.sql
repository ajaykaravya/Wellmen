-- UUID-shaped generator that does not depend on database extensions
-- It keeps the column values compatible with the existing text schema.
-- Example: 550e8400-e29b-41d4-a716-446655440000
-- Prisma can still use @default(uuid()) at the schema level.
-- The SQL below is only for the one-time backfill and database default.
-- We intentionally avoid pgcrypto here because shadow databases may not allow extensions.
--
-- Using md5(random() + timestamp) gives us a sufficiently unique value for category ids.
-- This is not a UUID type, but it is UUID-shaped text, which matches the current schema.
--
-- Repeated inline to avoid creating helper functions in the migration.
-- The expression is deterministic enough for this use case.
--
-- NOTE: keep the expression in sync between the default and the backfill update.
--
--
-- text UUID expression:
--   substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
--   substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-' ||
--   substr(md5(random()::text || clock_timestamp()::text), 13, 4) || '-' ||
--   substr(md5(random()::text || clock_timestamp()::text), 17, 4) || '-' ||
--   substr(md5(random()::text || clock_timestamp()::text), 21, 12)
--
-- We keep the expression compact in the SQL statements below.

-- Give new categories a UUID id by default
ALTER TABLE "Categories"
  ALTER COLUMN "id" SET DEFAULT (
    substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 13, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 17, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 21, 12)
  );

-- Ensure Todo has the categoryId column expected by the current schema
ALTER TABLE "Todo"
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Keep the supporting index and foreign key in sync with the Prisma schema
CREATE INDEX IF NOT EXISTS "Todo_categoryId_idx" ON "Todo"("categoryId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Todo_categoryId_fkey'
    ) THEN
        ALTER TABLE "Todo"
        ADD CONSTRAINT "Todo_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "Categories"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Backfill existing category ids with UUIDs. The FK cascade updates todos.
UPDATE "Categories"
SET "id" = (
  substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
  substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-' ||
  substr(md5(random()::text || clock_timestamp()::text), 13, 4) || '-' ||
  substr(md5(random()::text || clock_timestamp()::text), 17, 4) || '-' ||
  substr(md5(random()::text || clock_timestamp()::text), 21, 12)
);
