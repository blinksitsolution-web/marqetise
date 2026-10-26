import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const script = readFileSync(`${root}/js/home-sections.js`, 'utf8')

function render(payload) {
  document.body.innerHTML = `
    <div class="ks-slider-area">
      <h2 class="ks-slider-title">Experts in SEO</h2>
      <p data-home="subcopy">Demo sentence</p>
      <span class="ks-slider-desc"><span><span>30k+ Active Customers</span></span></span>
      <div class="ks-slider-link"><a href="page-contact.html"><span>apply now</span></a></div>
      <div class="ks-slider-thumb"><img src="images/slider/slider-img-1.png" alt=""></div>
    </div>
    <div class="ks-service-area"><div class="row gx-30">
      <div class="col-xl-4"><div class="ks-service-item">
        <span class="ks-service-number">01</span>
        <h4 class="ks-service-title"><a href="page-service-details.html">Digital & Web Marketing</a></h4>
        <div class="ks-service-list-box"><ul><li>Keyword Research</li><li>Link Building</li></ul></div>
        <a class="ks-service-more" href="page-service-details.html">More</a>
      </div></div>
    </div></div>
    <form id="home_contact_form">
      <div class="ks-contact-input-box"><input name="name" placeholder="Type  your name"></div>
    </form>
    <div data-chrome="panel">
      <h4 data-chrome="panel-title">About Us</h4>
      <p data-chrome="panel-body">Consultez is the go-to hub.</p>
    </div>
  `
  window.eval(script)
  window.renderHomeSections(payload)
}

describe('home page sections', () => {
  it('keeps the template structure in the home page html', () => {
    const html = readFileSync(`${root}/index.html`, 'utf8')
    for (const needle of [
      'ks-slider-area',
      'ks-contact-input-box',
      'ks-team-area',
      'ks-funfact-area',
      'ks-testimonial-area',
      'Kevin Martin',
      '30k+ Active Customers',
      'name="consent"',
      'js/home-sections.js',
    ]) {
      expect(html, needle).toContain(needle)
    }
    expect(html).not.toContain('id="home-sections"')
    expect(html).not.toContain('<h2 class="ks-slider-title" data-cms="title">')
  })

  it('writes cms copy into the template slots and leaves the demo proof line', () => {
    render({
      blocks: {
        'home.hero': { payload: { headline: 'Marketing that grows', subcopy: 'Real copy', primary_label: 'Book', primary_href: '/book', image: 'javascript:alert(1)' } },
        'home.services': { payload: { title: 'Services', intro: '' } },
        'about.identity': { payload: { title: 'Beyond Marketing', body: 'Marqetise helps businesses.' } },
      },
      services: [{ name: 'SEO', slug: 'seo', summary: 'Search work' }],
    })

    expect(document.querySelector('.ks-slider-title').textContent).toBe('Marketing that grows')
    expect(document.querySelector('[data-home="subcopy"]').textContent).toBe('Real copy')
    expect(document.querySelector('.ks-slider-link a').getAttribute('href')).toBe('/book')
    expect(document.querySelector('.ks-slider-thumb img').getAttribute('src')).toBe('images/slider/slider-img-1.png')
    expect(document.body.textContent).toContain('30k+ Active Customers')
    expect(document.querySelector('.ks-service-title a').textContent).toBe('SEO')
    expect(document.querySelector('.ks-service-list-box').textContent).toContain('Search work')
    expect(document.querySelector('#home_contact_form input').getAttribute('placeholder')).toBe('Type  your name')
    expect(document.querySelector('[data-chrome="panel-title"]').textContent).toBe('Beyond Marketing')
    expect(document.querySelector('[data-chrome="panel-body"]').textContent).toBe('Marqetise helps businesses.')
  })

  it('ignores off-site hero links', () => {
    render({
      blocks: {
        'home.hero': { payload: { headline: 'Hi', primary_label: 'Go', primary_href: 'https://evil.example' } },
      },
    })

    expect(document.querySelector('.ks-slider-link a').getAttribute('href')).toBe('page-contact.html')
    expect(document.querySelector('.ks-slider-title').textContent).toBe('Hi')
  })

  it('uses a stored media image and restores the template photo if it fails', () => {
    const hash = 'a'.repeat(64)
    const src = `${window.location.origin}/media/4-${hash}.webp`
    render({
      blocks: {
        'home.hero': { payload: { image: src, image_alt: 'Studio' } },
      },
    })

    const img = document.querySelector('.ks-slider-thumb img')
    expect(img.getAttribute('src')).toBe(src)
    expect(img.getAttribute('alt')).toBe('Studio')
    expect(img.getAttribute('data-template-src')).toBe('images/slider/slider-img-1.png')
    img.onerror()
    expect(img.getAttribute('src')).toBe('images/slider/slider-img-1.png')
  })

  it('ignores an off-site hero image', () => {
    render({
      blocks: {
        'home.hero': { payload: { image: 'https://evil.example/media/1.png' } },
      },
    })

    expect(document.querySelector('.ks-slider-thumb img').getAttribute('src')).toBe('images/slider/slider-img-1.png')
  })

  it('hides a hero image that was removed', () => {
    render({
      blocks: {
        'home.hero': { payload: { headline: 'Marketing that grows', image: '', image_removed: true } },
      },
    })

    const thumb = document.querySelector('.ks-slider-thumb')
    expect(thumb).toHaveAttribute('hidden')
    expect(thumb).toHaveAttribute('data-image-removed', '')
  })
})
