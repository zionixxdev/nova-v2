/* Tiny zero-dependency static server for the built Nova PWA.
   Used on hosts that expect a Node "start" command (e.g. Render web services).
   Serves ./dist with SPA fallback so client-side routes resolve correctly. */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 10000;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  let filePath = path.normalize(path.join(DIST, urlPath));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let stat = null;
  try {
    stat = fs.statSync(filePath);
  } catch {
    /* fall through to SPA fallback */
  }
  if (stat && stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    try {
      stat = fs.statSync(filePath);
    } catch {
      stat = null;
    }
  }
  if (!stat) {
    // SPA fallback: serve index.html for unknown paths
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const isSW = urlPath === '/sw.js' || urlPath.startsWith('/workbox-');
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': isSW
      ? 'no-cache' // service worker must not be cached long
      : ext === '.html'
        ? 'no-cache'
        : 'public, max-age=31536000, immutable', // hashed asset filenames
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Nova serving ${DIST} on port ${PORT}`);
});
