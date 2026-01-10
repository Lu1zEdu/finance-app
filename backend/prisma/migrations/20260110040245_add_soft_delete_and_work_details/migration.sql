-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cltBenefits" DECIMAL(10,2),
ADD COLUMN     "freelanceHourlyRate" DECIMAL(10,2),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workExpenses" DECIMAL(10,2);
