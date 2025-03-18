// This script is used to seed the database on Railway
// It sequentially runs the main seed script and then the leaflet seed script

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting database seeding process on Railway...');

// Check if schema.prisma exists
const schemaPath = path.join(__dirname, 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('Found schema at:', schemaPath);
} else {
  console.log('Schema not found at:', schemaPath);
}

try {
  // Generate Prisma client first
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run the main seed script (users, example products)
  console.log('\n=== Running main seed script ===');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  
  // Run the leaflet seed script
  console.log('\n=== Running leaflet and brochure seed script ===');
  execSync('node prisma/leaflet-seed.js', { stdio: 'inherit' });
  
  // Run the pizza boxes seed script
  console.log('\n=== Running pizza boxes seed script ===');
  execSync('node prisma/pizza-boxes-seed.js', { stdio: 'inherit' });
  
  console.log('\nAll seed scripts completed successfully!');
} catch (error) {
  console.error('Error during seeding:', error.message);
  process.exit(1);
} 