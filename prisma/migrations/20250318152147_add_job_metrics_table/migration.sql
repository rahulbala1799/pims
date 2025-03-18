-- CreateTable
CREATE TABLE "JobMetrics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "materialCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "inkCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overheadCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grossProfit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobMetrics_jobId_key" ON "JobMetrics"("jobId");

-- AddForeignKey
ALTER TABLE "JobMetrics" ADD CONSTRAINT "JobMetrics_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
