-- Add hourlyWage column to User table with default value of 12
ALTER TABLE "User" ADD COLUMN "hourlyWage" DECIMAL(10,2) DEFAULT 12.00; 