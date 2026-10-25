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
  const requestPath = req.url.split('?')[0];
  if (
    requestPath.startsWith('/api')
    || requestPath.startsWith('/sanctum')
    || requestPath.startsWith('/storage')
    || requestPath === '/sitemap.xml'
    || requestPath === '/robots.txt'
  ) {
    proxy(req, res);
    return;
  }
  const url = new URL(req.url, 'http://127.0.0.1');
  let pathname = decodeURIComponent(url.pathname);
  const pretty = {
    '/': '/index.html',
    '/about': '/page-about.html',
    '/services': '/page-services.html',
    '/courses': '/page-courses.html',
    '/contact': '/page-contact.html',
    '/book': '/page-book.html',
    '/privacy': '/page-privacy.html',
    '/terms': '/page-terms.html',
  };
  if (pretty[pathname]) {
    pathname = pretty[pathname];
  } else if (/^\/courses\/[A-Za-z0-9_-]+$/.test(pathname)) {
    pathname = '/page-course-details.html';
  } else {
    const page = pathname.match(/^\/([a-z0-9-]+)$/);
    if (page) {
      const candidate = '/page-' + page[1] + '.html';
      const candidateFile = path.normalize(path.join(root, candidate));
      if (candidateFile.startsWith(root) && fs.existsSync(candidateFile)) pathname = candidate;
    }
  }
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
