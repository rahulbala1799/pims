/*
  Warnings:

  - You are about to drop the column `laborCost` on the `JobMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `overheadCost` on the `JobMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `totalCost` on the `JobMetrics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobMetrics" DROP COLUMN "laborCost",
DROP COLUMN "overheadCost",
DROP COLUMN "totalCost";
