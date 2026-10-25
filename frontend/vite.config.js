import fs from 'node:fs'
import http from 'node:http'
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
  '/news': '/news-grid.html',
  '/news-details': '/news-details.html',
  '/project-details': '/page-project-details.html',
  '/team-details': '/page-team-details.html',
  '/service-details': '/page-service-details.html',
}

function courseIsPublished(slug) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: `/api/v1/courses/${encodeURIComponent(slug)}`,
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, (upstream) => {
      upstream.resume()
      upstream.on('end', () => resolve(upstream.statusCode === 200))
    })
    req.on('error', () => resolve(null))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
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

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Content-Security-Policy-Report-Only': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function serveBixomAndAdmin() {
  return {
    name: 'serve-bixom-and-admin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        for (const [key, value] of Object.entries(securityHeaders)) res.setHeader(key, value)
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

        const courseSlug = /^\/courses\/([A-Za-z0-9_-]+)$/.exec(urlPath)
        if (courseSlug) {
          courseIsPublished(courseSlug[1]).then((published) => {
            if (res.writableEnded) return
            const missing = published === false
            const relative = missing ? '/page-404.html' : '/page-course-details.html'
            const file = path.join(rootDir, relative)
            res.statusCode = missing ? 404 : 200
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            fs.createReadStream(file).pipe(res)
          }).catch(() => {
            if (!res.writableEnded) next()
          })
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
