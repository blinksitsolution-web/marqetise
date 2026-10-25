import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

function html(name) {
  return readFileSync(`${root}/${name}`, 'utf8')
}

describe('public legal pages', () => {
  it('publishes privacy and terms in the site template', () => {
    const privacy = html('page-privacy.html')
    const terms = html('page-terms.html')

    expect(privacy).toContain('data-cms-page="privacy"')
    expect(terms).toContain('data-cms-page="terms"')
    expect(privacy).toContain('Data Protection Act, 2012 (Act 843)')
    expect(privacy).toContain('[IP ADDRESS RETENTION PERIOD]')
    expect(privacy).toContain('[DPC REGISTRATION NUMBER]')
    expect(privacy).toContain('[HOSTING AND MAIL LOCATION]')
    expect(terms).toContain('Electronic Transactions Act, 2008 (Act 772)')
    expect(terms).toContain('[REFUND POLICY DETAILS]')
    expect(terms).toContain('courts of Ghana')
    expect(privacy).toContain('Have a lawyer qualified in Ghana review this page')
    expect(privacy).not.toContain('google-analytics')
    for (const page of [privacy, terms]) {
      expect(page).toContain('width=device-width, initial-scale=1.0">')
      expect(page).not.toContain('user-scalable=0')
      expect(page).toContain('aria-label="Search"')
      expect(page).toContain('aria-label="Open menu"')
      expect(page).toContain('aria-label="Back to top"')
      expect(page).toContain('alt="Marqetise"')
    }
  })

  it('links the footer and enquiry forms to those pages', () => {
    for (const name of ['index.html', 'page-contact.html']) {
      const page = html(name)
      expect(page).toContain('href="page-privacy.html"')
      expect(page).toContain('href="page-terms.html"')
      expect(page).toContain('name="consent"')
    }
    expect(html('vite.config.js')).toContain("'/privacy': '/page-privacy.html'")
    expect(html('vite.config.js')).toContain("'/terms': '/page-terms.html'")
  })
})