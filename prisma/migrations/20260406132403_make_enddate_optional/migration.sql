/*
  Warnings:

  - You are about to drop the column `pin` on the `User` table. All the data in the column will be lost.
  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobileNumber` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_pin_key";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "endDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pin",
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "mobileNumber" SET NOT NULL;
