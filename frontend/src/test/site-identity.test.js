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
  `
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
})
