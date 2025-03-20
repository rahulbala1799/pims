const { exec } = require('child_process');
const path = require('path');

console.log('Creating and applying JobAssignment table migration...');

// Get database URL from environment
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// SQL to create JobAssignment table
const createTableSQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobAssignment_userId_idx" ON "JobAssignment"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JobAssignment_jobId_userId_key" ON "JobAssignment"("jobId", "userId");

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

// Export the SQL to a file
const fs = require('fs');
const sqlFilePath = path.resolve(__dirname, 'create-job-assignment.sql');
fs.writeFileSync(sqlFilePath, createTableSQL);

// Execute the SQL with psql
const { parse } = require('pg-connection-string');
const dbConfig = parse(databaseUrl);

const psqlCommand = `
  PGPASSWORD="${dbConfig.password}" psql \
  -h ${dbConfig.host} \
  -p ${dbConfig.port || 5432} \
  -U ${dbConfig.user} \
  -d ${dbConfig.database} \
  -f ${sqlFilePath}
`;

console.log('Applying migration...');
exec(psqlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error applying migration: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`Migration applied successfully: ${stdout}`);
  
  // Clean up the SQL file
  fs.unlinkSync(sqlFilePath);
  
  // Update the Prisma client
  console.log('Generating Prisma client...');
  exec('npx prisma generate', (genError, genStdout, genStderr) => {
    if (genError) {
      console.error(`Error generating Prisma client: ${genError.message}`);
      return;
    }
    if (genStderr) {
      console.error(`stderr: ${genStderr}`);
      return;
    }
    console.log(`Prisma client generated successfully: ${genStdout}`);
  });
}); 