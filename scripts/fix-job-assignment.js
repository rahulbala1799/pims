// Script to apply JobAssignment table fix
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Applying JobAssignment table fix...');

// Get the SQL file path
const sqlFilePath = path.resolve(__dirname, 'create-job-assignment-table.sql');

try {
  // Run the SQL script
  console.log('Executing SQL script...');
  const result = execSync(`cd .. && npx prisma db execute --file ./scripts/create-job-assignment-table.sql`);
  console.log('SQL script executed successfully');
  console.log(result.toString());

  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('cd .. && npx prisma generate');
  console.log('Prisma client generated successfully');
  
  console.log('JobAssignment table fix applied successfully!');
} catch (error) {
  console.error('Error applying JobAssignment table fix:', error.message);
  process.exit(1);
} 