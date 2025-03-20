-- Create JobAssignment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "JobAssignment_userId_idx" ON "JobAssignment"("userId");
CREATE INDEX IF NOT EXISTS "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");
CREATE UNIQUE INDEX IF NOT EXISTS "JobAssignment_jobId_userId_key" ON "JobAssignment"("jobId", "userId");

-- Check if foreign key constraint exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'JobAssignment_jobId_fkey'
    ) THEN
        ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" 
        FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Check if foreign key constraint exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'JobAssignment_userId_fkey'
    ) THEN
        ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$; 