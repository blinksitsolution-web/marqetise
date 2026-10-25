import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const pages = readdirSync(root).filter((name) => name.endsWith('.html') && name !== 'admin.html')

describe('remaining public findings', () => {
  it('removes the newsletter box and shows the desktop nav from the large breakpoint', () => {
    for (const name of pages) {
      const html = readFileSync(`${root}/${name}`, 'utf8')
      expect(html, name).not.toContain('Sign up to searing weekly newsletter')
      expect(html, name).not.toContain('ks-footer-newsletter-form')
      expect(html, name).toContain('d-none d-lg-block')
    }
  })

  it('sends security headers from the static host and skips motion when requested', () => {
    const server = readFileSync(`${root}/scripts/static-server.cjs`, 'utf8')
    const vite = readFileSync(`${root}/vite.config.js`, 'utf8')
    const motion = readFileSync(`${root}/js/script.js`, 'utf8')
    for (const source of [server, vite]) {
      expect(source).toContain('X-Content-Type-Options')
      expect(source).toContain('frame-ancestors')
      expect(source).toContain('Permissions-Policy')
      expect(source).not.toContain('Strict-Transport-Security')
    }
    expect(motion).toContain("prefers-reduced-motion: reduce")
  })
})
