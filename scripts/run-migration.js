const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Starting migration to add isPaid field to HourLog...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-ispaid-to-hourlog.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('Executing SQL:', sql);
    await prisma.$executeRawUnsafe(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration(); 