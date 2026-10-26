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
      <div class="ks-slider-text-anim-wrap video-btn">
        <a class="icon popup-video" href="https://www.youtube.com/watch?v=Lplq8RjQ0zU" aria-label="Play video">
          <div class="ks-slider-text-anim">
            <img src="images/slider/circle-text.png" alt="">
          </div>
        </a>
      </div>
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
      'popup-video',
      'https://www.youtube.com/watch?v=Lplq8RjQ0zU',
      'images/slider/circle-text.png',
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
    expect(document.querySelector('.popup-video')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=Lplq8RjQ0zU')
  })

  it('keeps the template intro video until a cms video is saved', () => {
    render({
      blocks: {
        'home.hero': { payload: { headline: 'Hi', video_url: '' } },
      },
    })

    expect(document.querySelector('.popup-video')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=Lplq8RjQ0zU')
    expect(document.querySelector('.ks-slider-text-anim img')).not.toHaveAttribute('hidden')
    expect(document.querySelector('#mq-hero-video')).toBeNull()
  })

  it('opens a youtube embed from the play button', () => {
    render({
      blocks: {
        'home.hero': { payload: { video_url: 'https://www.youtube.com/embed/Lplq8RjQ0zU' } },
      },
    })

    const link = document.querySelector('.popup-video')
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/embed/Lplq8RjQ0zU')
    expect(link).toHaveAttribute('data-video-kind', 'youtube')
  })

  it('ignores a video address that is not an embed or an uploaded file', () => {
    render({
      blocks: {
        'home.hero': { payload: { video_url: 'javascript:alert(1)' } },
      },
    })

    expect(document.querySelector('.popup-video')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=Lplq8RjQ0zU')
  })

  it('hides the play button when the intro video was removed', () => {
    render({
      blocks: {
        'home.hero': { payload: { video_url: '', video_removed: true } },
      },
    })

    const wrap = document.querySelector('.ks-slider-text-anim-wrap.video-btn')
    expect(wrap).toHaveAttribute('hidden')
    expect(wrap).toHaveAttribute('data-video-removed', '')
  })

  it('draws the play-button words and does not treat them as html', () => {
    render({
      blocks: {
        'home.hero': { payload: { video_label: 'Award <img src=x onerror=alert(1)>' } },
      },
    })

    const svg = document.querySelector('.ks-slider-text-anim svg.mq-circle-text')
    expect(svg).not.toBeNull()
    expect(svg.textContent).toBe('Award <img src=x onerror=alert(1)>')
    expect(svg.querySelector('img')).toBeNull()
    expect(document.querySelector('.ks-slider-text-anim img')).toHaveAttribute('hidden')
  })

  it('prepares an uploaded video for the popup player', () => {
    const hash = 'b'.repeat(64)
    const src = `/media/9-${hash}.mp4`
    render({
      blocks: {
        'home.hero': { payload: { video_url: src, video_kind: 'file' } },
      },
    })

    expect(document.querySelector('.popup-video')).toHaveAttribute('href', src)
    expect(document.querySelector('.popup-video')).toHaveAttribute('data-video-kind', 'file')
    const video = document.querySelector('#mq-hero-video video')
    expect(video).not.toBeNull()
    expect(video).toHaveAttribute('src', src)
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('playsinline')
    expect(document.querySelector('#mq-hero-video')).toHaveClass('mfp-hide')
  })
})
