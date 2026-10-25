import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactPage from '../pages/public/ContactPage.jsx'
import AboutPage from '../pages/public/AboutPage.jsx'
import HomePage from '../pages/public/HomePage.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { can } from '../services/api'

const siteState = vi.hoisted(() => ({
  site: {
    settings: { email: 'hello@marqetise.test', hours: 'Weekdays' },
    blocks: { 'contact.hero': { payload: { headline: 'Contact the team', subcopy: 'Send a message.' } } },
    faqs: { contact: [] },
    pages: [{ slug: 'privacy', title: 'Privacy' }],
  },
}))

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: {
      get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      post: vi.fn(),
    },
    ensureCsrf: vi.fn(),
  }
})

vi.mock('../context/useSite', () => ({
  useSite: () => ({
    site: siteState.site,
    error: '',
  }),
}))

describe('public contact form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    siteState.site = {
      ...siteState.site,
      pages: [{ slug: 'privacy', title: 'Privacy' }],
    }
  })

  it('shows a validation message before anything is sent', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ContactPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('Enter your name')).toBeInTheDocument()
    const { api } = await import('../services/api')
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('legal links', () => {
  it('uses a published logo on the header mark', () => {
    siteState.site = {
      ...siteState.site,
      pages: [],
      settings: { ...siteState.site.settings, logo_url: '/storage/logo.png' },
    }
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(document.querySelector('header img')).toHaveAttribute('src', '/storage/logo.png')
  })

  it('ignores an unsafe logo and a non-https social link', () => {
    siteState.site = {
      ...siteState.site,
      pages: [],
      settings: {
        ...siteState.site.settings,
        logo_url: 'javascript:alert(1)',
        social_linkedin: 'https://www.linkedin.com/company/example',
        social_facebook: 'http://facebook.com/example',
      },
    }
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(document.querySelector('header img')).toHaveAttribute('src', '/brand/mark.png')
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/company/example')
    expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument()
  })

  it('hides privacy and terms until those pages are published', () => {
    siteState.site = { ...siteState.site, pages: [] }
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Terms' })).not.toBeInTheDocument()
  })

  it('closes the mobile menu when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument()
  })

  it('marks only Contact Us current on the contact page', () => {
    siteState.site = { ...siteState.site, pages: [] }
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/contact" element={<h1>Contact</h1>} />
            <Route path="/book" element={<h1>Book</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(primary).getByRole('link', { name: 'Contact Us' })).toHaveAttribute('aria-current', 'page')
    expect(within(primary).getByRole('link', { name: 'Get Started' })).not.toHaveAttribute('aria-current')
    expect(within(primary).getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/book')
  })

  it('shows a published privacy page', () => {
    siteState.site = { ...siteState.site, pages: [{ slug: 'privacy', title: 'Privacy' }] }
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })

  it('closes the contact form when privacy is unpublished', () => {
    siteState.site = { ...siteState.site, pages: [] }
    render(<MemoryRouter><ContactPage /></MemoryRouter>)
    expect(screen.getByText('A privacy notice has not been published, so this form is closed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })
})

describe('public pages', () => {
  it('waits for the site payload before painting About', () => {
    siteState.site = null
    render(<MemoryRouter><AboutPage /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the page')
  })

  it('gives the secondary hero link the same minimum height and shows an empty services note', () => {
    siteState.site = { settings: {}, blocks: {}, services: [], pages: [] }
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getAllByRole('link', { name: 'Explore courses' })[0].className).toContain('min-h-11')
    expect(screen.getByRole('link', { name: 'Book a strategy call' }).className).toContain('min-h-11')
    expect(screen.getByText('Published services will appear here.')).toBeInTheDocument()
  })
})

describe('permission helper', () => {
  it('does not treat a missing permission as access', () => {
    expect(can({ permissions: ['content.view'] }, 'users.manage')).toBe(false)
    expect(can({ permissions: ['users.manage'] }, 'users.manage')).toBe(true)
    expect(can(null, 'dashboard.view')).toBe(false)
  })
})
