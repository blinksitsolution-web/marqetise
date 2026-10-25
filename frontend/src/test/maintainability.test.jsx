import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '../components/ErrorBoundary.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import { api, handleApiError } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    ensureCsrf: vi.fn(),
  }
})

function Boom() {
  throw new Error('boom')
}

describe('maintainability', () => {
  it('shows a way home when a screen crashes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/')
  })

  it('refreshes the signed-in user after a forbidden response', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 1, name: 'Ada', permissions: [] } } })
    render(<AuthProvider><span>ready</span></AuthProvider>)
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1))

    await handleApiError({ response: { status: 403 }, config: { url: '/api/v1/admin/pages' } }).catch(() => {})

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    expect(api.get).toHaveBeenLastCalledWith('/api/v1/auth/user')
  })
})
