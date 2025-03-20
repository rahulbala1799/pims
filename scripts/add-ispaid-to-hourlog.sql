-- Add isPaid column to HourLog table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='HourLog' AND column_name='isPaid') THEN
    ALTER TABLE "HourLog" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$; 