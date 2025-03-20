// Custom server to start the Next.js application
const { createServer } = require('http');
const { join } = require('path');
const { parse } = require('url');
const next = require('next');

// Check if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 8080;

// Configuration for standalone mode in production
const standaloneDir = join(__dirname, '.next/standalone');
const publicDir = join(__dirname, '.next/static');
const staticDir = join(__dirname, 'public');

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
}); 