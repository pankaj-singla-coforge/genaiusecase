const { app } = require('@azure/functions');
const path = require('path');
const fs = require('fs');

// Serve the built React SPA from Azure Function App
// All routes serve index.html (SPA routing), static assets served directly

const DIST_DIR = path.join(__dirname, '..', 'dist');

function getMimeType(ext) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.map':  'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

app.http('serveSPA', {
  methods: ['GET', 'HEAD'],
  authLevel: 'anonymous',
  route: '{*route}',
  handler: async (request, context) => {
    const url = new URL(request.url);
    let filePath = url.pathname;

    // Strip leading slash
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    if (!filePath) filePath = 'index.html';

    const fullPath = path.join(DIST_DIR, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(DIST_DIR)) {
      return { status: 403, body: 'Forbidden' };
    }

    let serveFile = fullPath;
    let contentType;
    const ext = path.extname(fullPath).toLowerCase();

    // If it's a static asset (has extension) and exists → serve it
    if (ext && ext !== '.html' && fs.existsSync(fullPath)) {
      contentType = getMimeType(ext);
    } else {
      // Fallback to index.html for SPA routing
      serveFile = path.join(DIST_DIR, 'index.html');
      contentType = 'text/html; charset=utf-8';
    }

    if (!fs.existsSync(serveFile)) {
      return { status: 404, body: 'Not Found' };
    }

    const body = fs.readFileSync(serveFile);
    const cacheControl = ext === '.html'
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000, immutable'; // cache hashed assets forever

    return {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
      body,
    };
  },
});
