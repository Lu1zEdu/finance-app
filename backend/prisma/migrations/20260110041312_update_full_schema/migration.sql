/*
  Warnings:

  - The `cltBenefits` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
DROP COLUMN "cltBenefits",
ADD COLUMN     "cltBenefits" JSONB;
