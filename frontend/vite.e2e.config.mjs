import base from './vite.config.js'

const proxy = { target: process.env.MARQ_API_PROXY || 'http://127.0.0.1:8041', changeOrigin: false }

export default {
  ...base,
  server: {
    ...base.server,
    host: '127.0.0.1',
    port: Number(process.env.MARQ_DEV_PORT || 5211),
    strictPort: true,
    proxy: {
      '/api': proxy,
      '/sanctum': proxy,
      '/storage': proxy,
      '/media': proxy,
      '/sitemap.xml': proxy,
      '/robots.txt': proxy,
    },
  },
}
