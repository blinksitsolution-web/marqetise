import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ServicesPage from '../pages/public/ServicesPage.jsx'
import { api } from '../services/api'

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
          duration_label: 'One session',
          starting_price: null,
        }],
      },
    })

    render(<MemoryRouter><ServicesPage /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Search marketing' })).toBeInTheDocument()
    expect(screen.getByText('Published service summary.')).toBeInTheDocument()
    expect(screen.getByText('One session')).toBeInTheDocument()
    expect(screen.queryByText(/Starting price/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book this service' })).toHaveAttribute('href', '/book/search-marketing')
    expect(api.get).toHaveBeenCalledWith('/api/v1/services')
  })

  it('shows an empty state when nothing is published', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    render(<MemoryRouter><ServicesPage /></MemoryRouter>)

    expect(await screen.findByText('No services are published')).toBeInTheDocument()
  })
})
