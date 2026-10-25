import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const root = resolve(process.cwd())
const script = readFileSync(`${root}/js/marqetise.js`, 'utf8')

function nextWeekday() {
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (cursor.getDay() === 0 || cursor.getDay() === 6) cursor.setDate(cursor.getDate() + 1)
  const month = String(cursor.getMonth() + 1).padStart(2, '0')
  const day = String(cursor.getDate()).padStart(2, '0')
  return `${cursor.getFullYear()}-${month}-${day}`
}

function mountForm() {
  document.body.innerHTML = `
    <form id="booking_form">
      <select name="service_id"><option value="">Select a published service</option></select>
      <select name="format">
        <option value="">Select a format</option>
        <option value="video">Video call</option>
      </select>
      <input name="name">
      <input name="email">
      <input name="phone">
      <input name="company">
      <input name="website">
      <input name="budget">
      <input name="preferred_date" type="date">
      <select name="preferred_time"><option value="">Select a time</option></select>
      <textarea name="goals"></textarea>
      <input name="consent" type="checkbox">
      <input name="hp_field">
      <p data-booking-status role="status"></p>
      <button type="submit">Send request</button>
    </form>
  `
}

function boot(bookingsResponse) {
  mountForm()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const target = String(url)
    if (target.includes('/sanctum/csrf-cookie')) return { ok: true, json: async () => ({}) }
    if (target.includes('/api/v1/site')) {
      return {
        ok: true,
        json: async () => ({
          data: {
            settings: {},
            pages: [],
            services: [{ id: 7, name: 'SEO', slug: 'seo' }],
            faqs: {},
            booking_times: ['09:00', '16:30'],
          },
        }),
      }
    }
    if (target.includes('/api/v1/bookings')) return bookingsResponse
    return { ok: false, json: async () => ({}) }
  }))
  window.eval(script)
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, 30)
  })
}

describe('public routes and booking', () => {
  it('maps sitemap paths to static pages and ships a booking form', () => {
    const vite = readFileSync(`${root}/vite.config.js`, 'utf8')
    const server = readFileSync(`${root}/scripts/static-server.cjs`, 'utf8')
    const page = readFileSync(`${root}/page-book.html`, 'utf8')
    for (const source of [vite, server]) {
      expect(source).toContain("'/about': '/page-about.html'")
      expect(source).toContain("'/book': '/page-book.html'")
      expect(source).toContain("'/courses': '/page-courses.html'")
      expect(source).toContain('/page-course-details.html')
      expect(source).toContain('/page-404.html')
      expect(source).toContain('404')
    }
    expect(page).toContain('id="booking_form"')
    expect(page).toContain('name="consent"')
    expect(page).toContain('href="/privacy"')
    expect(page).toContain('data-booking-status')
    expect(page).toContain('for="booking_goals"')
    expect(page).not.toContain('data-cms-page="contact"')
  })

  it('shows a validation error and does not post an incomplete request', async () => {
    await boot({ ok: true, status: 201, json: async () => ({ message: 'saved' }) })
    document.getElementById('booking_form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    const status = document.querySelector('[data-booking-status]')
    expect(status).toHaveAttribute('data-state', 'error')
    expect(status).toHaveTextContent('Please confirm that we may contact you about this request.')
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/v1/bookings'), expect.anything())
  })

  it('shows the API error and a saved reference', async () => {
    const calls = []
    mountForm()
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      const target = String(url)
      calls.push(target)
      if (target.includes('/sanctum/csrf-cookie')) return { ok: true, json: async () => ({}) }
      if (target.includes('/api/v1/site')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              settings: {},
              pages: [],
              services: [{ id: 7, name: 'SEO', slug: 'seo' }],
              faqs: {},
              booking_times: ['09:00'],
            },
          }),
        }
      }
      if (target.includes('/api/v1/bookings') && !calls.includes('posted')) {
        calls.push('posted')
        return {
          ok: false,
          status: 422,
          json: async () => ({ errors: { preferred_time: ['That time is already requested.'] } }),
        }
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({
          message: 'Your booking request has been received and is pending confirmation.',
          data: { reference: 'MQ-2026-00001' },
        }),
      }
    }))
    window.eval(script)
    await new Promise((resolvePromise) => { setTimeout(resolvePromise, 30) })

    const form = document.getElementById('booking_form')
    expect(form.elements.service_id).toHaveTextContent('SEO')
    expect(form.elements.preferred_time).toHaveTextContent('09:00')
    form.elements.service_id.value = '7'
    form.elements.format.value = 'video'
    form.elements.name.value = 'Ama Mensah'
    form.elements.email.value = 'ama@example.com'
    form.elements.preferred_date.value = nextWeekday()
    form.elements.preferred_time.value = '09:00'
    form.elements.goals.value = 'We want to talk through the search work for the next quarter.'
    form.elements.consent.checked = true
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await new Promise((resolvePromise) => { setTimeout(resolvePromise, 30) })
    expect(document.querySelector('[data-booking-status]')).toHaveTextContent('That time is already requested.')
    expect(document.querySelector('[data-booking-status]')).toHaveAttribute('data-state', 'error')

    form.elements.service_id.value = '7'
    form.elements.format.value = 'video'
    form.elements.name.value = 'Ama Mensah'
    form.elements.email.value = 'ama@example.com'
    form.elements.preferred_date.value = nextWeekday()
    form.elements.preferred_time.value = '09:00'
    form.elements.goals.value = 'We want to talk through the search work for the next quarter.'
    form.elements.consent.checked = true
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await new Promise((resolvePromise) => { setTimeout(resolvePromise, 30) })
    expect(document.querySelector('[data-booking-status]')).toHaveTextContent('Reference MQ-2026-00001')
    expect(document.querySelector('[data-booking-status]')).not.toHaveAttribute('data-state', 'error')
  })
})
