const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function proxy(req, res) {
  const target = http.request({
    hostname: '127.0.0.1',
    port: 8000,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }, (upstream) => {
    res.writeHead(upstream.statusCode || 502, upstream.headers);
    upstream.pipe(res);
  });
  target.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('API unavailable');
  });
  req.pipe(target);
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/sanctum') || req.url.startsWith('/storage')) {
    proxy(req, res);
    return;
  }
  const url = new URL(req.url, 'http://127.0.0.1');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/privacy') pathname = '/page-privacy.html';
  if (pathname === '/terms') pathname = '/page-terms.html';
  const file = path.normalize(path.join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(5173, '127.0.0.1');
