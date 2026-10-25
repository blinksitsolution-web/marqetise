import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
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
  '.map': 'application/json',
}

function isViteInternal(urlPath) {
  return (
    urlPath.startsWith('/@')
    || urlPath.startsWith('/src/')
    || urlPath.startsWith('/node_modules/')
    || urlPath.startsWith('/brand/')
    || urlPath === '/admin.html'
  )
}

const prettyPages = {
  '/about': '/page-about.html',
  '/services': '/page-services.html',
  '/courses': '/page-courses.html',
  '/contact': '/page-contact.html',
  '/book': '/page-book.html',
  '/privacy': '/page-privacy.html',
  '/terms': '/page-terms.html',
}

function publicHtml(urlPath) {
  if (prettyPages[urlPath]) return prettyPages[urlPath]
  if (/^\/courses\/[A-Za-z0-9_-]+$/.test(urlPath)) return '/page-course-details.html'
  const page = /^\/([a-z0-9-]+)$/.exec(urlPath)
  if (page) {
    const candidate = `/page-${page[1]}.html`
    const file = path.normalize(path.join(rootDir, candidate))
    if (file.startsWith(rootDir) && fs.existsSync(file)) return candidate
  }
  return urlPath === '/' ? '/index.html' : urlPath
}

function serveBixomAndAdmin() {
  return {
    name: 'serve-bixom-and-admin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url || '/'
        const urlPath = decodeURIComponent(raw.split('?')[0] || '/')
        const query = raw.includes('?') ? raw.slice(raw.indexOf('?')) : ''

        if (
          urlPath.startsWith('/api')
          || urlPath.startsWith('/sanctum')
          || urlPath.startsWith('/storage')
          || urlPath === '/sitemap.xml'
          || urlPath === '/robots.txt'
          || isViteInternal(urlPath)
        ) {
          next()
          return
        }

        if (urlPath === '/admin' || urlPath.startsWith('/admin/')) {
          req.url = `/admin.html${query}`
          next()
          return
        }

        const relative = publicHtml(urlPath)
        const file = path.normalize(path.join(rootDir, relative))
        if (!file.startsWith(rootDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          next()
          return
        }

        const ext = path.extname(file).toLowerCase()
        res.statusCode = 200
        res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveBixomAndAdmin()],
  appType: 'mpa',
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        admin: path.resolve(rootDir, 'admin.html'),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/sanctum': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/storage': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/sitemap.xml': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/robots.txt': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
