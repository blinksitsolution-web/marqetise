import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountPage from '../pages/admin/AccountPage.jsx'
import { CmsListPage } from '../pages/admin/CmsPages.jsx'
import { CourseEditorPage } from '../pages/admin/CourseAdminPages.jsx'
import { SettingsPage, UsersPage } from '../pages/admin/AccessPages.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { api } from '../services/api'

const refresh = vi.hoisted(() => vi.fn())

vi.mock('../context/useSite', () => ({
  useSite: () => ({ site: { settings: {} }, error: '' }),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Ada Lovelace',
      phone: '',
      role: { name: 'Administrator' },
      permissions: ['users.manage', 'roles.view', 'settings.view', 'content.manage', 'courses.manage', 'bookings.view', 'dashboard.view'],
    },
    refresh,
    logout: vi.fn(),
  }),
}))

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    ensureCsrf: vi.fn(),
  }
})

describe('admin remediation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refresh.mockResolvedValue(undefined)
  })

  it('saves instructor and start date with a course', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValue({ data: {} })
    render(<MemoryRouter><CourseEditorPage /></MemoryRouter>)

    await user.type(screen.getByLabelText('Title'), 'Search')
    await user.type(screen.getByLabelText('Summary'), 'A short summary for the course.')
    await user.type(screen.getByLabelText('Instructor name'), 'Ada Lovelace')
    fireEvent.change(screen.getByLabelText('Next start date'), { target: { value: '2026-11-01' } })
    await user.click(screen.getByRole('button', { name: 'Save course' }))

    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/courses', expect.objectContaining({
      instructor_name: 'Ada Lovelace',
      next_start_date: '2026-11-01',
    }))
  })

  it('saves a hero headline without typing JSON', async () => {
    const user = userEvent.setup()
    api.get.mockImplementation((url) => {
      if (String(url).includes('/blocks')) {
        return Promise.resolve({
          data: {
            data: [{
              id: 3,
              key: 'home.hero',
              group: 'home',
              label: 'Home hero',
              is_visible: true,
              payload: { headline: 'Old headline', primary_href: '/book' },
            }],
          },
        })
      }
      return Promise.resolve({ data: { data: [], meta: { current_page: 1, last_page: 1 } } })
    })
    api.put.mockResolvedValue({ data: {} })

    render(<MemoryRouter><CmsListPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'blocks' }))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const headline = await screen.findByLabelText('Headline')
    await user.clear(headline)
    await user.type(headline, 'New headline')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/blocks/3', expect.objectContaining({
      payload: expect.objectContaining({ headline: 'New headline', primary_href: '/book' }),
    }))
  })

  it('shows a logo upload error', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: { company_name: 'Marqetise' }, mail_can_deliver: true } })
    api.post.mockRejectedValue({ response: { status: 422, data: { message: 'The logo was rejected.' } } })

    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const input = await screen.findByLabelText('Logo')
    await user.upload(input, new File(['png'], 'logo.png', { type: 'image/png' }))

    expect(await screen.findByText('The logo was rejected.')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('links a booking search result to that booking', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: { bookings: [{ id: 9, reference: 'MQ-9' }] } } })

    render(<MemoryRouter><AdminLayout /></MemoryRouter>)
    await user.type(screen.getByLabelText('Search admin records'), 'MQ')

    expect(await screen.findByRole('link', { name: 'MQ-9' })).toHaveAttribute('href', '/admin/bookings/9')
  })

  it('deletes another user after confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.delete.mockResolvedValue({})
    api.get.mockImplementation((url) => {
      if (String(url).includes('/roles')) {
        return Promise.resolve({ data: { data: { roles: [{ id: 3, name: 'Editor' }] } } })
      }
      if (String(url).includes('/settings')) {
        return Promise.resolve({ data: { data: {}, mail_can_deliver: true } })
      }
      return Promise.resolve({
        data: {
          data: [{ id: 2, name: 'Other Person', email: 'other@example.com', status: 'active', role: { id: 3, name: 'Editor' } }],
          meta: { current_page: 1, last_page: 1 },
        },
      })
    })

    render(<MemoryRouter><UsersPage /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(api.delete).toHaveBeenCalledWith('/api/v1/admin/users/2')
  })

  it('labels every user cell and wraps the admin header', async () => {
    api.get.mockImplementation((url) => {
      if (String(url).includes('/roles')) {
        return Promise.resolve({ data: { data: { roles: [{ id: 3, name: 'Editor' }] } } })
      }
      if (String(url).includes('/settings')) {
        return Promise.resolve({ data: { data: {}, mail_can_deliver: true } })
      }
      return Promise.resolve({
        data: {
          data: [{ id: 2, name: 'Other Person', email: 'other@example.com', status: 'active', role: { id: 3, name: 'Editor' } }],
          meta: { current_page: 1, last_page: 1 },
        },
      })
    })

    const { unmount } = render(<MemoryRouter><UsersPage /></MemoryRouter>)
    const table = await screen.findByRole('table')
    const cells = within(table).getAllByRole('cell')
    expect(cells.length).toBeGreaterThan(0)
    expect(cells.every((cell) => cell.getAttribute('data-label'))).toBe(true)
    unmount()

    render(<MemoryRouter><AdminLayout /></MemoryRouter>)
    expect(document.querySelector('header').className).toContain('flex-wrap')
    expect(document.querySelector('header p')).toHaveClass('truncate')
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument()
  })

  it('saves the signed-in profile', async () => {
    const user = userEvent.setup()
    api.patch.mockResolvedValue({ data: { data: {} } })

    render(<MemoryRouter><AccountPage /></MemoryRouter>)
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Save account' }))

    expect(api.patch).toHaveBeenCalledWith('/api/v1/account', { name: 'Ada', phone: null })
    expect(refresh).toHaveBeenCalled()
  })
})
