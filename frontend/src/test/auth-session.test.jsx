import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext.jsx'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'

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

function Probe() {
  const { user, sessionUnconfirmed, refresh } = useAuth()
  const label = sessionUnconfirmed && !user ? 'unconfirmed' : user?.name || 'signed-out'
  return (
    <>
      <button type="button" onClick={() => refresh()}>Refresh</button>
      <span>{label}</span>
    </>
  )
}

describe('staff session probe', () => {
  it('keeps a signed-in user when a later probe is rate limited', async () => {
    const user = userEvent.setup()
    api.get
      .mockResolvedValueOnce({ data: { data: { name: 'Ada' } } })
      .mockRejectedValueOnce({ response: { status: 429 } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('Ada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Ada')).toBeInTheDocument()
  })

  it('does not treat a rate limit as a signed-out session', async () => {
    api.get.mockRejectedValue({ response: { status: 429 } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('unconfirmed')).toBeInTheDocument()
  })

  it('signs out when the probe says the session ended', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('signed-out')).toBeInTheDocument()
  })
})
