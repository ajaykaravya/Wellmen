-- CreateEnum
CREATE TYPE "QueryCategory" AS ENUM ('REMARKS', 'URGENCY', 'DECISION_PENDING');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "QueryManagement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" "QueryCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryManagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueryManagement_projectId_idx" ON "QueryManagement"("projectId");

-- CreateIndex
CREATE INDEX "QueryManagement_category_idx" ON "QueryManagement"("category");

-- CreateIndex
CREATE INDEX "QueryManagement_status_idx" ON "QueryManagement"("status");

-- CreateIndex
CREATE INDEX "QueryManagement_priority_idx" ON "QueryManagement"("priority");

-- CreateIndex
CREATE INDEX "QueryManagement_createdById_idx" ON "QueryManagement"("createdById");

-- AddForeignKey
ALTER TABLE "QueryManagement" ADD CONSTRAINT "QueryManagement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryManagement" ADD CONSTRAINT "QueryManagement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
