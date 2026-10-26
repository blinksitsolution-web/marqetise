import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ChromeEditorPage } from '../pages/admin/publicEditors.jsx'
import { api, ensureCsrf } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    ensureCsrf: vi.fn(),
  }
})

const root = resolve(process.cwd())
const pages = readdirSync(root).filter((name) => name.endsWith('.html') && name !== 'admin.html')
describe('public page content', () => {
  it('keeps the template layout and marks the shared chrome', () => {
    for (const name of pages) {
      const html = readFileSync(`${root}/${name}`, 'utf8')
      expect(html, name).toContain('js/page-sections.js')
      expect(html, name).toContain('data-chrome="nav"')
      expect(html, name).toContain('data-chrome="panel"')
      expect(html, name).not.toContain('bixom')
    }
    const home = readFileSync(`${root}/index.html`, 'utf8')
    expect(home).toContain('ks-slider-area')
    expect(home).toContain('ks-contact-form')
    expect(home).toContain('Kevin Martin')
    const aboutHtml = readFileSync(`${root}/page-about.html`, 'utf8')
    const banner = aboutHtml.slice(aboutHtml.indexOf('<!-- Start main-content -->'), aboutHtml.indexOf('<!-- end main-content -->'))
    expect(aboutHtml).toContain('ks-about-2-area')
    expect(banner).toContain('data-about="banner"')
    expect(banner).toContain('data-about="heading"')
    expect(banner).toContain('data-about="banner-image"')
    expect(banner).toContain('ks-about-2-thumb')
    expect(aboutHtml).toContain('id="about-cards"')
    expect(aboutHtml).toContain('data-about-card="who-copy"')
    expect(banner).not.toContain('data-cms="excerpt"')
    expect(aboutHtml).not.toContain('storytelling-led digital solutions')
    expect(readFileSync(`${root}/page-services.html`, 'utf8')).toContain('data-cms-services')
    expect(readFileSync(`${root}/page-privacy.html`, 'utf8')).toContain('Data Protection Act, 2012 (Act 843)')
    expect(readFileSync(`${root}/page-contact.html`, 'utf8')).toContain('name="consent"')
    expect(readFileSync(`${root}/page-book.html`, 'utf8')).toContain('id="booking_form"')
  })

  it('renders about copy and hides an empty team list', () => {
    document.body.innerHTML = `
      <ul class="navigation"><li><a href="index.html">Home</a></li></ul>
      <a data-chrome="cta" href="/contact"><span class="text-1">Get In Touch</span><span class="text-2">Get In Touch</span></a>
      <h1 data-about="heading">About Us</h1>
      <p class="text" data-about="banner" hidden></p>
      <img data-about="banner-image" src="images/about/about-1-1.jpg" alt="">
      <h2 data-about-card="who-title">Who we are</h2>
      <div data-about-card="who-copy">Demo line</div>
      <div id="about-cards"></div>
      <div class="mq-cms-body" data-cms="body" data-about-source="body">Plain stacked text</div>
      <div id="page-sections" data-page="about"></div>
      <div id="page-sections" data-page="team"></div>
    `
    window.eval(readFileSync(`${root}/js/page-sections.js`, 'utf8'))
    window.renderPageSections({
      blocks: {
        'site.chrome': { payload: { cta_label: 'Talk to us', cta_href: '/contact', nav: [{ label: 'About', href: '/about' }, { label: 'Bad', href: 'javascript:alert(1)' }] } },
        'about.banner': { payload: { heading: 'Our story', text: 'A short banner line', image: '/storage/media/about.jpg', image_alt: 'The studio' } },
        'about.who': { payload: { title: 'Who we are', body: 'Three business units.', image: '', items: [{ title: 'Marqetise Academy', body: 'Practical training.' }] } },
        'about.story': { payload: { title: 'Our story', body: 'Began as DigiGrowth Hub.', image: '' } },
        'about.direction': { payload: { title: 'Our long-term ambition', body: 'Global reach.', items: [{ title: 'Vision', body: 'Trusted company.' }, { title: 'Mission', body: 'Help businesses grow.' }, { title: 'Brand positioning', body: 'Storytelling-led.' }] } },
        'about.values': { payload: { title: 'Core values', body: '', items: [{ title: 'Excellence', body: 'High-quality work.' }] } },
        'about.identity': { payload: { title: 'An agency and a training practice', body: 'Marqetise helps businesses.', mission: 'Make progress visible.', values: [{ title: 'Clarity', body: 'Say what the work is.' }] } },
      },
      services: [],
    })
    expect(document.querySelector('.navigation').textContent).toContain('About')
    expect(document.querySelector('.navigation').innerHTML).not.toContain('javascript:')
    expect(document.querySelector('[data-chrome="cta"] .text-1')).toHaveTextContent('Talk to us')
    const about = document.querySelector('[data-page="about"]')
    expect(about).toHaveTextContent('An agency and a training practice')
    expect(about).toHaveTextContent('Clarity')
    expect(document.querySelector('[data-page="team"]')).toBeEmptyDOMElement()
    expect(document.querySelector('[data-about="heading"]')).toHaveTextContent('Our story')
    expect(document.querySelector('[data-about="banner"]')).toHaveTextContent('A short banner line')
    expect(document.querySelector('[data-about="banner"]')).not.toHaveAttribute('hidden')
    expect(document.querySelector('[data-about="banner-image"]')).toHaveAttribute('src', '/storage/media/about.jpg')
    expect(document.querySelector('[data-about="banner-image"]')).toHaveAttribute('alt', 'The studio')
    document.body.setAttribute('data-cms-page', 'about')
    window.renderPageSections({
      blocks: {
        'about.who': { payload: { title: 'Who we are', body: 'Three business units.', items: [{ title: 'Marqetise Academy', body: 'Practical training.' }] } },
        'about.story': { payload: { title: 'Our story', body: 'Began as DigiGrowth Hub.' } },
        'about.direction': { payload: { title: 'Our long-term ambition', body: 'Global reach.', items: [{ title: 'Vision', body: 'Trusted company.' }, { title: 'Brand positioning', body: 'Storytelling-led.' }] } },
        'about.values': { payload: { title: 'Core values', items: [{ title: 'Excellence', body: 'High-quality work.' }] } },
      },
    })
    expect(document.querySelector('[data-about-card="who-copy"]')).toHaveTextContent('Three business units.')
    expect(document.querySelector('[data-about-card="who-copy"]')).toHaveTextContent('Marqetise Academy')
    const cards = document.getElementById('about-cards')
    expect(cards.querySelectorAll('.ks-about-2-wrap')).toHaveLength(3)
    expect(cards).toHaveTextContent('Our story')
    expect(cards).toHaveTextContent('Vision')
    expect(cards).toHaveTextContent('Brand positioning')
    expect(cards).toHaveTextContent('Excellence')
    expect(document.querySelector('[data-about-source="body"]')).toHaveAttribute('hidden')
  })

  it('saves the header button from the chrome editor', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 9,
          key: 'site.chrome',
          group: 'global',
          label: 'Header and footer',
          is_visible: true,
          sort_order: 1,
          payload: { cta_label: 'Get In Touch', cta_href: '/contact', nav: [{ label: 'Home', href: '/' }] },
        }],
      },
    })
    api.put.mockResolvedValue({ data: { data: { id: 9, is_visible: true, payload: { cta_label: 'Talk to us', cta_href: '/contact', nav: [{ label: 'Home', href: '/' }] } } } })
    ensureCsrf.mockResolvedValue('token')

    render(<MemoryRouter><ChromeEditorPage /></MemoryRouter>)
    const label = await screen.findByRole('textbox', { name: 'Header button label' })
    await user.clear(label)
    await user.type(label, 'Talk to us')
    await user.click(screen.getByRole('button', { name: 'Save Header and footer' }))

    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/blocks/9', expect.objectContaining({
      key: 'site.chrome',
      group: 'global',
      payload: expect.objectContaining({ cta_label: 'Talk to us', cta_href: '/contact' }),
    }))
  })
})
