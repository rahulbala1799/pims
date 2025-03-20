-- Check if the table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'JobAssignment') THEN
        -- CreateTable
        CREATE TABLE "JobAssignment" (
            "id" TEXT NOT NULL,
            "jobId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE INDEX "JobAssignment_userId_idx" ON "JobAssignment"("userId");

        -- CreateIndex
        CREATE INDEX "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");

        -- CreateIndex
        CREATE UNIQUE INDEX "JobAssignment_jobId_userId_key" ON "JobAssignment"("jobId", "userId");

        -- AddForeignKey
        ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        -- AddForeignKey
        ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'JobAssignment table created successfully';
    ELSE
        RAISE NOTICE 'JobAssignment table already exists, no action taken';
    END IF;
END
$$; 