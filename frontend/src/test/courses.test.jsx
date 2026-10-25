import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CoursesPage from '../pages/public/CoursesPage.jsx'
import { api } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: { get: vi.fn() },
  }
})

vi.mock('../context/SiteContext', () => ({
  useSite: () => ({ site: { blocks: {}, faqs: {} }, error: '' }),
}))

describe('course list', () => {
  it('shows a next page control when more courses exist', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{ id: 1, title: 'First course', slug: 'first', summary: 'Summary', category: 'Marketing', level: 'Beginner', duration_label: '1 day' }],
        meta: { current_page: 1, last_page: 2 },
      },
    })

    const user = userEvent.setup()
    render(<MemoryRouter><CoursesPage /></MemoryRouter>)

    expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })
})
