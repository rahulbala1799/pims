-- Add isPaid column to HourLog table
ALTER TABLE "HourLog" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false; 