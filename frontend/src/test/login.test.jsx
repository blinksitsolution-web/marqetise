import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../pages/admin/AuthPages.jsx'

const login = vi.fn().mockRejectedValue({ response: { data: { message: 'Incorrect email or password.' } } })

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login }),
}))

vi.mock('../context/SiteContext', () => ({
  useSite: () => ({ site: { settings: {} }, error: '' }),
}))

describe('admin login', () => {
  it('asks for a valid email and shows the server error', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'person@marqetise.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument()
  })
})
