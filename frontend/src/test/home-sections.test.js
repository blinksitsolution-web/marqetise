import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const script = readFileSync(`${root}/js/home-sections.js`, 'utf8')

function render(payload) {
  document.body.innerHTML = `
    <h1 data-home-fallback-title hidden>Home</h1>
    <div id="home-hero"></div>
    <div id="home-sections"></div>
    <div data-chrome="panel" hidden>
      <h4 data-chrome="panel-title"></h4>
      <p data-chrome="panel-body"></p>
    </div>
  `
  window.eval(script)
  window.renderHomeSections(payload)
}

describe('home page sections', () => {
  it('does not keep template claims in the home page html', () => {
    const html = readFileSync(`${root}/index.html`, 'utf8')
    for (const needle of [
      'Kevin Martin',
      'Jessica Brown',
      'David Cooper',
      '30k+',
      'Consultez',
      'Trusted By',
      'Best Rated',
      'Proven Track',
      'Best SEO Strategy',
      'Service Grid',
    ]) {
      expect(html).not.toContain(needle)
    }
    expect(html).toContain('id="home-sections"')
    expect(html).toContain('js/home-sections.js')
  })

  it('renders published cms sections and skips empty ones', () => {
    render({
      settings: { phone: '+233 24 000 0000' },
      blocks: {
        'home.hero': { payload: { headline: 'Marketing that grows', subcopy: 'Real copy', primary_label: 'Book', primary_href: '/book', proof: '' } },
        'home.services': { payload: { title: 'Services', intro: '' } },
        'home.why': { payload: { title: 'Why businesses choose Marqetise', items: [{ title: 'Clear priorities', body: 'Start with the outcome.' }] } },
        'about.identity': { payload: { title: 'An agency', body: 'Marqetise helps businesses.' } },
      },
      services: [{ name: 'SEO', slug: 'seo', summary: 'Search work', image_path: '/storage/media/seo.png' }],
      featured_courses: [],
    })

    expect(document.querySelector('#home-hero h1').textContent).toBe('Marketing that grows')
    expect(document.body.textContent).toContain('SEO')
    expect(document.body.textContent).toContain('Clear priorities')
    expect(document.querySelector('.mq-home-stats')).toBeNull()
    expect(document.querySelector('.mq-home-team')).toBeNull()
    expect(document.querySelector('.mq-home-projects')).toBeNull()
    expect(document.querySelector('[data-chrome="panel"]').hidden).toBe(false)
    expect(document.querySelector('[data-chrome="panel-body"]').textContent).toBe('Marqetise helps businesses.')
    expect(document.querySelector('#home-hero a[href="/book"]').textContent).toBe('Book')
    expect(document.querySelector('.mq-home-services img').getAttribute('src')).toBe('/storage/media/seo.png')
  })

  it('ignores off-site links and scriptable image urls', () => {
    render({
      blocks: {
        'home.hero': {
          payload: {
            headline: 'Hi',
            primary_label: 'Go',
            primary_href: 'https://evil.example',
            image: 'javascript:alert(1)',
          },
        },
      },
    })

    expect(document.querySelector('#home-hero h1').textContent).toBe('Hi')
    expect(document.querySelector('#home-hero a')).toBeNull()
    expect(document.querySelector('#home-hero img')).toBeNull()
  })
})
