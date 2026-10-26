import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountPage from '../pages/admin/AccountPage.jsx'
import { CmsListPage } from '../pages/admin/CmsListPage.jsx'
import { HomeEditorPage } from '../pages/admin/HomeEditorPage.jsx'
import { CourseEditorPage } from '../pages/admin/CourseAdminPages.jsx'
import { SettingsPage } from '../pages/admin/SettingsPage.jsx'
import { UsersPage } from '../pages/admin/UsersPage.jsx'
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
      permissions: ['users.manage', 'roles.view', 'settings.view', 'content.view', 'content.manage', 'courses.manage', 'bookings.view', 'dashboard.view'],
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
    expect(await screen.findByRole('dialog', { name: 'Saved' })).toHaveTextContent('Your changes are live.')
  })

  it('saves the home hero from labeled fields', async () => {
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
              sort_order: 1,
              payload: { headline: 'Old headline', primary_label: 'Book', primary_href: '/book' },
            }],
          },
        })
      }
      return Promise.resolve({
        data: {
          data: [{ id: 1, title: 'Home', slug: 'home', excerpt: '', body: 'Saved body', meta_title: '', meta_description: '', status: 'published' }],
        },
      })
    })
    api.put.mockResolvedValue({
      data: {
        data: {
          id: 3,
          key: 'home.hero',
          label: 'Home hero',
          is_visible: true,
          sort_order: 1,
          payload: { headline: 'New headline', primary_label: 'Book', primary_href: '/book' },
        },
      },
    })

    render(<MemoryRouter><HomeEditorPage /></MemoryRouter>)
    expect(await screen.findByRole('link', { name: 'View live page' })).toHaveAttribute('href', '/')
    const headline = await screen.findByRole('textbox', { name: 'Headline' })
    await user.clear(headline)
    await user.type(headline, 'New headline')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/blocks/3', expect.objectContaining({
      key: 'home.hero',
      is_visible: true,
      payload: expect.objectContaining({ headline: 'New headline', primary_href: '/book' }),
    }))
    expect(await screen.findByRole('dialog', { name: 'Saved' })).toHaveTextContent('Saved')
    expect(screen.getByRole('dialog', { name: 'Saved' })).toHaveTextContent('Your changes are live.')
  })

  it('reports a partial save in one dialog', async () => {
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
              sort_order: 1,
              payload: { headline: 'Old headline', primary_label: 'Book', primary_href: '/book' },
            }],
          },
        })
      }
      return Promise.resolve({
        data: {
          data: [{ id: 1, title: 'Home', slug: 'home', excerpt: '', body: 'Saved body', meta_title: '', meta_description: '', status: 'published' }],
        },
      })
    })
    api.put.mockResolvedValue({
      data: {
        data: {
          id: 3,
          key: 'home.hero',
          label: 'Home hero',
          is_visible: true,
          sort_order: 1,
          payload: { headline: 'New headline', primary_label: 'Book', primary_href: '/book' },
        },
      },
    })
    api.post.mockRejectedValue({ response: { status: 500, data: { message: 'Focus failed.' } } })

    render(<MemoryRouter><HomeEditorPage /></MemoryRouter>)
    const headline = await screen.findByRole('textbox', { name: 'Headline' })
    await user.clear(headline)
    await user.type(headline, 'New headline')
    const toggles = screen.getAllByRole('checkbox', { name: 'Show on the website' })
    await user.click(toggles[1])
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const dialog = await screen.findByRole('dialog', { name: 'Some changes were not saved' })
    expect(dialog).toHaveTextContent('Some changes were not saved')
    expect(dialog).toHaveTextContent('Focus areas: Focus failed.')
    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/blocks/3', expect.anything())
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/blocks', expect.objectContaining({ key: 'home.focus' }))
  })

  it('shows a logo upload error', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: { data: { company_name: 'Marqetise' }, mail_can_deliver: true } })
    api.post.mockRejectedValue({ response: { status: 422, data: { message: 'The logo was rejected.' } } })

    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const input = await screen.findByLabelText('Logo')
    await user.upload(input, new File(['png'], 'logo.png', { type: 'image/png' }))

    expect(await screen.findAllByText('The logo was rejected.')).not.toHaveLength(0)
    expect(api.put).not.toHaveBeenCalled()
  })

  it('groups settings and shows unsaved changes', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({
      data: {
        data: { company_name: 'Marqetise', tagline: 'Beyond Marketing', email: '', logo_url: '' },
        mail_can_deliver: false,
      },
    })

    render(<MemoryRouter><SettingsPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'General' })).toBeInTheDocument()
    for (const name of ['Contact', 'Social', 'SEO', 'Email', 'Privacy']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toBeInTheDocument()
    expect(screen.getByText('All settings match the last save.')).toBeInTheDocument()
    expect(screen.getByText('Using the bundled Marqetise logo.')).toBeInTheDocument()
    expect(screen.getByText('Email delivery is not configured. Reset and invitation emails are not being sent.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Company name'), '!')
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument()
    api.put.mockResolvedValue({
      data: {
        data: { company_name: 'Marqetise!', tagline: 'Beyond Marketing', email: '', logo_url: '' },
        mail_can_deliver: false,
      },
    })
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByRole('dialog', { name: 'Saved' })).toHaveTextContent('Your changes are live.')
  })

  it('opens a CMS submenu of every public page', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/admin/cms/about']}><AdminLayout /></MemoryRouter>)

    const menu = screen.getByRole('button', { name: 'CMS' })
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/admin/cms/about')
    expect(screen.getByRole('link', { name: 'Header & Footer' })).toHaveAttribute('href', '/admin/cms/chrome')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/admin/cms/privacy')
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/admin/cms/terms')

    await user.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument()

    await user.click(menu)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/admin/cms/home')
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

  it('labels every user cell and keeps the admin header on one row', async () => {
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
    expect(document.querySelector('header').className).not.toContain('flex-wrap')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
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
