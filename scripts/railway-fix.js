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
    
    // Split the SQL into individual statements
    // Remove comments and split by semicolons
    const statements = sqlQuery
      .replace(/--.*$/gm, '') // Remove SQL comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each SQL statement separately
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      await prisma.$executeRawUnsafe(stmt);
    }
    
    console.log('All SQL statements executed successfully');
    console.log('JobAssignment table fix completed successfully!');
    
    // Disconnect from the database
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fixing JobAssignment table:', error);
    console.error('Failed statement:', error.meta?.statement || 'Unknown');
    
    // Disconnect from the database
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the fix
fixJobAssignmentTable(); 