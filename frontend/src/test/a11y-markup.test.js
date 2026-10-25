import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const pages = readdirSync(root).filter((name) => name.endsWith('.html'))

describe('public and admin markup accessibility', () => {
  it('allows pinch zoom and names the menu controls', () => {
    for (const name of pages) {
      const html = readFileSync(`${root}/${name}`, 'utf8')
      expect(html, name).not.toMatch(/user-scalable\s*=\s*["']?0/i)
      expect(html, name).not.toMatch(/maximum-scale/i)
      expect(html, name).toMatch(/name=["']viewport["'][^>]*content=["']width=device-width,\s*initial-scale=1\.0["']/i)
    }

    const home = readFileSync(`${root}/index.html`, 'utf8')
    expect(home).toContain('aria-label="Open menu"')
    expect(home).toContain('aria-label="Close menu"')
    expect(home).toContain('<button type="button" class="close-btn"')
    expect(home).not.toContain('<div class="close-btn"')
  })

  it('keeps the closed mobile menu from covering the opener', () => {
    const css = readFileSync(`${root}/css/marqetise.css`, 'utf8')
    expect(css).toContain('.mobile-menu,\n.mobile-menu .menu-backdrop,\n.mobile-menu .menu-box,\n.mobile-menu .close-btn {\n  pointer-events: none;')
    expect(css).toContain('.mobile-menu-visible .mobile-menu')
    expect(css).toContain('.blog-details__meta li a')
    expect(css).toContain('.sidebar__post .sidebar__post-list .sidebar__post-content-meta')
  })
})
