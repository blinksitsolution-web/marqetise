import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactPage from '../pages/public/ContactPage.jsx'
import { can } from '../services/api'

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

vi.mock('../context/SiteContext', () => ({
  useSite: () => ({
    site: {
      settings: { email: 'hello@marqetise.test', hours: 'Weekdays' },
      blocks: { 'contact.hero': { payload: { headline: 'Contact the team', subcopy: 'Send a message.' } } },
      faqs: { contact: [] },
    },
    error: '',
  }),
}))

describe('public contact form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

describe('permission helper', () => {
  it('does not treat a missing permission as access', () => {
    expect(can({ permissions: ['content.view'] }, 'users.manage')).toBe(false)
    expect(can({ permissions: ['users.manage'] }, 'users.manage')).toBe(true)
    expect(can(null, 'dashboard.view')).toBe(false)
  })
})
