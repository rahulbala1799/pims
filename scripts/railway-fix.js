// Simple script to execute SQL and fix JobAssignment table in Railway
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
const prisma = new PrismaClient();

async function fixJobAssignmentTable() {
  try {
    console.log('Starting to fix JobAssignment table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'railway-fix.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL directly with Prisma
    console.log('Executing SQL to create JobAssignment table...');
    
    // Use the $executeRawUnsafe method to execute the SQL
    await prisma.$executeRawUnsafe(sqlQuery);
    
    console.log('SQL executed successfully');
    console.log('JobAssignment table fix completed successfully!');
    
    // Disconnect from the database
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fixing JobAssignment table:', error);
    
    // Disconnect from the database
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the fix
fixJobAssignmentTable(); 