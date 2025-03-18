// This script is used to seed the database on Railway
// It sequentially runs the main seed script and then the leaflet seed script

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting database seeding on Railway...');

// Verify schema exists
const schemaPath = path.join(__dirname, 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log(`Schema found at: ${schemaPath}`);
} else {
  console.error(`Schema not found at: ${schemaPath}`);
  process.exit(1);
}

try {
  // Generate Prisma client first
  console.log('Generating Prisma client...');
  execSync('npx prisma generate --schema=./prisma/schema.prisma', { stdio: 'inherit' });
  
  // Run the main seed script first
  console.log('Running main seed script...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  
  // Then run the leaflet seed script
  console.log('Running leaflet seed script...');
  execSync('node prisma/leaflet-seed.js', { stdio: 'inherit' });
  
  console.log('Database seeding completed successfully!');
} catch (error) {
  console.error('Error during database seeding:', error);
  process.exit(1);
} 