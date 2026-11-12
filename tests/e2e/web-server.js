// tests/e2e/web-server.js
// Serves the Expo Web export (dist/) plus a throttled binary video stream endpoint for Playwright E2E tests.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', '..', 'dist');
const PORT = Number(process.env.E2E_PORT || 4173);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Real chunked HTTP video stream endpoint for testing live speed, %, downloaded MB, remaining MB, pause/resume/cancel
  if (pathname === '/e2e-media/sample-video.mp4') {
    const isSlow = urlObj.searchParams.get('slow') === '1';
    const totalBytes = isSlow ? 6 * 1024 * 1024 : 3 * 1024 * 1024;
    const chunkSize = isSlow ? 128 * 1024 : 256 * 1024;
    const intervalMs = isSlow ? 160 : 90;

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': String(totalBytes),
      'Cache-Control': 'no-store',
    });

    let sent = 0;
    const chunkBuf = Buffer.alloc(chunkSize, 0x42);

    const timer = setInterval(() => {
      if (res.destroyed || req.destroyed) {
        clearInterval(timer);
        return;
      }

      const remaining = totalBytes - sent;
      if (remaining <= 0) {
        clearInterval(timer);
        res.end();
        return;
      }

      const toWrite = remaining < chunkSize ? chunkBuf.subarray(0, remaining) : chunkBuf;
      sent += toWrite.length;
      res.write(toWrite);
      if (sent >= totalBytes) {
        clearInterval(timer);
        res.end();
      }
    }, intervalMs);

    req.on('close', () => clearInterval(timer));
    return;
  }

  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`E2E static + stream server listening at http://127.0.0.1:${PORT}`);
});

