// This file is used when deploying to environments like Railway
// It loads the appropriate Next.js server file based on the environment

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if we're in production
const isProd = process.env.NODE_ENV === 'production';

// Path to Next.js standalone server (created by next build)
const standalonePath = path.join(__dirname, '.next/standalone/server.js');

// Check if .next/standalone exists
if (isProd && fs.existsSync(standalonePath)) {
  console.log('Starting Next.js standalone server...');
  require(standalonePath);
} else {
  console.log('Starting Next.js dev server...');
  // For development or when standalone doesn't exist, run the dev server
  exec('npx next start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting Next.js: ${error}`);
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
} 