import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ServicesPage from '../pages/public/ServicesPage.jsx'
import ServiceDetailPage from '../pages/public/ServiceDetailPage.jsx'
import { api } from '../services/api'

vi.mock('../context/useSite', () => ({
  useSite: () => ({ site: { settings: {} }, error: '' }),
}))

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
    },
  }
})

describe('services page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists a published service and links to its booking form', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          id: 4,
          name: 'Search marketing',
          slug: 'search-marketing',
          summary: 'Published service summary.',
          description: 'The longer service description.',
          duration_label: 'One session',
          starting_price: null,
        }],
      },
    })

    render(<MemoryRouter><ServicesPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Search marketing' })).toBeInTheDocument()
    expect(screen.getByText('Published service summary.')).toBeInTheDocument()
    expect(screen.getByText('The longer service description.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View service' })).toHaveAttribute('href', '/services/search-marketing')
    expect(screen.getByText('One session')).toBeInTheDocument()
    expect(screen.queryByText(/Starting price/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book this service' })).toHaveAttribute('href', '/book/search-marketing')
    expect(api.get).toHaveBeenCalledWith('/api/v1/services')
  })

  it('loads a service detail page', async () => {
    api.get.mockResolvedValue({
      data: {
        data: {
          id: 4,
          name: 'Search marketing',
          slug: 'search-marketing',
          summary: 'Published service summary.',
          description: 'The longer service description.',
        },
      },
    })

    render(
      <MemoryRouter initialEntries={['/services/search-marketing']}>
        <Routes>
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Search marketing' })).toBeInTheDocument()
    expect(screen.getByText('The longer service description.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book this service' })).toHaveAttribute('href', '/book/search-marketing')
    expect(api.get).toHaveBeenCalledWith('/api/v1/services/search-marketing')
  })

  it('shows an empty state when nothing is published', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    render(<MemoryRouter><ServicesPage /></MemoryRouter>)

    expect(await screen.findByText('No services are published')).toBeInTheDocument()
  })
})
