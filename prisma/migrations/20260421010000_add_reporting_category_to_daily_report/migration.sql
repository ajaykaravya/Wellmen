-- AlterTable
ALTER TABLE "DailyReport"
ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DailyReport_categoryId_idx" ON "DailyReport"("categoryId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'DailyReport_categoryId_fkey'
    ) THEN
        ALTER TABLE "DailyReport"
        ADD CONSTRAINT "DailyReport_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "Categories"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
