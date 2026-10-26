import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const root = resolve(process.cwd())
const pages = readdirSync(root).filter((name) => name.endsWith('.html') && name !== 'admin.html')
const script = readFileSync(`${root}/js/marqetise.js`, 'utf8')

const forbidden = [
  'Kentucky',
  '__cf_email__',
  'shop-cart.html',
  'email-protection',
  'broklyn',
  'Double Bay',
  'company.com',
  'yourdomain.com',
  '+92',
  '+68',
  'Manchester',
]

function mount() {
  document.body.innerHTML = `
    <a data-site="phone" hidden href="tel:"></a>
    <a data-site="email" hidden href="mailto:"></a>
    <span data-site="address" hidden></span>
    <span data-site="hours" hidden></span>
    <div data-site-group hidden>
      <a data-site="social_facebook" aria-label="Facebook" hidden></a>
    </div>
    <div class="ks-copyright-text"><p>© Marqetise</p></div>
    <div class="logo"><img src="images/logo-black.png" alt="Marqetise"></div>
    <div class="ks-footer-widget-logo"><img src="images/logo-white.png" alt="Marqetise"></div>
    <img class="preloader-logo" src="images/loader-logo.png" alt="Marqetise">
  `
}

function stubLogoProbe(fails) {
  class FakeImage {
    set src(value) {
      queueMicrotask(() => {
        if (fails) this.onerror(new Error('missing'))
        else this.onload()
      })
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

function boot(settings) {
  mount()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).includes('/api/v1/site')) {
      return {
        ok: true,
        json: async () => ({ data: { settings, pages: [], services: [], faqs: {} } }),
      }
    }
    return { ok: false, json: async () => ({}) }
  }))
  window.eval(script)
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, 30)
  })
}

describe('public template identity', () => {
  it('keeps template addresses, phones, emails, and the cart out of the public HTML', () => {
    for (const name of pages) {
      const html = readFileSync(`${root}/${name}`, 'utf8')
      for (const needle of forbidden) {
        expect(html, `${name} still contains ${needle}`).not.toContain(needle)
      }
      const lower = html.toLowerCase()
      expect(lower, name).not.toContain('lorem ipsum')
      expect(lower, name).not.toContain('dolorem')
      expect(lower, name).not.toContain('bixom')
      expect(html, name).not.toContain('HTTrack')
      expect(html, name).not.toContain('kodesolution.com')
      expect(html, name).toContain('data-site="email"')
      expect(html, name).toContain('data-site="phone"')
      expect(html, name).toContain('data-site="address"')
      expect(html, name).toContain('hidden')
    }
  })

  it('fills contact hooks from site settings', async () => {
    await boot({
      company_name: 'Marqetise',
      phone: '+233 24 000 0000',
      email: 'hello@example.com',
      address: 'Accra',
      hours: 'Mon–Fri',
      social_facebook: 'https://facebook.com/example',
      social_x: 'javascript:alert(1)',
    })

    const phone = document.querySelector('[data-site="phone"]')
    const email = document.querySelector('[data-site="email"]')
    const address = document.querySelector('[data-site="address"]')
    const hours = document.querySelector('[data-site="hours"]')
    const facebook = document.querySelector('[data-site="social_facebook"]')

    expect(phone).toHaveTextContent('+233 24 000 0000')
    expect(phone).toHaveAttribute('href', 'tel:+233240000000')
    expect(phone).not.toHaveAttribute('hidden')
    expect(email).toHaveAttribute('href', 'mailto:hello@example.com')
    expect(address).toHaveTextContent('Accra')
    expect(hours).toHaveTextContent('Mon–Fri')
    expect(facebook).toHaveAttribute('href', 'https://facebook.com/example')
    expect(facebook).not.toHaveAttribute('hidden')
    expect(document.querySelector('.ks-copyright-text p')).toHaveTextContent(/Marqetise/)
  })

  it('leaves contact hooks hidden when settings are empty', async () => {
    await boot({
      company_name: '',
      phone: '',
      email: null,
      address: '   ',
      hours: null,
      social_facebook: '',
    })

    expect(document.querySelector('[data-site="phone"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[data-site="email"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[data-site="address"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[data-site="hours"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[data-site="social_facebook"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[data-site="phone"]')).toHaveAttribute('href', 'tel:')
    expect(document.querySelector('[data-site-group]')).toHaveAttribute('hidden')
    expect(document.body.textContent).not.toContain('Kentucky')
    expect(document.body.textContent).not.toContain('+92')
  })

  it('keeps each static brand logo when the settings logo fails to load', async () => {
    stubLogoProbe(true)
    await boot({
      company_name: 'Marqetise',
      logo_url: 'https://marqetise.onrender.com/storage/media/missing.jpg',
    })

    expect(document.querySelector('.logo img')).toHaveAttribute('src', 'images/logo-black.png')
    expect(document.querySelector('.ks-footer-widget-logo img')).toHaveAttribute('src', 'images/logo-white.png')
    expect(document.querySelector('.preloader-logo')).toHaveAttribute('src', 'images/loader-logo.png')
    vi.unstubAllGlobals()
  })

  it('uses a settings logo after it loads', async () => {
    stubLogoProbe(false)
    await boot({
      company_name: 'Marqetise',
      logo_url: '/storage/media/logo.png',
    })

    const logo = document.querySelector('.logo img')
    expect(logo).toHaveAttribute('src', '/storage/media/logo.png')
    expect(logo).toHaveAttribute('data-brand-src', 'images/logo-black.png')
    expect(logo).toHaveAttribute('alt', 'Marqetise')
    vi.unstubAllGlobals()
  })
})
