// This script is used to seed the database on Railway
// It sequentially runs the main seed script and then the leaflet seed script

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting database seeding on Railway...');

try {
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