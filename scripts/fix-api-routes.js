const fs = require('fs');
const path = require('path');

// Root directory of the API routes
const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

// Dynamic export flags to add at the beginning of files
const DYNAMIC_EXPORTS = `
// Prevent static generation for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
`;

// Function to recursively process all route.ts files in the API directory
function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(itemPath);
    } else if (item === 'route.ts' || item === 'route.js') {
      // Process route files
      addDynamicExportsToFile(itemPath);
    }
  }
}

// Function to add dynamic exports to a file if they don't already exist
function addDynamicExportsToFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  // Read the file contents
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if dynamic exports already exist
  if (content.includes('export const dynamic =') || 
      content.includes('export const fetchCache =') || 
      content.includes('export const revalidate =')) {
    console.log(`  - Already has dynamic exports, skipping`);
    return;
  }
  
  // Find the right position to insert exports (after imports but before functions)
  const importLines = content.match(/^import.*$/gm) || [];
  let lastImportIndex = -1;
  
  for (const importLine of importLines) {
    const index = content.indexOf(importLine) + importLine.length;
    lastImportIndex = Math.max(lastImportIndex, index);
  }
  
  if (lastImportIndex >= 0) {
    // Insert after the last import statement
    content = 
      content.substring(0, lastImportIndex) + 
      '\n' + DYNAMIC_EXPORTS +
      content.substring(lastImportIndex);
  } else {
    // No imports found, insert at the beginning of the file
    content = DYNAMIC_EXPORTS + content;
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  - Added dynamic exports successfully`);
}

// Start processing from the API directory
console.log('Starting to process API routes...');
processDirectory(API_DIR);
console.log('Finished processing API routes!'); 